from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from app.database import db
from app.dependencies import get_current_user, get_admin_user
from typing import List
from app.models.schemas import WalletWithdrawRequest, WithdrawRequestResponse, EscrowRequestSubmit, EscrowRequestResponse
from pydantic import BaseModel
from app.services.email_service import send_email, build_admin_withdrawal_notification_email
from app.config import get_settings

router = APIRouter(prefix="/api/wallet", tags=["Wallet"])

class WalletBalanceResponse(BaseModel):
    balance: int
    withdraws: list
    escrow_transactions: list

@router.get("/balance", response_model=WalletBalanceResponse)
async def get_wallet_balance(current_user: dict = Depends(get_current_user)):
    user = await db.user.find_unique(where={"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    withdraws = await db.withdrawrequest.find_many(
        where={"userId": user.id},
        order={"createdAt": "desc"}
    )
    
    # Get all escrow transactions (tracking products that are escrow)
    escrow_transactions = await db.trackingproduct.find_many(
        where={"userId": user.id, "isEscrow": True},
        order={"createdAt": "desc"}
    )

    # Also get Event Ticket Escrow transactions (Oziktag Event Ticketing Auto-Settlement)
    ticket_escrows = []
    try:
        ticket_rows = await db.query_raw(
            """
            SELECT t.id, s.seat_code, s.category::text AS category, s.buyer_name,
                   t.amount::numeric AS price, t.net_amount::numeric AS net_amount,
                   t.escrow_fee::numeric AS escrow_fee,
                   t.escrow_status::text AS escrow_status,
                   t.check_in_status::text AS check_in_status,
                   t.created_at, t.checked_in_at, t.escrow_released_at
              FROM ticket_transactions t
              JOIN event_seats s ON s.id = t.seat_id
             WHERE t.organizer_id = $1 OR $2 = TRUE
             ORDER BY t.created_at DESC
             LIMIT 50
            """,
            user.id,
            bool(user.isAdmin),
        )
        for tr in ticket_rows:
            ticket_escrows.append({
                "id": tr["id"],
                "name": f"[Tiket Event Summarecon] Kursi {tr['seat_code']} ({tr['category']}) — {tr['buyer_name'] or 'Attendee'}",
                "price": int(float(tr["price"] or 0)),
                "netAmount": int(float(tr["net_amount"] or 0)),
                "escrowFee": int(float(tr["escrow_fee"] or 0)),
                "escrowStatus": tr["escrow_status"],
                "currentStatus": "DELIVERED" if tr["check_in_status"] == "USED" else "CHECKIN_PENDING",
                "createdAt": str(tr["created_at"]),
                "deliveredAt": str(tr["checked_in_at"]) if tr["checked_in_at"] else None,
                "payoutReleasedAt": str(tr["escrow_released_at"]) if tr["escrow_released_at"] else None,
            })
    except Exception as e:
        print(f"[Wallet] Ticket escrow query fallback: {e}")

    combined_escrow = [
        {
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "netAmount": t.netAmount,
            "escrowFee": t.escrowFee,
            "escrowStatus": t.escrowStatus,
            "currentStatus": t.currentStatus,
            "createdAt": t.createdAt.isoformat(),
            "deliveredAt": t.deliveredAt.isoformat() if t.deliveredAt else None,
            "payoutReleasedAt": t.payoutReleasedAt.isoformat() if t.payoutReleasedAt else None,
        } for t in escrow_transactions
    ] + ticket_escrows

    return {
        "balance": user.escrowBalance,
        "withdraws": [
            {
                "id": w.id,
                "amount": w.amount,
                "bankCode": w.bankName,
                "accountNumber": w.bankAccount,
                "accountName": w.accountName,
                "status": w.status,
                "createdAt": w.createdAt.isoformat(),
            } for w in withdraws
        ],
        "escrow_transactions": combined_escrow,
    }

@router.post("/withdraw", response_model=WithdrawRequestResponse)
async def request_withdraw(req: WalletWithdrawRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    user = await db.user.find_unique(where={"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if req.amount < 50000:
        raise HTTPException(status_code=400, detail="Minimal penarikan adalah Rp 50.000")
        
    if req.amount > user.escrowBalance:
        raise HTTPException(status_code=400, detail="Saldo tidak mencukupi")
        
    # Transaction to ensure balance deduction and withdraw creation are atomic
    try:
        async with db.tx() as tx:
            await tx.user.update(
                where={"id": user.id},
                data={"escrowBalance": {"decrement": req.amount}}
            )
            
            withdraw = await tx.withdrawrequest.create(
                data={
                    "userId": user.id,
                    "amount": req.amount,
                    "bankName": req.bank_name,
                    "bankAccount": req.bank_account,
                    "accountName": req.account_name,
                    "status": "pending"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses penarikan: {str(e)}")
    
    # Send email notification to Admin
    settings = get_settings()
    if settings.admin_email:
        admin_emails = [e.strip() for e in settings.admin_email.split(",") if e.strip()]
        if admin_emails:
            bank_details = f"{req.bank_name} - {req.bank_account} a.n {req.account_name}"
            subject, html_body = build_admin_withdrawal_notification_email(
                seller_name=user.nama, 
                amount=req.amount, 
                bank_details=bank_details
            )
            # Send to the primary admin email (or all if we iterate)
            for email in admin_emails:
                background_tasks.add_task(send_email, email, subject, html_body)
    
    return {
        "id": withdraw.id,
        "amount": withdraw.amount,
        "bank_name": withdraw.bankName,
        "bank_account": withdraw.bankAccount,
        "account_name": withdraw.accountName,
        "status": withdraw.status,
        "created_at": withdraw.createdAt.isoformat(),
        "completed_at": withdraw.completedAt.isoformat() if withdraw.completedAt else None
    }

@router.get("/withdraws/me", response_model=List[WithdrawRequestResponse])
async def get_my_withdraws(current_user: dict = Depends(get_current_user)):
    withdraws = await db.withdrawrequest.find_many(
        where={"userId": current_user["id"]},
        order={"createdAt": "desc"}
    )
    
    return [
        {
            "id": w.id,
            "amount": w.amount,
            "bank_name": w.bankName,
            "bank_account": w.bankAccount,
            "account_name": w.accountName,
            "status": w.status,
            "created_at": w.createdAt.isoformat(),
            "completed_at": w.completedAt.isoformat() if w.completedAt else None
        }
        for w in withdraws
    ]

@router.get("/admin/withdraws")
async def admin_get_withdraws(
    status: str = Query(None, description="pending, completed, rejected"),
    admin_user: dict = Depends(get_admin_user)
):
    where_clause = {}
    if status:
        where_clause["status"] = status
        
    withdraws = await db.withdrawrequest.find_many(
        where=where_clause,
        include={"user": True},
        order={"createdAt": "desc"}
    )
    
    return [
        {
            "id": w.id,
            "user_id": w.userId,
            "user_name": w.user.nama if w.user else "Unknown",
            "user_balance": w.user.escrowBalance if w.user else 0,
            "amount": w.amount,
            "bank_name": w.bankName,
            "bank_account": w.bankAccount,
            "account_name": w.accountName,
            "status": w.status,
            "created_at": w.createdAt.isoformat(),
            "completed_at": w.completedAt.isoformat() if w.completedAt else None
        }
        for w in withdraws
    ]

@router.post("/admin/withdraws/{withdraw_id}/complete")
async def admin_complete_withdraw(withdraw_id: str, admin_user: dict = Depends(get_admin_user)):
        
    withdraw = await db.withdrawrequest.find_unique(where={"id": withdraw_id})
    if not withdraw:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
        
    if withdraw.status != "pending":
        raise HTTPException(status_code=400, detail="Status must be pending")
        
    from datetime import datetime, timezone
    
    updated = await db.withdrawrequest.update(
        where={"id": withdraw_id},
        data={
            "status": "completed",
            "completedAt": datetime.now(timezone.utc)
        }
    )
    return {"message": "Withdrawal marked as completed"}

@router.post("/admin/withdraws/{withdraw_id}/reject")
async def admin_reject_withdraw(withdraw_id: str, admin_user: dict = Depends(get_admin_user)):
        
    withdraw = await db.withdrawrequest.find_unique(where={"id": withdraw_id})
    if not withdraw:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
        
    if withdraw.status != "pending":
        raise HTTPException(status_code=400, detail="Status must be pending")
        
    # Transaction to refund the amount and update status to rejected
    try:
        async with db.tx() as tx:
            await tx.withdrawrequest.update(
                where={"id": withdraw_id},
                data={"status": "rejected"}
            )
            # Refund escrow balance back to user
            await tx.user.update(
                where={"id": withdraw.userId},
                data={"escrowBalance": {"increment": withdraw.amount}}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menolak penarikan: {str(e)}")
        
    return {"message": "Withdrawal rejected and balance refunded"}

@router.post("/escrow-request", response_model=EscrowRequestResponse)
async def submit_escrow_request(
    req: EscrowRequestSubmit, 
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    
    # Check if already has access
    user = await db.user.find_unique(where={"id": user_id})
    if user and user.canUseEscrow:
        raise HTTPException(status_code=400, detail="Anda sudah memiliki akses Escrow")
        
    # Check if already requested
    existing = await db.escrowrequest.find_unique(where={"userId": user_id})
    if existing:
        if existing.status == "pending":
            raise HTTPException(status_code=400, detail="Pengajuan Anda sedang direview")
        elif existing.status == "approved":
            raise HTTPException(status_code=400, detail="Anda sudah disetujui")
            
    # Upsert Escrow Request
    data_payload = {
        "namaBank": req.nama_bank,
        "nomorRekening": req.nomor_rekening,
        "namaPemilik": req.nama_pemilik,
        "linkUmkm": req.link_umkm,
        "catatanProduk": req.catatan_produk,
        "tujuanEscrow": req.tujuan_escrow,
        "status": "pending"
    }
    
    req_record = await db.escrowrequest.upsert(
        where={"userId": user_id},
        data={
            "create": {**data_payload, "userId": user_id},
            "update": data_payload
        }
    )
        
    return {
        "id": req_record.id,
        "user_id": req_record.userId,
        "nama_bank": req_record.namaBank,
        "nomor_rekening": req_record.nomorRekening,
        "nama_pemilik": req_record.namaPemilik,
        "link_umkm": req_record.linkUmkm,
        "catatan_produk": req_record.catatanProduk,
        "tujuan_escrow": req_record.tujuanEscrow,
        "status": req_record.status,
        "created_at": req_record.createdAt.isoformat()
    }
