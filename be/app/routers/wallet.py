from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import db
from app.dependencies import get_current_user, get_admin_user
from typing import List
from app.models.schemas import WalletWithdrawRequest, WithdrawRequestResponse, EscrowRequestSubmit, EscrowRequestResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/wallet", tags=["Wallet"])

class WalletBalanceResponse(BaseModel):
    escrow_balance: int

@router.get("/balance", response_model=WalletBalanceResponse)
async def get_wallet_balance(current_user: dict = Depends(get_current_user)):
    user = await db.user.find_unique(where={"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"escrow_balance": user.escrowBalance}

@router.post("/withdraw", response_model=WithdrawRequestResponse)
async def request_withdraw(req: WalletWithdrawRequest, current_user: dict = Depends(get_current_user)):
    user = await db.user.find_unique(where={"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if req.amount < 50000:
        raise HTTPException(status_code=400, detail="Minimal penarikan adalah Rp 50.000")
        
    if req.amount > user.escrowBalance:
        raise HTTPException(status_code=400, detail="Saldo tidak mencukupi")
        
    # Deduct balance immediately to prevent double spend
    await db.user.update(
        where={"id": user.id},
        data={"escrowBalance": {"decrement": req.amount}}
    )
    
    withdraw = await db.withdrawrequest.create(
        data={
            "userId": user.id,
            "amount": req.amount,
            "bankName": req.bank_name,
            "bankAccount": req.bank_account,
            "accountName": req.account_name,
            "status": "pending"
        }
    )
    
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
            
        # If rejected, allow update
        req_record = await db.escrowrequest.update(
            where={"userId": user_id},
            data={
                "namaBank": req.nama_bank,
                "nomorRekening": req.nomor_rekening,
                "namaPemilik": req.nama_pemilik,
                "linkUmkm": req.link_umkm,
                "catatanProduk": req.catatan_produk,
                "tujuanEscrow": req.tujuan_escrow,
                "status": "pending"
            }
        )
    else:
        req_record = await db.escrowrequest.create(
            data={
                "userId": user_id,
                "namaBank": req.nama_bank,
                "nomorRekening": req.nomor_rekening,
                "namaPemilik": req.nama_pemilik,
                "linkUmkm": req.link_umkm,
                "catatanProduk": req.catatan_produk,
                "tujuanEscrow": req.tujuan_escrow,
                "status": "pending"
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
