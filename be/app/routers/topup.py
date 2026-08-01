"""Top-Up credit router with Louvin payment integration and webhook handler."""

import uuid
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


@router.post("/webhook-internal")
async def payment_webhook(request: Request):
    """
    Internal webhook received from our Node.js microservice.
    Node.js has already verified the SumoPod token.
    """
    payload = await request.json()

    event = payload.get("event_type")
    data = payload.get("data", {})
    order_id = data.get("order_id")

    if not order_id:
        return {"received": True}

    if event == "payment.completed":
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
                    await send_email(user.email, subject, html)
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

@router.post("/demo-simulate")
async def simulate_demo_payment(request: TopUpCreateRequest, current_user: dict = Depends(get_current_user)):
    """Demo endpoint to instantly add credits and create a settled transaction."""
    user_id = current_user["id"]
    try:
        pkg = get_package(request.paket)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    reference = f"demo-{uuid.uuid4().hex[:12]}"
    
    async with db.tx() as tx:
        await tx.topuptransaction.create(
            data={
                "userId": user_id,
                "paket": request.paket,
                "tipeKredit": request.tipe_kredit,
                "amount": pkg["price"],
                "credits": pkg["credits"],
                "status": "settled",
                "sumopodRef": reference,
                "paymentType": request.payment_type or "QRIS",
            }
        )
        user = await tx.user.find_unique(where={"id": user_id})
        if user:
            if request.tipe_kredit == "API":
                await tx.user.update(
                    where={"id": user_id},
                    data={"apiKredit": user.apiKredit + pkg["credits"]}
                )
                await tx.creditlog.create(
                    data={
                        "userId": user_id,
                        "tipeKredit": "API",
                        "action": "TOPUP",
                        "amount": pkg["credits"],
                        "description": f"Demo Top-Up Paket API {request.paket}"
                    }
                )
            else:
                await tx.user.update(
                    where={"id": user_id},
                    data={"sisaKredit": user.sisaKredit + pkg["credits"]}
                )
                await tx.creditlog.create(
                    data={
                        "userId": user_id,
                        "tipeKredit": "QR",
                        "action": "TOPUP",
                        "amount": pkg["credits"],
                        "description": f"Demo Top-Up Paket {request.paket}"
                    }
                )
            
    return {"message": "Demo payment successful", "credits_added": pkg["credits"]}


@router.post("/subscribe-elite")
async def subscribe_elite(
    payment_type: str = "qris",
    current_user: dict = Depends(get_current_user),
):
    """
    Create a subscription transaction for Artisan Elite membership.
    Price: Rp 49,900/month.
    """
    user_id = current_user["id"]

    # Check if already elite
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.isElite:
        raise HTTPException(status_code=400, detail="Anda sudah menjadi member Artisan Elite")

    elite_price = 49900
    reference = f"elite-{uuid.uuid4().hex[:12]}"

    # Create transaction via SumoPod
    try:
        from app.services.sumopod_service import create_elite_transaction
        sumopod_response = await create_elite_transaction(
            payment_type=payment_type,
            customer_name=current_user.get("name", ""),
            customer_email=current_user.get("email", ""),
            reference=reference,
        )
    except ImportError:
        # Fallback: If create_elite_transaction doesn't exist, use generic
        sumopod_response = await create_transaction(
            paket="elite_monthly",
            payment_type=payment_type,
            customer_name=current_user.get("name", ""),
            customer_email=current_user.get("email", ""),
            reference=reference,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gagal membuat transaksi: {str(e)}",
        )

    # SumoPod doesn't use these exact fields in the response, we map them
    txn_data = sumopod_response
    payment_link = txn_data.get("payment_link_url")

    # Save transaction
    await db.topuptransaction.create(
        data={
            "userId": user_id,
            "paket": "elite_monthly",
            "tipeKredit": "QR",
            "amount": elite_price,
            "credits": 0,
            "status": "pending",
            "sumopodRef": reference,
            "sumopodTransactionId": txn_data.get("payment_id", ""),
            "paymentType": payment_type,
        }
    )

    return {
        "transaction_id": reference,
        "amount": elite_price,
        "payment_type": payment_type,
        "qr_string": payment_link,
        "deeplink_url": payment_link,
    }


@router.post("/demo-subscribe-elite")
async def demo_subscribe_elite(current_user: dict = Depends(get_current_user)):
    """Demo endpoint to instantly activate Elite membership for 30 days."""
    from datetime import datetime, timedelta, timezone

    user_id = current_user["id"]
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    await db.user.update(
        where={"id": user_id},
        data={
            "isElite": True,
            "eliteExpiresAt": expires_at,
        }
    )

    await db.creditlog.create(
        data={
            "userId": user_id,
            "tipeKredit": "QR",
            "action": "TOPUP",
            "amount": 0,
            "description": "Aktivasi Artisan Elite (Demo)"
        }
    )

    return {
        "message": "Artisan Elite aktif selama 30 hari",
        "elite_expires_at": expires_at.isoformat(),
    }

