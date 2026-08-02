import asyncio
import os
import sys

# Add the 'app' directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import get_settings
from app.services.email_service import (
    build_topup_success_email,
    build_topup_failed_email,
    build_newsletter_welcome_email,
    send_email
)

async def main():
    # Override settings for local testing with the provided credentials
    settings = get_settings()
    settings.smtp_host = "smtp.sumopod.com"
    settings.smtp_port = 465
    settings.smtp_user = "cmsahkr8kvkmsr208smn9gkzn"
    settings.smtp_password = "zVTDZQiRQHKuLvRd9bcQzsK6LaDllfXM"
    settings.smtp_from_email = "support@oziktag.my.id"
    
    admin_email = "okitr52@gmail.com"
    
    print("Mempersiapkan pengiriman email tes ke:", admin_email)
    
    # 1. Test Welcome Newsletter Email
    print("\n1. Mengirim Email Welcome Newsletter...")
    subject1, html1 = build_newsletter_welcome_email("Ozi (Admin)")
    success1 = await send_email(admin_email, subject1, html1)
    print("Status:", "Berhasil" if success1 else "Gagal")
    
    # 2. Test Top-Up Success Email
    print("\n2. Mengirim Email Top-Up Success...")
    subject2, html2 = build_topup_success_email("Ozi (Admin)", "Growth", 150, 35000)
    success2 = await send_email(admin_email, subject2, html2)
    print("Status:", "Berhasil" if success2 else "Gagal")
    
    # 3. Test Top-Up Failed Email
    print("\n3. Mengirim Email Top-Up Failed...")
    subject3, html3 = build_topup_failed_email("Ozi (Admin)", "Growth")
    success3 = await send_email(admin_email, subject3, html3)
    print("Status:", "Berhasil" if success3 else "Gagal")
    
    print("\nSemua tes pengiriman selesai!")

if __name__ == "__main__":
    asyncio.run(main())
