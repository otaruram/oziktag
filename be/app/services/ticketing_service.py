"""
Oziktag Event Ticketing & Escrow Auto-Settlement Service.

All state transitions that matter for correctness are single conditional SQL
statements (compare-and-set). PostgreSQL row-level locking guarantees that when
N requests race for the same row, exactly one UPDATE matches its WHERE clause;
the others see the already-updated row version and match 0 rows.

  reserve   : AVAILABLE | (RESERVED and expired)  -> RESERVED   (1 winner, rest 409)
  confirm   : RESERVED and own hold and not expired -> SOLD + Escrow HELD (1 winner)
  check-in  : PAID and UNUSED and hash matches      -> USED + Escrow RELEASED -> Organizer Wallet credited
  refund    : PAID and UNUSED                       -> REFUNDED + Seat AVAILABLE

Time is always taken from the database clock (NOW() in UTC) so app-server clock
skew cannot extend or shorten a hold.
"""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Literal

from app.config import get_settings
from app.database import db
from app.services.ticket_crypto import issue_qr, new_hold_token, sha256_hex, verify_qr

HOLD_SECONDS = 5 * 60
ESCROW_FEE_RATE = Decimal("0.025")  # 2.5% Oziktag Escrow & Payment Gateway fee
# Prisma stores DateTime as `timestamp(3) without time zone` in UTC.
NOW_UTC = "(NOW() AT TIME ZONE 'UTC')"

GateResult = Literal["VALID", "ALREADY_USED", "INVALID"]


# ──────────────────────── Errors ────────────────────────
class TicketingError(Exception):
    status_code = 400
    code = "TICKETING_ERROR"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class SeatNotFound(TicketingError):
    status_code = 404
    code = "SEAT_NOT_FOUND"


class SeatConflict(TicketingError):
    status_code = 409
    code = "SEAT_CONFLICT"


class HoldExpiredOrInvalid(TicketingError):
    status_code = 409
    code = "HOLD_EXPIRED_OR_INVALID"


class TicketStateError(TicketingError):
    status_code = 409
    code = "TICKET_STATE_CONFLICT"


# ──────────────────────── Seat layout (seed) ────────────────────────
SEAT_ROWS = "ABCDEFGHIJ"
CATEGORY_PRICES: dict[str, int] = {"VIP": 250_000, "REGULAR": 100_000, "WING": 75_000}


def _category_for(row: str, col: int) -> str:
    if row in ("A", "B"):
        return "VIP"
    if col in (1, 2, 9, 10):
        return "WING"
    return "REGULAR"


def build_seat_layout() -> list[dict[str, Any]]:
    seats = []
    for row in SEAT_ROWS:
        for col in range(1, 11):
            category = _category_for(row, col)
            seats.append(
                {
                    "seatCode": f"{row}-{col:02d}",
                    "rowLabel": row,
                    "colNumber": col,
                    "category": category,
                    "price": Decimal(CATEGORY_PRICES[category]),
                }
            )
    return seats


async def seed_seats(reset: bool = False) -> int:
    """Create the seat map. With reset=True all tickets are wiped first (admin only)."""
    if reset:
        await db.tickettransaction.delete_many()
        await db.seat.delete_many()
    existing = await db.seat.count()
    if existing > 0:
        return 0
    return await db.seat.create_many(data=build_seat_layout(), skip_duplicates=True)


# ──────────────────────── Events Management ────────────────────────
async def list_events(organizer_id: str | None = None) -> list[dict[str, Any]]:
    rows = await db.query_raw(
        """
        SELECT e.id, e.organizer_id, e.title, e.venue, e.date, e.categories,
               COUNT(s.id)::int AS total_seats,
               COUNT(s.id) FILTER (WHERE s.status = 'SOLD')::int AS sold_seats,
               COALESCE(SUM(t.amount) FILTER (WHERE t.payment_status = 'PAID'), 0)::text AS gross_revenue,
               COALESCE(SUM(t.net_amount) FILTER (WHERE t.escrow_status = 'HELD' AND t.payment_status = 'PAID'), 0)::text AS escrow_held,
               COALESCE(SUM(t.net_amount) FILTER (WHERE t.escrow_status = 'RELEASED' AND t.payment_status = 'PAID'), 0)::text AS escrow_released
          FROM events e
          LEFT JOIN event_seats s ON s.event_id = e.id
          LEFT JOIN ticket_transactions t ON t.seat_id = s.id AND t.payment_status = 'PAID'
         GROUP BY e.id
         ORDER BY e.created_at DESC
        """
    )
    return rows


async def create_event(
    organizer_id: str | None,
    title: str,
    venue: str,
    date: str,
    categories: dict[str, Any],
) -> dict[str, Any]:
    event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
    cat_json = json.dumps(categories)
    rows = await db.query_raw(
        f"""
        INSERT INTO events (id, organizer_id, title, venue, date, categories, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, {NOW_UTC}, {NOW_UTC})
        RETURNING id, organizer_id, title, venue, date, categories
        """,
        event_id,
        organizer_id,
        title,
        venue,
        date,
        cat_json,
    )
    return rows[0]


# ──────────────────────── Queries ────────────────────────
async def list_public_seats() -> dict[str, Any]:
    """Public seat map. Never exposes buyer PII or hold tokens."""
    rows = await db.query_raw(
        f"""
        SELECT seat_code, row_label, col_number, category::text AS category,
               price::text AS price,
               CASE WHEN status = 'RESERVED' AND reserved_until < {NOW_UTC}
                    THEN 'AVAILABLE' ELSE status::text END AS status,
               CASE WHEN status = 'RESERVED' AND reserved_until >= {NOW_UTC}
                    THEN (EXTRACT(EPOCH FROM reserved_until) * 1000)::bigint END AS reserved_until_ms
        FROM event_seats
        ORDER BY row_label, col_number
        """
    )
    return {"serverNowMs": int(time.time() * 1000), "seats": rows}


# ──────────────────────── Reserve (anti double-booking) ────────────────────────
@dataclass
class HoldResult:
    seat_code: str
    hold_token: str
    reserved_until_ms: int
    server_now_ms: int


async def reserve_seat(seat_code: str, user_id: str) -> HoldResult:
    hold_token, hold_hash = new_hold_token()

    async with db.tx() as tx:
        # Release any other active hold of this user (one seat per user at a time).
        await tx.execute_raw(
            f"""
            UPDATE event_seats
               SET status = 'AVAILABLE', reserved_until = NULL, hold_token_hash = NULL,
                   held_by_user_id = NULL, updated_at = {NOW_UTC}
             WHERE held_by_user_id = $1 AND status = 'RESERVED' AND seat_code <> $2
            """,
            user_id,
            seat_code,
        )

        # Atomic compare-and-set. Exactly one concurrent request can match.
        rows = await tx.query_raw(
            f"""
            UPDATE event_seats
               SET status = 'RESERVED',
                   reserved_until = {NOW_UTC} + INTERVAL '{HOLD_SECONDS} seconds',
                   hold_token_hash = $2,
                   held_by_user_id = $3,
                   buyer_name = NULL, buyer_contact = NULL, buyer_email = NULL,
                   updated_at = {NOW_UTC}
             WHERE seat_code = $1
               AND (status = 'AVAILABLE'
                    OR (status = 'RESERVED' AND reserved_until < {NOW_UTC}))
         RETURNING seat_code,
                   (EXTRACT(EPOCH FROM reserved_until) * 1000)::bigint AS reserved_until_ms,
                   (EXTRACT(EPOCH FROM {NOW_UTC}) * 1000)::bigint AS server_now_ms
            """,
            seat_code,
            hold_hash,
            user_id,
        )

    if len(rows) == 1:
        row = rows[0]
        return HoldResult(
            seat_code=row["seat_code"],
            hold_token=hold_token,
            reserved_until_ms=int(row["reserved_until_ms"]),
            server_now_ms=int(row["server_now_ms"]),
        )

    seat_rows = await db.query_raw(
        "SELECT status::text AS status FROM event_seats WHERE seat_code = $1",
        seat_code,
    )
    if not seat_rows:
        raise SeatNotFound(f"Kursi {seat_code} tidak ditemukan.")
    if seat_rows[0]["status"] == "SOLD":
        raise SeatConflict(f"Kursi {seat_code} sudah terjual.")
    raise SeatConflict(f"Kursi {seat_code} sedang dikunci oleh pengunjung lain. Silakan pilih kursi lain.")


async def release_seat(seat_code: str, hold_token: str) -> bool:
    count = await db.execute_raw(
        f"""
        UPDATE event_seats
           SET status = 'AVAILABLE', reserved_until = NULL, hold_token_hash = NULL,
               held_by_user_id = NULL, updated_at = {NOW_UTC}
         WHERE seat_code = $1 AND status = 'RESERVED' AND hold_token_hash = $2
        """,
        seat_code,
        sha256_hex(hold_token),
    )
    return count == 1


# ──────────────────────── Confirm payment -> Route to Oziktag Escrow ────────────────────────
@dataclass
class IssuedTicket:
    ticket_id: str
    seat_code: str
    category: str
    amount: str
    escrow_fee: str
    net_amount: str
    escrow_status: str
    qr: str
    issued_at: int


async def confirm_payment(
    seat_code: str,
    hold_token: str,
    user_id: str,
    buyer_name: str,
    buyer_contact: str,
    buyer_email: str | None,
    payment_method: str,
    organizer_id: str | None = None,
) -> IssuedTicket:
    secret = get_settings().ticket_hmac_secret
    ticket_id = str(uuid.uuid4())
    issued_at = int(time.time())
    qr, signature_hash = issue_qr(secret, ticket_id, seat_code, issued_at)

    async with db.tx() as tx:
        rows = await tx.query_raw(
            f"""
            UPDATE event_seats
               SET status = 'SOLD', reserved_until = NULL, hold_token_hash = NULL,
                   held_by_user_id = NULL,
                   buyer_name = $3, buyer_contact = $4, buyer_email = $5,
                   ticket_hash = $6, updated_at = {NOW_UTC}
             WHERE seat_code = $1
               AND status = 'RESERVED'
               AND hold_token_hash = $2
               AND reserved_until >= {NOW_UTC}
         RETURNING id, category::text AS category, price::text AS price
            """,
            seat_code,
            sha256_hex(hold_token),
            buyer_name,
            buyer_contact,
            buyer_email,
            signature_hash,
        )
        if len(rows) != 1:
            raise HoldExpiredOrInvalid(
                "Sesi reservasi tidak valid atau sudah kedaluwarsa. Silakan pilih kursi kembali."
            )

        seat_row = rows[0]
        gross = Decimal(seat_row["price"])
        escrow_fee = (gross * ESCROW_FEE_RATE).quantize(Decimal("0.01"))
        net_amount = gross - escrow_fee

        await tx.execute_raw(
            f"""
            INSERT INTO ticket_transactions (
                id, seat_id, user_id, buyer_id, organizer_id,
                amount, escrow_fee, net_amount, payment_method,
                payment_status, check_in_status, escrow_status,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $3, $4,
                $5, $6, $7, $8,
                'PAID', 'UNUSED', 'HELD',
                {NOW_UTC}, {NOW_UTC}
            )
            """,
            ticket_id,
            seat_row["id"],
            user_id,
            organizer_id,
            str(gross),
            str(escrow_fee),
            str(net_amount),
            payment_method,
        )

    return IssuedTicket(
        ticket_id=ticket_id,
        seat_code=seat_code,
        category=seat_row["category"],
        amount=str(gross),
        escrow_fee=str(escrow_fee),
        net_amount=str(net_amount),
        escrow_status="HELD",
        qr=qr,
        issued_at=issued_at,
    )


# ──────────────────────── Gate validation + Escrow Auto-Settlement ────────────────────────
@dataclass
class GateOutcome:
    result: GateResult
    message: str
    ticket_id: str | None = None
    seat_code: str | None = None
    category: str | None = None
    buyer_name: str | None = None
    checked_in_at_ms: int | None = None
    checked_in_gate: str | None = None
    escrow_status: str | None = None
    settled_net_amount: str | None = None
    escrow_fee: str | None = None
    wallet_credited: bool = False


async def validate_gate_qr(qr: str, gate: str) -> GateOutcome:
    verified = verify_qr(get_settings().ticket_hmac_secret, qr)
    if verified is None:
        return GateOutcome("INVALID", "Tanda tangan digital HMAC-SHA256 tidak valid. Tiket palsu atau rusak.")

    payload = verified.payload

    async with db.tx() as tx:
        # Atomic check-in + Escrow release: only one scan (across all gates) can flip UNUSED -> USED.
        rows = await tx.query_raw(
            f"""
            UPDATE ticket_transactions t
               SET check_in_status = 'USED',
                   checked_in_at = {NOW_UTC},
                   checked_in_gate = $3,
                   escrow_status = 'RELEASED',
                   escrow_released_at = {NOW_UTC},
                   updated_at = {NOW_UTC}
              FROM event_seats s
             WHERE t.id = $1
               AND s.id = t.seat_id
               AND s.seat_code = $2
               AND s.ticket_hash = $4
               AND t.payment_status = 'PAID'
               AND t.check_in_status = 'UNUSED'
         RETURNING t.id, s.seat_code, s.category::text AS category, s.buyer_name,
                   t.net_amount::text AS net_amount, t.escrow_fee::text AS escrow_fee,
                   t.organizer_id,
                   (EXTRACT(EPOCH FROM t.checked_in_at) * 1000)::bigint AS checked_in_at_ms
            """,
            payload.ticket_id,
            payload.seat_code,
            gate,
            verified.signature_hash,
        )

        if len(rows) == 1:
            r = rows[0]
            net_int = int(Decimal(r["net_amount"]))
            # Auto-settle net earnings into Organizer's Oziktag Dompet Penghasilan (users.escrow_balance)
            credited = await tx.execute_raw(
                f"""
                UPDATE users
                   SET escrow_balance = escrow_balance + $1,
                       updated_at = {NOW_UTC}
                 WHERE id = COALESCE(
                     $2,
                     (SELECT id FROM users WHERE is_admin = TRUE ORDER BY created_at ASC LIMIT 1),
                     (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
                 )
                """,
                net_int,
                r["organizer_id"],
            )
            return GateOutcome(
                "VALID",
                f"Tiket valid! Dana Escrow Rp {net_int:,} otomatis cair ke Dompet Penghasilan Organizer.",
                ticket_id=r["id"],
                seat_code=r["seat_code"],
                category=r["category"],
                buyer_name=r["buyer_name"],
                checked_in_at_ms=int(r["checked_in_at_ms"]),
                checked_in_gate=gate,
                escrow_status="RELEASED",
                settled_net_amount=r["net_amount"],
                escrow_fee=r["escrow_fee"],
                wallet_credited=credited > 0,
            )

    # Not flipped: figure out why (read-only, no state change).
    existing = await db.query_raw(
        """
        SELECT t.id, t.payment_status::text AS payment_status,
               t.check_in_status::text AS check_in_status, t.checked_in_gate,
               t.escrow_status::text AS escrow_status,
               t.net_amount::text AS net_amount, t.escrow_fee::text AS escrow_fee,
               (EXTRACT(EPOCH FROM t.checked_in_at) * 1000)::bigint AS checked_in_at_ms,
               s.seat_code, s.category::text AS category, s.buyer_name, s.ticket_hash
          FROM ticket_transactions t
          JOIN event_seats s ON s.id = t.seat_id
         WHERE t.id = $1
        """,
        payload.ticket_id,
    )
    if not existing:
        return GateOutcome("INVALID", "Tiket tidak terdaftar di database Oziktag.")

    r = existing[0]
    if r["seat_code"] != payload.seat_code or r["ticket_hash"] != verified.signature_hash:
        return GateOutcome("INVALID", "Tiket sudah diganti atau dicabut. Gunakan tiket terbaru.")
    if r["payment_status"] != "PAID":
        return GateOutcome(
            "INVALID",
            "Tiket sudah dibatalkan/direfund (Escrow Refunded).",
            ticket_id=r["id"],
            seat_code=r["seat_code"],
            escrow_status=r["escrow_status"],
        )
    if r["check_in_status"] == "USED":
        return GateOutcome(
            "ALREADY_USED",
            "Tiket sudah pernah di-scan sebelumnya (Anti-Passback Protection). Dana sudah dicairkan.",
            ticket_id=r["id"],
            seat_code=r["seat_code"],
            category=r["category"],
            buyer_name=r["buyer_name"],
            checked_in_at_ms=int(r["checked_in_at_ms"]) if r["checked_in_at_ms"] is not None else None,
            checked_in_gate=r["checked_in_gate"],
            escrow_status=r["escrow_status"],
            settled_net_amount=r["net_amount"],
            escrow_fee=r["escrow_fee"],
            wallet_credited=False,
        )
    return GateOutcome("INVALID", "Status tiket tidak dapat diverifikasi.")


# ──────────────────────── Admin & Manifest ────────────────────────
async def admin_manifest() -> dict[str, Any]:
    seats = await db.query_raw(
        f"""
        SELECT s.seat_code, s.row_label, s.col_number, s.category::text AS category,
               s.price::text AS price,
               CASE WHEN s.status = 'RESERVED' AND s.reserved_until < {NOW_UTC}
                    THEN 'AVAILABLE' ELSE s.status::text END AS status,
               s.buyer_name, s.buyer_contact, s.buyer_email,
               t.id AS ticket_id, t.payment_status::text AS payment_status,
               t.check_in_status::text AS check_in_status, t.checked_in_gate,
               t.escrow_status::text AS escrow_status,
               t.net_amount::text AS net_amount, t.escrow_fee::text AS escrow_fee,
               (EXTRACT(EPOCH FROM t.checked_in_at) * 1000)::bigint AS checked_in_at_ms,
               (EXTRACT(EPOCH FROM t.created_at) * 1000)::bigint AS issued_at_ms
          FROM event_seats s
          LEFT JOIN LATERAL (
                SELECT * FROM ticket_transactions tt
                 WHERE tt.seat_id = s.id AND tt.payment_status = 'PAID'
                 ORDER BY tt.created_at DESC LIMIT 1
          ) t ON TRUE
         ORDER BY s.row_label, s.col_number
        """
    )
    return {"serverNowMs": int(time.time() * 1000), "seats": seats}


async def refund_ticket(ticket_id: str) -> None:
    async with db.tx() as tx:
        rows = await tx.query_raw(
            f"""
            UPDATE ticket_transactions
               SET payment_status = 'REFUNDED',
                   escrow_status = 'REFUNDED',
                   updated_at = {NOW_UTC}
             WHERE id = $1 AND payment_status = 'PAID' AND check_in_status = 'UNUSED'
         RETURNING seat_id
            """,
            ticket_id,
        )
        if len(rows) != 1:
            raise TicketStateError("Tiket tidak bisa direfund (tidak ditemukan, sudah direfund, atau sudah dipakai).")
        await tx.execute_raw(
            f"""
            UPDATE event_seats
               SET status = 'AVAILABLE', buyer_name = NULL, buyer_contact = NULL,
                   buyer_email = NULL, ticket_hash = NULL, updated_at = {NOW_UTC}
             WHERE id = $1
            """,
            rows[0]["seat_id"],
        )


async def update_attendee(ticket_id: str, buyer_name: str, buyer_contact: str, buyer_email: str | None) -> None:
    count = await db.execute_raw(
        f"""
        UPDATE event_seats s
           SET buyer_name = $2, buyer_contact = $3, buyer_email = $4, updated_at = {NOW_UTC}
          FROM ticket_transactions t
         WHERE t.id = $1 AND t.seat_id = s.id AND t.payment_status = 'PAID'
        """,
        ticket_id,
        buyer_name,
        buyer_contact,
        buyer_email,
    )
    if count != 1:
        raise TicketStateError("Tiket tidak ditemukan atau sudah tidak aktif.")
