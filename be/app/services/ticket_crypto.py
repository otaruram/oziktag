"""
Oziktag Ticket Cryptography (HMAC-SHA256 stateful QR passes).

QR wire format (compact, URL-safe, no JSON canonicalisation ambiguity):

    OZT1.<base64url(json payload)>.<base64url(hmac_sha256(secret, "OZT1." + payload_b64))>

payload = {"tid": <ticket transaction id>, "sc": <seat code>, "iat": <unix seconds>}

Security notes
- The HMAC is computed over the exact base64 bytes that travel in the QR, so the
  verifier never re-serialises JSON (prevents canonicalisation bugs).
- Comparison uses hmac.compare_digest (constant time).
- The database never stores the signature itself, only SHA-256(signature)
  (`Seat.ticketHash`). A DB read leak therefore does not yield usable QR passes,
  and re-issuing / refunding a ticket invalidates older passes.
- There is deliberately NO fallback secret. If TICKET_HMAC_SECRET is missing or
  too short the ticketing endpoints refuse to run.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass

QR_PREFIX = "OZT1"
MIN_SECRET_LENGTH = 32
MAX_QR_LENGTH = 1024


class TicketCryptoConfigError(RuntimeError):
    """Raised when the HMAC secret is not configured safely."""


@dataclass(frozen=True)
class QrPayload:
    ticket_id: str
    seat_code: str
    issued_at: int


@dataclass(frozen=True)
class VerifiedQr:
    payload: QrPayload
    signature_hash: str  # sha256 hex of the raw signature bytes


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _require_secret(secret: str) -> bytes:
    if not secret or len(secret) < MIN_SECRET_LENGTH:
        raise TicketCryptoConfigError(
            f"TICKET_HMAC_SECRET must be set and at least {MIN_SECRET_LENGTH} characters long."
        )
    return secret.encode("utf-8")


def sha256_hex(value: str | bytes) -> str:
    if isinstance(value, str):
        value = value.encode("utf-8")
    return hashlib.sha256(value).hexdigest()


def new_hold_token() -> tuple[str, str]:
    """Return (plaintext_token_for_client, sha256_hash_for_db)."""
    token = secrets.token_urlsafe(32)
    return token, sha256_hex(token)


def _sign(secret_bytes: bytes, signing_input: str) -> bytes:
    return hmac.new(secret_bytes, signing_input.encode("ascii"), hashlib.sha256).digest()


def issue_qr(secret: str, ticket_id: str, seat_code: str, issued_at: int | None = None) -> tuple[str, str]:
    """
    Create a signed QR string.

    Returns (qr_string, signature_hash). Persist only `signature_hash`.
    """
    secret_bytes = _require_secret(secret)
    payload = {
        "tid": ticket_id,
        "sc": seat_code,
        "iat": int(issued_at if issued_at is not None else time.time()),
    }
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signing_input = f"{QR_PREFIX}.{payload_b64}"
    signature = _sign(secret_bytes, signing_input)
    return f"{signing_input}.{_b64url_encode(signature)}", sha256_hex(signature)


def verify_qr(secret: str, qr: str) -> VerifiedQr | None:
    """
    Verify a QR string. Returns None for ANY malformed or forged input
    (callers map that to INVALID without leaking which check failed).
    """
    secret_bytes = _require_secret(secret)

    if not isinstance(qr, str) or len(qr) > MAX_QR_LENGTH:
        return None

    parts = qr.strip().split(".")
    if len(parts) != 3 or parts[0] != QR_PREFIX:
        return None

    _, payload_b64, sig_b64 = parts
    try:
        presented_sig = _b64url_decode(sig_b64)
    except (ValueError, TypeError):
        return None

    expected_sig = _sign(secret_bytes, f"{QR_PREFIX}.{payload_b64}")
    if not hmac.compare_digest(presented_sig, expected_sig):
        return None

    # Only parse the payload AFTER the signature is proven authentic.
    try:
        data = json.loads(_b64url_decode(payload_b64))
        payload = QrPayload(
            ticket_id=str(data["tid"]),
            seat_code=str(data["sc"]),
            issued_at=int(data["iat"]),
        )
    except (ValueError, KeyError, TypeError):
        return None

    return VerifiedQr(payload=payload, signature_hash=sha256_hex(presented_sig))

