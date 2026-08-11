"""Top-Up credit router with Louvin payment integration and webhook handler."""

import uuid
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.database import db
from app.dependencies import get_current_user
from app.services.sumopod_service import create_transaction, get_package
from app.services.credit_service import add_credits
from app.services.email_service import send_email, build_topup_success_email
from app.models.schemas import TopUpCreateRequest, TopUpCreateResponse, TopUpHistoryItem

router = APIRouter(prefix="/api/topup", tags=["Top-Up & Payment"])


@router.post("/create", response_model=TopUpCreateResponse)
async def create_topup(
    request: TopUpCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a top-up transaction via SumoPod.
    Returns QR string / VA number for payment.
    """
    user_id = current_user["id"]

    # Validate package
    try:
        pkg = get_package(request.paket)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Generate unique reference
    reference = f"oziktag-{uuid.uuid4().hex[:12]}"

    # Call SumoPod API
    try:
        sumopod_response = await create_transaction(
            paket=request.paket,
            payment_type=request.payment_type,
            customer_name=current_user.get("name", ""),
            customer_email=current_user.get("email", ""),
            reference=reference,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gagal membuat transaksi pembayaran: {str(e)}",
        )

    txn_data = sumopod_response
    payment_link = txn_data.get("payment_link_url")
    sumopod_txn_id = txn_data.get("payment_id", "")

    # Save to database (Prisma)
    await db.topuptransaction.create(
        data={
            "userId": user_id,
            "paket": request.paket,
            "tipeKredit": request.tipe_kredit,
            "amount": pkg["price"],
            "credits": pkg["credits"],
            "status": "pending",
            "sumopodRef": reference,
            "sumopodTransactionId": sumopod_txn_id,
            "paymentType": request.payment_type,
        }
    )

    return TopUpCreateResponse(
        transaction_id=reference,
        sumopod_transaction_id=sumopod_txn_id,
        amount=pkg["price"],
        payment_type=request.payment_type,
        qr_string=payment_link, # For SumoPod, this acts as the payment URL
        va_number=None,
        deeplink_url=payment_link,
        expired_at=None,
        total_payment=pkg["price"],
    )


@router.post("/webhook")
async def payment_webhook(request: Request):
    """
    Public webhook receiver for SumoPod.
    """
    payload = await request.json()
    
    # Check optional Webhook Token from SumoPod if configured
    from app.config import get_settings
    settings = get_settings()
    sumopod_token = getattr(settings, "sumopod_webhook_token", None)
    if sumopod_token:
        received_token = request.headers.get("X-Webhook-Token")
        if received_token != sumopod_token:
            raise HTTPException(status_code=403, detail="Invalid Webhook Token")
        
    event = payload.get("event_type")
    data = payload.get("data", {})
    order_id = data.get("order_id")

    if not order_id:
        return {"received": True}

    if event == "payment.completed":
        if order_id.startswith("ESC-"):
            # Escrow transaction for physical goods
            product = await db.trackingproduct.find_first(where={"sumopodRef": order_id})
            if product and product.currentStatus == "PENDING_PAYMENT":
                await db.trackingproduct.update(
                    where={"id": product.id},
                    data={"currentStatus": "PACKED"}
                )
                await db.trackinghistory.create(
                    data={
                        "productId": product.id,
                        "statusUpdate": "Pembayaran berhasil diverifikasi. Pesanan sedang dikemas.",
                        "scannedByRole": "system",
                    }
                )
            return {"status": "ok"}
            
        # Standard topup transaction
        # Find the transaction by sumopodRef (our reference = order_id)
        txn = await db.topuptransaction.find_first(
            where={"sumopodRef": order_id}
        )

        if txn and txn.status != "settled":
            # Update transaction status and user's credit in a transaction
            async with db.tx() as tx:
                await tx.topuptransaction.update(
                    where={"id": txn.id},
                    data={"status": "settled"}
                )

                if txn.paket.startswith("elite_"):
                    from datetime import datetime, timedelta, timezone
                    days = 365 if txn.paket == "elite_yearly" else 30
                    expires_at = datetime.now(timezone.utc) + timedelta(days=days)
                    
                    user = await tx.user.find_unique(where={"id": txn.userId})
                    if user and user.isElite and user.eliteExpiresAt:
                        if user.eliteExpiresAt.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
                            expires_at = user.eliteExpiresAt.replace(tzinfo=timezone.utc) + timedelta(days=days)
                            
                    await tx.user.update(
                        where={"id": txn.userId},
                        data={"isElite": True, "eliteExpiresAt": expires_at}
                    )
                    
                    await tx.creditlog.create(
                        data={
                            "userId": txn.userId,
                            "tipeKredit": "QR",
                            "action": "TOPUP",
                            "amount": 0,
                            "description": f"Aktivasi Artisan Elite ({days} hari)"
                        }
                    )
                else:
                    # Add credits using the service within the same transaction
                    desc = f"Top-Up Paket API {txn.paket}" if txn.tipeKredit == "API" else f"Top-Up Paket {txn.paket}"
                    await add_credits(txn.userId, txn.credits, txn.tipeKredit, desc, tx_client=tx)

            print(f"[Webhook] Payment settled: {order_id}, +{txn.credits} credits to user {txn.userId}")

            # Send email notification (fire-and-forget)
            try:
                user = await db.user.find_unique(where={"id": txn.userId})
                if user and user.email:
                    subject, html = build_topup_success_email(
                        user_name=user.nama or user.email.split("@")[0],
                        paket=txn.paket,
                        credits=txn.credits,
                        amount=txn.amount,
                    )
                    await asyncio.to_thread(send_email, user.email, subject, html)
            except Exception as email_err:
                print(f"[Webhook] Email notification failed: {email_err}")

    elif event == "payment.failed":
        # Update transaction status to failed
        txn = await db.topuptransaction.find_first(
            where={"sumopodRef": order_id}
        )
        if txn:
            await db.topuptransaction.update(
                where={"id": txn.id},
                data={"status": "failed"}
            )
            
            # Send email notification for failed payment
            try:
                user = await db.user.find_unique(where={"id": txn.userId})
                if user and user.email:
                    from app.services.email_service import build_topup_failed_email
                    subject, html = build_topup_failed_email(
                        user_name=user.nama or user.email.split("@")[0] or "Pengguna",
                        paket=txn.paket,
                    )
                    await asyncio.to_thread(send_email, user.email, subject, html)
            except Exception as email_err:
                print(f"[Webhook] Email failure notification failed: {email_err}")

        print(f"[Webhook] Payment failed: {order_id}")

    # Always return 200
    return {"received": True}


@router.get("/history", response_model=list[TopUpHistoryItem])
async def get_topup_history(current_user: dict = Depends(get_current_user)):
    """Get top-up transaction history for the current user."""
    user_id = current_user["id"]

    txns = await db.topuptransaction.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"},
        take=50
    )

    return [
        TopUpHistoryItem(
            id=t.id,
            paket=t.paket,
            amount=t.amount,
            credits=t.credits,
            status=t.status,
            payment_type=t.paymentType,
            created_at=t.createdAt.isoformat(),
        )
        for t in txns
    ]



