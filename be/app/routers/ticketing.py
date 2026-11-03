"""
Event Ticketing API — Oziktag x Summarecon Mall Bandung.

Public     : GET  /api/events/health, GET /api/events/seats
Logged-in  : POST /api/events/seats/{code}/reserve | /release | /confirm
Admin/gate : POST /api/events/gate/validate-qr, GET /api/events/admin/manifest,
             POST /api/events/admin/seed, POST /api/events/admin/tickets/{id}/refund,
             PATCH /api/events/admin/tickets/{id}/attendee
"""

from __future__ import annotations

import re
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.dependencies import get_admin_user, get_current_user
from app.services import ticketing_service as svc
from app.services.ticket_crypto import TicketCryptoConfigError
from app.utils.limiter import MemoryRateLimiter

router = APIRouter(prefix="/api/events", tags=["Event Ticketing"])

SEAT_CODE_PATTERN = r"^[A-Z]-\d{2}$"
SeatCode = Path(..., pattern=SEAT_CODE_PATTERN, description="Kode kursi, contoh: A-01")
TicketId = Path(..., pattern=r"^[0-9a-fA-F-]{36}$")

reserve_limiter = MemoryRateLimiter(max_requests=20, window_seconds=60)
gate_limiter = MemoryRateLimiter(max_requests=120, window_seconds=60)


# ──────────────────────── Schemas ────────────────────────
class HoldTokenBody(BaseModel):
    holdToken: str = Field(..., min_length=20, max_length=128)


class ConfirmBody(HoldTokenBody):
    buyerName: str = Field(..., min_length=2, max_length=120)
    buyerContact: str = Field(..., min_length=6, max_length=32)
    buyerEmail: Optional[EmailStr] = None
    paymentMethod: Literal["QRIS_OZIKTAG", "ESCROW_WALLET", "VIRTUAL_ACCOUNT"] = "QRIS_OZIKTAG"

    @field_validator("buyerName")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        return " ".join(v.split())

    @field_validator("buyerContact")
    @classmethod
    def _phone(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"\+?[0-9 \-]{6,32}", v):
            raise ValueError("Nomor kontak tidak valid.")
        return v


class GateValidateBody(BaseModel):
    qr: str = Field(..., min_length=1, max_length=1024)
    gate: str = Field("Gate Utama", min_length=1, max_length=64)


class AttendeeUpdateBody(BaseModel):
    buyerName: str = Field(..., min_length=2, max_length=120)
    buyerContact: str = Field(..., min_length=6, max_length=32)
    buyerEmail: Optional[EmailStr] = None


class SeedBody(BaseModel):
    reset: bool = False
    confirm: Optional[str] = None  # must be "RESET" when reset=True


# ──────────────────────── Error mapping ────────────────────────
def _error(exc: Exception) -> JSONResponse:
    if isinstance(exc, svc.TicketingError):
        return JSONResponse(status_code=exc.status_code, content={"code": exc.code, "detail": exc.message})
    if isinstance(exc, TicketCryptoConfigError):
        return JSONResponse(
            status_code=503,
            content={"code": "TICKETING_NOT_CONFIGURED", "detail": "Ticketing belum dikonfigurasi (TICKET_HMAC_SECRET)."},
        )
    raise exc


# ──────────────────────── Public ────────────────────────
@router.get("/health")
async def health():
    return {"status": "ok", "service": "oziktag-event-ticketing"}


@router.get("/seats")
async def get_seats():
    return await svc.list_public_seats()


# ──────────────────────── Buyer flow ────────────────────────
@router.post("/seats/{seat_code}/reserve")
async def reserve(seat_code: str = SeatCode, current_user: dict = Depends(get_current_user)):
    reserve_limiter.check_rate_limit(f"reserve:{current_user['id']}")
    try:
        hold = await svc.reserve_seat(seat_code, current_user["id"])
    except Exception as exc:  # noqa: BLE001 - mapped below
        return _error(exc)
    return {
        "seatCode": hold.seat_code,
        "holdToken": hold.hold_token,  # returned once; only its SHA-256 is stored
        "reservedUntilMs": hold.reserved_until_ms,
        "serverNowMs": hold.server_now_ms,
        "holdSeconds": svc.HOLD_SECONDS,
    }


@router.post("/seats/{seat_code}/release")
async def release(body: HoldTokenBody, seat_code: str = SeatCode, current_user: dict = Depends(get_current_user)):
    released = await svc.release_seat(seat_code, body.holdToken)
    return {"released": released}


@router.post("/seats/{seat_code}/confirm")
async def confirm(body: ConfirmBody, seat_code: str = SeatCode, current_user: dict = Depends(get_current_user)):
    """Simulated payment: marks the held seat SOLD and issues a signed QR pass."""
    try:
        ticket = await svc.confirm_payment(
            seat_code=seat_code,
            hold_token=body.holdToken,
            user_id=current_user["id"],
            buyer_name=body.buyerName,
            buyer_contact=body.buyerContact,
            buyer_email=str(body.buyerEmail) if body.buyerEmail else None,
            payment_method=body.paymentMethod,
        )
    except Exception as exc:  # noqa: BLE001
        return _error(exc)
    return {
        "ticketId": ticket.ticket_id,
        "seatCode": ticket.seat_code,
        "category": ticket.category,
        "amount": ticket.amount,
        "qr": ticket.qr,
        "issuedAt": ticket.issued_at,
        "paymentStatus": "PAID",
        "checkInStatus": "UNUSED",
    }


# ──────────────────────── Gate (panitia) ────────────────────────
@router.post("/gate/validate-qr")
async def validate_qr(body: GateValidateBody, current_user: dict = Depends(get_admin_user)):
    gate_limiter.check_rate_limit(f"gate:{current_user['id']}")
    try:
        outcome = await svc.validate_gate_qr(body.qr, body.gate)
    except Exception as exc:  # noqa: BLE001
        return _error(exc)
    return {
        "result": outcome.result,  # VALID (green) | ALREADY_USED (yellow) | INVALID (red)
        "message": outcome.message,
        "ticketId": outcome.ticket_id,
        "seatCode": outcome.seat_code,
        "category": outcome.category,
        "buyerName": outcome.buyer_name,
        "checkedInAtMs": outcome.checked_in_at_ms,
        "checkedInGate": outcome.checked_in_gate,
    }


# ──────────────────────── Admin ────────────────────────
@router.get("/admin/manifest")
async def manifest(_: dict = Depends(get_admin_user)):
    return await svc.admin_manifest()


@router.post("/admin/seed")
async def seed(body: SeedBody, _: dict = Depends(get_admin_user)):
    if body.reset and body.confirm != "RESET":
        raise HTTPException(status_code=400, detail='Reset membutuhkan confirm="RESET".')
    created = await svc.seed_seats(reset=body.reset)
    return {"created": created}


@router.post("/admin/tickets/{ticket_id}/refund")
async def refund(ticket_id: str = TicketId, _: dict = Depends(get_admin_user)):
    try:
        await svc.refund_ticket(ticket_id)
    except Exception as exc:  # noqa: BLE001
        return _error(exc)
    return {"refunded": True}


@router.patch("/admin/tickets/{ticket_id}/attendee")
async def update_attendee(body: AttendeeUpdateBody, ticket_id: str = TicketId, _: dict = Depends(get_admin_user)):
    try:
        await svc.update_attendee(
            ticket_id, body.buyerName, body.buyerContact, str(body.buyerEmail) if body.buyerEmail else None
        )
    except Exception as exc:  # noqa: BLE001
        return _error(exc)
    return {"updated": True}

