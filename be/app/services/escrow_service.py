from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from app.database import db

async def verify_buyer_pin(product_id: str, pin: str) -> Dict[str, Any]:
    """
    Verify the PIN entered by the buyer.
    If valid, change currentStatus to DELIVERED and set deliveredAt to start the 24h settlement window.
    """
    product = await db.trackingproduct.find_unique(where={"id": product_id})
    if not product:
        raise ValueError("Produk tidak ditemukan.")

    if product.buyerPin != pin:
        raise ValueError("PIN yang Anda masukkan salah.")

    if product.currentStatus == "DELIVERED":
        raise ValueError("Pesanan ini sudah dikonfirmasi sebelumnya.")
        
    if product.escrowStatus == "RELEASED":
        raise ValueError("Dana untuk transaksi ini sudah dicairkan sebelumnya.")

    now = datetime.now(timezone.utc)
    
    async with db.tx() as tx:
        updated_product = await tx.trackingproduct.update(
            where={"id": product_id},
            data={
                "currentStatus": "DELIVERED",
                "deliveredAt": now,
            }
        )
        # Note: We do NOT release the money yet. It will be released automatically
        # after 24h by the auto_release_escrow_funds cron, or manually if disputed.

    return {
        "success": True,
        "message": "PIN valid. Barang telah diterima. Dana akan otomatis diteruskan ke penjual dalam 1x24 jam jika tidak ada kendala.",
        "deliveredAt": now.isoformat()
    }


async def auto_release_escrow_funds():
    """
    Cron job to check all products with escrowStatus == HELD, currentStatus == DELIVERED
    and deliveredAt < 24 hours ago. Release them automatically.
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
    now = datetime.now(timezone.utc)
    
    # We must find the products first to update the users' balances
    # We limit to 100 to prevent OOM
    products = await db.trackingproduct.find_many(
        where={
            "escrowStatus": "HELD",
            "currentStatus": "DELIVERED",
            "deliveredAt": {
                "lt": cutoff_time
            }
        },
        take=100
    )
    
    if not products:
        return 0
        
    updated_count = 0
    for p in products:
        async with db.tx() as tx:
            await tx.trackingproduct.update(
                where={"id": p.id},
                data={
                    "escrowStatus": "RELEASED",
                    "payoutReleasedAt": now
                }
            )
            if p.isEscrow and p.netAmount > 0:
                await tx.user.update(
                    where={"id": p.userId},
                    data={"escrowBalance": {"increment": p.netAmount}}
                )
        updated_count += 1
        
    return updated_count
