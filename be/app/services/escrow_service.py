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

    # Update escrow state and user balance in a transaction
    now = datetime.now(timezone.utc)
    
    async with db.tx() as tx:
        updated_product = await tx.trackingproduct.update(
            where={"id": product_id},
            data={
                "escrowStatus": "RELEASED",
                "payoutReleasedAt": now,
            }
        )
        
        if updated_product and updated_product.isEscrow and updated_product.netAmount > 0:
            await tx.user.update(
                where={"id": updated_product.userId},
                data={"escrowBalance": {"increment": updated_product.netAmount}}
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
    now = datetime.now(timezone.utc)
    
    # We must find the products first to update the users' balances
    # We limit to 100 to prevent OOM
    products = await db.trackingproduct.find_many(
        where={
            "escrowStatus": "HELD",
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
