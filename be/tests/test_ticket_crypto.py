"""Unit tests for HMAC-SHA256 QR signing. Run: python -m unittest tests.test_ticket_crypto"""

import unittest

from app.services.ticket_crypto import (
    TicketCryptoConfigError,
    _b64url_decode,
    _b64url_encode,
    issue_qr,
    new_hold_token,
    sha256_hex,
    verify_qr,
)

SECRET = "test-secret-" + "x" * 40
OTHER_SECRET = "another-secret-" + "y" * 40


class TicketCryptoTests(unittest.TestCase):
    def test_roundtrip_valid(self):
        qr, sig_hash = issue_qr(SECRET, "tid-123", "A-01", issued_at=1_700_000_000)
        result = verify_qr(SECRET, qr)
        self.assertIsNotNone(result)
        self.assertEqual(result.payload.ticket_id, "tid-123")
        self.assertEqual(result.payload.seat_code, "A-01")
        self.assertEqual(result.payload.issued_at, 1_700_000_000)
        self.assertEqual(result.signature_hash, sig_hash)

    def test_wrong_secret_rejected(self):
        qr, _ = issue_qr(SECRET, "tid-123", "A-01")
        self.assertIsNone(verify_qr(OTHER_SECRET, qr))

    def test_tampered_payload_rejected(self):
        qr, _ = issue_qr(SECRET, "tid-123", "A-01")
        prefix, payload_b64, sig = qr.split(".")
        forged = _b64url_decode(payload_b64).replace(b"A-01", b"A-02")
        self.assertIsNone(verify_qr(SECRET, f"{prefix}.{_b64url_encode(forged)}.{sig}"))

    def test_tampered_signature_rejected(self):
        qr, _ = issue_qr(SECRET, "tid-123", "A-01")
        prefix, payload_b64, sig = qr.split(".")
        flipped = bytearray(_b64url_decode(sig))
        flipped[0] ^= 0x01
        self.assertIsNone(verify_qr(SECRET, f"{prefix}.{payload_b64}.{_b64url_encode(bytes(flipped))}"))

    def test_garbage_rejected(self):
        for bad in ["", "OZT-BDG26-A02", "OZT1.abc", "OZT1.a.b.c", "XYZ1.e30.AAAA", "OZT1.!!!.@@@", "x" * 5000]:
            self.assertIsNone(verify_qr(SECRET, bad), bad[:20])

    def test_missing_or_short_secret_refuses(self):
        with self.assertRaises(TicketCryptoConfigError):
            issue_qr("", "tid", "A-01")
        with self.assertRaises(TicketCryptoConfigError):
            verify_qr("short", "OZT1.a.b")

    def test_hold_token_only_hash_persisted(self):
        token, token_hash = new_hold_token()
        self.assertGreaterEqual(len(token), 40)
        self.assertEqual(token_hash, sha256_hex(token))
        self.assertNotEqual(token, token_hash)


if __name__ == "__main__":
    unittest.main()

