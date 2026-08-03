"""Email service — Oziktag notifications via HTTP relay (Render blocks SMTP)."""

import smtplib
import ssl
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from app.config import get_settings


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an HTML email. Tries HTTP relay first (works on Render),
    falls back to direct SMTP.
    This is a SYNC function so BackgroundTasks runs it in a thread pool.
    """
    settings = get_settings()
    
    if not settings.smtp_host or not settings.smtp_user:
        print("[Email] SMTP not configured, skipping.")
        return False

    # Try SMTP directly (with short timeout)
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg["To"] = to_email

        part_html = MIMEText(html_body, "html")
        msg.attach(part_html)

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=context, timeout=10) as server:
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
        print(f"[Email] Successfully sent to {to_email} via SMTP")
        return True
    except Exception as e:
        print(f"[Email] SMTP failed ({e}), trying HTTP relay...")

    # Fallback: HTTP relay via SumoPod
    try:
        resp = httpx.post(
            "https://api.sumopod.com/v1/email/send",
            headers={"Authorization": f"Bearer {settings.sumopod_api_key}"},
            json={
                "from": f"{settings.smtp_from_name} <{settings.smtp_from_email}>",
                "to": to_email,
                "subject": subject,
                "html": html_body,
            },
            timeout=10,
        )
        if resp.status_code < 300:
            print(f"[Email] Successfully sent to {to_email} via HTTP relay")
            return True
        else:
            print(f"[Email] HTTP relay failed: {resp.status_code} {resp.text[:200]}")
            return False
    except Exception as e2:
        print(f"[Email] HTTP relay also failed: {e2}")
        return False


# ──────────────────────── Email Templates ────────────────────────

def _get_base_template(title: str, content: str) -> str:
    """Minimalist white and black base template."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #000000;">
        <!-- Header -->
        <div style="margin-bottom: 32px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">Oziktag.</h2>
        </div>
        
        <!-- Main Content -->
        <div style="margin-bottom: 40px;">
          {content}
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #e5e5e5; padding-top: 24px;">
          <p style="margin: 0; font-size: 12px; color: #666666; line-height: 1.5;">
            Email ini dikirim secara otomatis. Mohon tidak membalas email ini.<br>
            &copy; {datetime.now().year} Oziktag. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </body>
    </html>
    """

def build_topup_success_email(user_name: str, paket: str, credits: int, amount: int) -> tuple[str, str]:
    idr = f"Rp {amount:,}".replace(",", ".")
    subject = f"Pembayaran Berhasil — {credits} Kredit Ditambahkan"
    
    content = f"""
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Pembayaran Berhasil</h1>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #333333;">Halo {user_name},</p>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">Terima kasih. Pembayaran Anda untuk paket <strong>{paket}</strong> sebesar <strong>{idr}</strong> telah berhasil kami terima.</p>
    
    <div style="background-color: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Kredit Ditambahkan</p>
      <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 700;">+{credits}</p>
    </div>
    
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">Kredit sudah otomatis masuk ke akun Anda dan siap digunakan untuk Generate QR Code QC atau layanan API kami.</p>
    """
    
    return subject, _get_base_template("Pembayaran Berhasil", content)


def build_topup_failed_email(user_name: str, paket: str) -> tuple[str, str]:
    subject = f"Pembayaran Gagal — Paket {paket}"
    
    content = f"""
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Pembayaran Gagal</h1>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #333333;">Halo {user_name},</p>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">Kami menginformasikan bahwa proses pembayaran Anda untuk paket <strong>{paket}</strong> telah gagal atau dibatalkan.</p>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #666666;">Saldo Anda tidak terpotong. Jika Anda masih ingin melakukan Top-Up, silakan kembali ke dashboard Oziktag dan buat tagihan baru.</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">Jika Anda merasa ini adalah kesalahan sistem, mohon hubungi tim dukungan kami melalui WhatsApp yang tertera di menu Pengaturan.</p>
    """
    
    return subject, _get_base_template("Pembayaran Gagal", content)


def build_newsletter_welcome_email(user_name: str) -> tuple[str, str]:
    subject = "Selamat Datang di Newsletter Oziktag"
    
    content = f"""
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Terima kasih telah berlangganan!</h1>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #333333;">Halo {user_name},</p>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">Mulai sekarang, Anda akan menjadi yang pertama tahu tentang pembaruan fitur terbaru, tips mengoptimalkan QR Code QC, dan wawasan seputar dunia UMKM kerajinan tangan dari Oziktag.</p>
    
    <div style="background-color: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Apa yang bisa Anda harapkan?</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #333333;">
        <li style="margin-bottom: 8px;">Pembaruan sistem & fitur baru Oziktag</li>
        <li style="margin-bottom: 8px;">Panduan integrasi API dan Otomatisasi</li>
        <li style="margin-bottom: 0;">Promo eksklusif khusus pengguna aktif</li>
      </ul>
    </div>
    
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">Anda selalu bisa menonaktifkan email ini kapan saja melalui menu Pengaturan di dashboard Anda.</p>
    """
    
    return subject, _get_base_template("Selamat Datang", content)


def build_welcome_email(user_name: str) -> tuple[str, str]:
    subject = "Selamat Datang di Oziktag"
    
    content = f"""
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Selamat Datang!</h1>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #333333;">Halo {user_name},</p>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">Akun Oziktag Anda kini telah aktif. Kami sangat antusias menyambut Anda di platform Quality Control & Tracking inovatif untuk produk kerajinan Anda.</p>
    
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Langkah Selanjutnya:</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #333333;">
        <li style="margin-bottom: 8px;">Eksplorasi Dashboard untuk melihat analisis produk</li>
        <li style="margin-bottom: 8px;">Top-Up kredit pertama Anda untuk mulai generate QR Code</li>
        <li style="margin-bottom: 0;">Gunakan fitur Tracking Lite untuk melacak perjalanan produk</li>
      </ul>
    </div>
    """
    
    return subject, _get_base_template("Selamat Datang", content)


def build_escrow_released_email(user_name: str, product_name: str) -> tuple[str, str]:
    subject = f"Dana Dicairkan — {product_name}"
    
    content = f"""
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Pencairan Dana Berhasil</h1>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #333333;">Halo {user_name},</p>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">Dana escrow untuk produk <strong>{product_name}</strong> telah berhasil dicairkan ke rekening Anda.</p>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #666666;">Silakan cek mutasi rekening bank Anda. Proses masuknya dana mungkin membutuhkan waktu hingga 1x24 jam kerja tergantung kebijakan bank.</p>
    """
    
    return subject, _get_base_template("Pencairan Berhasil", content)


def build_admin_withdrawal_notification_email(seller_name: str, amount: int, bank_details: str) -> tuple[str, str]:
    subject = f"Permintaan Pencairan Dana Escrow - {seller_name}"
    idr = f"Rp {amount:,}".replace(",", ".")
    
    content = f"""
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Permintaan Pencairan Dana</h1>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #333333;">Halo Admin,</p>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">Terdapat permintaan pencairan dana escrow baru dari penjual <strong>{seller_name}</strong>.</p>
    
    <div style="background-color: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #333333;">
        <li style="margin-bottom: 8px;"><strong>Jumlah:</strong> {idr}</li>
        <li style="margin-bottom: 0;"><strong>Tujuan:</strong> {bank_details}</li>
      </ul>
    </div>
    
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">Silakan segera memproses pencairan ini melalui Dashboard Admin Oziktag.</p>
    """
    
    return subject, _get_base_template("Permintaan Pencairan", content)
