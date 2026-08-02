from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from app.database import db

async def verify_buyer_pin(product_id: str, pin: str) -> Dict[str, Any]:
    """
    Verify the PIN entered by the buyer.
    If valid, change escrowStatus to RELEASED and simulate payout.
    """
    product = await db.trackingproduct.find_unique(where={"id": product_id})
    if not product:
        raise ValueError("Produk tidak ditemukan.")

    if product.buyerPin != pin:
        raise ValueError("PIN yang Anda masukkan salah.")

    if product.escrowStatus == "RELEASED":
        raise ValueError("Dana untuk transaksi ini sudah dicairkan sebelumnya.")

    # Update escrow state
    now = datetime.now(timezone.utc)
    updated_product = await db.trackingproduct.update(
        where={"id": product_id},
        data={
            "escrowStatus": "RELEASED",
            "payoutReleasedAt": now,
        }
    )

    # In a real app, trigger a webhook to a payment gateway (e.g., Xendit, Midtrans)
    # to release funds to the seller here.

    return {
        "success": True,
        "message": "PIN valid. Dana berhasil dicairkan ke penjual.",
        "payoutReleasedAt": now.isoformat()
    }


async def auto_release_escrow_funds():
    """
    Cron job to check all products with escrowStatus == HELD
    and deliveredAt < 48 hours ago. Release them automatically.
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=48)
    
    products_to_release = await db.trackingproduct.find_many(
        where={
            "escrowStatus": "HELD",
            "deliveredAt": {
                "lt": cutoff_time
            }
        }
    )

    if not products_to_release:
        return 0

    now = datetime.now(timezone.utc)
    
    # Simulate webhook/payout for all products at once
    updated_count = await db.trackingproduct.update_many(
        where={
            "escrowStatus": "HELD",
            "deliveredAt": {
                "lt": cutoff_time
            }
        },
        data={
            "escrowStatus": "RELEASED",
            "payoutReleasedAt": now
        }
    )

    return updated_count
