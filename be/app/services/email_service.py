"""Email service — SMTP email sending for Oziktag notifications."""

import httpx
from app.config import get_settings


async def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an HTML email by proxying to the Node.js backend.
    Returns True on success, False on failure.
    """
    settings = get_settings()
    node_url = settings.node_backend_url

    if not node_url:
        print("[Email] Node backend URL not configured, skipping email.")
        return False

    payload = {
        "to": to_email,
        "subject": subject,
        "html": html_body
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{node_url}/api/email/send", json=payload, timeout=10.0)
            response.raise_for_status()
            print(f"[Email] Successfully sent via Node backend to {to_email}")
            return True
    except Exception as e:
        print(f"[Email] Failed to send via Node backend to {to_email}: {e}")
        return False


# ──────────────────────── Email Templates ────────────────────────

def build_topup_success_email(user_name: str, paket: str, credits: int, amount: int) -> tuple[str, str]:
    """Build subject and HTML body for top-up success notification."""
    idr = f"Rp {amount:,}".replace(",", ".")
    subject = f"✅ Top-Up Berhasil — {credits} Kredit Ditambahkan"
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; margin: 0;">✅ Pembayaran Berhasil</h1>
      </div>
      <p>Halo <strong>{user_name}</strong>,</p>
      <p>Top-up paket <strong>{paket}</strong> Anda sebesar <strong>{idr}</strong> telah berhasil diproses.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 36px; font-weight: bold; color: #16a34a; margin: 0;">+{credits}</p>
        <p style="color: #4b5563; margin: 4px 0 0;">Kredit Ditambahkan</p>
      </div>
      <p style="font-size: 13px; color: #6b7280;">Kredit sudah bisa langsung digunakan untuk Generate QR Code QC atau Tracking Lite di dashboard Oziktag Anda.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">Email ini dikirim otomatis oleh sistem Oziktag. Jangan membalas email ini.</p>
    </div>
    """
    return subject, html


def build_welcome_email(user_name: str) -> tuple[str, str]:
    """Build subject and HTML body for welcome email after registration."""
    subject = "🎉 Selamat Datang di Oziktag!"
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; margin: 0;">🎉 Selamat Datang!</h1>
      </div>
      <p>Halo <strong>{user_name}</strong>,</p>
      <p>Akun Oziktag Anda sudah aktif. Sekarang Anda bisa:</p>
      <ul style="padding-left: 20px; line-height: 1.8;">
        <li>Generate QR Code QC untuk produk Anda</li>
        <li>Gunakan fitur Tracking Lite untuk lacak pengiriman</li>
        <li>Integrasikan API untuk otomatisasi</li>
      </ul>
      <p>Mulai dengan top-up kredit pertama Anda untuk mulai generate QR Code.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">Email ini dikirim otomatis oleh sistem Oziktag. Jangan membalas email ini.</p>
    </div>
    """
    return subject, html


def build_escrow_released_email(user_name: str, product_name: str) -> tuple[str, str]:
    """Build subject and HTML body for escrow release notification."""
    subject = f"💰 Dana Dicairkan — {product_name}"
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; margin: 0;">💰 Dana Berhasil Dicairkan</h1>
      </div>
      <p>Halo <strong>{user_name}</strong>,</p>
      <p>Dana escrow untuk produk <strong>{product_name}</strong> telah berhasil dicairkan ke rekening Anda.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 18px; font-weight: bold; color: #16a34a; margin: 0;">Pencairan Berhasil ✅</p>
      </div>
      <p style="font-size: 13px; color: #6b7280;">Silakan cek saldo rekening bank Anda. Dana biasanya masuk dalam 1x24 jam kerja.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">Email ini dikirim otomatis oleh sistem Oziktag. Jangan membalas email ini.</p>
    </div>
    """
    return subject, html
