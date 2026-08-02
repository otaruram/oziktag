"""Service for handling user retention, churn checks, and inactive warnings."""

import asyncio
from datetime import datetime, timezone, timedelta
from functools import partial
from app.database import db
from app.services.email_service import send_email

async def retention_loop():
    """Daily check for inactive users to send warnings and deactivate QR codes."""
    while True:
        try:
            now = datetime.now(timezone.utc)
            # Find users with 0 credits
            inactive_users = await db.user.find_many(
                where={"sisaKredit": 0}
            )
            
            for user in inactive_users:
                if not user.lastSeenAt:
                    continue
                
                days_inactive = (now - user.lastSeenAt).days
                
                # Only process if they opted into promo/news emails
                if hasattr(user, 'receivesPromoEmails') and not user.receivesPromoEmails:
                    continue
                
                if days_inactive == 75:
                    # Send H-15 Warning
                    subject = "Aksi Diperlukan: Masa Aktif QR Code Anda"
                    html = f"""
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #000000; border: 1px solid #eaeaea; border-radius: 8px;">
                        <h2 style="margin-top: 0;">Halo {user.nama or user.email.split('@')[0]},</h2>
                        <p>Kami perhatikan Anda sudah tidak aktif selama 75 hari dan saldo kredit Anda saat ini <strong>0</strong>.</p>
                        <p>Untuk menjaga seluruh QR Code Anda tetap aktif dan dapat di-scan oleh pelanggan, silakan lakukan <strong>Top-Up Kredit</strong> dalam waktu <strong>15 hari</strong> ke depan.</p>
                        <p>Jika tidak ada aktivitas atau Top-Up hingga hari ke-90, QR Code Anda akan <strong>dinonaktifkan sementara</strong>.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://oziktag.my.id/pricing" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Top-Up Sekarang</a>
                        </div>
                        <p style="font-size: 12px; color: #666666; margin-bottom: 0;">Tim Oziktag</p>
                    </div>
                    """
                    await asyncio.to_thread(send_email, user.email, subject, html)
                    print(f"[Retention] Sent H-15 warning to {user.email}")
                    
                elif days_inactive == 90:
                    # Send Deactivated Notice
                    subject = "QR Code Dinonaktifkan Sementara"
                    html = f"""
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #000000; border: 1px solid #eaeaea; border-radius: 8px;">
                        <h2 style="margin-top: 0;">Halo {user.nama or user.email.split('@')[0]},</h2>
                        <p>Karena akun Anda tidak aktif selama 90 hari dan saldo kredit Anda 0, seluruh QR Code produk Anda saat ini <strong>dinonaktifkan sementara</strong>.</p>
                        <p>Jangan khawatir! QR Code Anda tidak dihapus. Anda dapat mengaktifkannya kembali detik ini juga cukup dengan melakukan <strong>Login dan Top-Up Kredit</strong>.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://oziktag.my.id/pricing" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Aktifkan Kembali QR Code</a>
                        </div>
                        <p style="font-size: 12px; color: #666666; margin-bottom: 0;">Tim Oziktag</p>
                    </div>
                    """
                    await asyncio.to_thread(send_email, user.email, subject, html)
                    print(f"[Retention] Sent deactivated notice to {user.email}")
                    
        except Exception as e:
            print(f"[Retention] Loop error: {e}")
            await asyncio.sleep(60)
            continue
            
        # Sleep for 24 hours
        await asyncio.sleep(86400)
