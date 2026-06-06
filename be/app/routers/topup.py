"""Top-Up credit router with Louvin payment integration and webhook handler."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.database import db
from app.dependencies import get_current_user
from app.services.louvin_service import create_transaction, get_package
from app.models.schemas import TopUpCreateRequest, TopUpCreateResponse, TopUpHistoryItem

router = APIRouter(prefix="/api/topup", tags=["Top-Up & Payment"])


@router.post("/create", response_model=TopUpCreateResponse)
async def create_topup(
    request: TopUpCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a top-up transaction via Louvin.
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

    # Call Louvin API
    try:
        louvin_response = await create_transaction(
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

    txn = louvin_response.get("transaction", {})
    payment = louvin_response.get("payment", {})

    # Save to database (Prisma)
    await db.topuptransaction.create(
        data={
            "userId": user_id,
            "paket": request.paket,
            "amount": pkg["price"],
            "credits": pkg["credits"],
            "status": "pending",
            "louvinRef": reference,
            "louvinTransactionId": txn.get("id", ""),
            "paymentType": request.payment_type,
        }
    )

    return TopUpCreateResponse(
        transaction_id=reference,
        louvin_transaction_id=txn.get("id", ""),
        amount=pkg["price"],
        payment_type=request.payment_type,
        qr_string=payment.get("qr_string"),
        va_number=payment.get("va_number"),
        deeplink_url=payment.get("deeplink_url"),
        expired_at=payment.get("expired_at"),
        total_payment=payment.get("total_payment", pkg["price"]),
    )


@router.post("/webhook")
async def louvin_webhook(request: Request):
    """
    Webhook handler for Louvin payment notifications.
    Updates transaction status and adds credits on successful payment.
    IMPORTANT: Always return HTTP 200.
    """
    try:
        body = await request.json()
    except Exception:
        return {"received": True}

    event = body.get("event", "")
    data = body.get("data", {})

    order_id = data.get("order_id", "")
    transaction_status = data.get("status", "")

    if event == "payment.settled" and transaction_status == "settled":
        # Find the transaction by louvin_ref (our reference = order_id)
        txn = await db.topuptransaction.find_first(
            where={"louvinRef": order_id}
        )

        if txn and txn.status != "settled":
            # Update transaction status and user's credit in a transaction
            async with db.tx() as tx:
                await tx.topuptransaction.update(
                    where={"id": txn.id},
                    data={"status": "settled"}
                )

                # Fetch user
                user = await tx.user.find_unique(
                    where={"id": txn.userId}
                )
                if user:
                    new_credits = user.sisaKredit + txn.credits
                    await tx.user.update(
                        where={"id": txn.userId},
                        data={"sisaKredit": new_credits}
                    )

            print(f"[Webhook] Payment settled: {order_id}, +{txn.credits} credits to user {txn.userId}")

    elif event == "payment.failed":
        # Update transaction status to failed
        txn = await db.topuptransaction.find_first(
            where={"louvinRef": order_id}
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
                "amount": pkg["price"],
                "credits": pkg["credits"],
                "status": "settled",
                "louvinRef": reference,
                "paymentType": request.payment_type or "QRIS",
            }
        )
        user = await tx.user.find_unique(where={"id": user_id})
        if user:
            await tx.user.update(
                where={"id": user_id},
                data={"sisaKredit": user.sisaKredit + pkg["credits"]}
            )
            
    return {"message": "Demo payment successful", "credits_added": pkg["credits"]}
