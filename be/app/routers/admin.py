"""Admin panel router — manage users, credits, bans."""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.database import db
from app.dependencies import get_admin_user
from app.services.credit_service import add_credits
from app.services.admin_service import get_all_users_for_admin, get_platform_stats, get_supaledger_dataset, get_all_activities
from app.services.tracking_service import get_all_tracking_admin
from app.models.schemas import AdminUserItem, AdminAddCreditsRequest, AdminBanRequest

router = APIRouter(prefix="/api/admin", tags=["Admin Panel"])


@router.get("/users")
async def get_all_users(page: int = 1, admin: dict = Depends(get_admin_user)):
    """Get all users (Admin only)"""
    limit = 10
    offset = (page - 1) * limit
    return await get_all_users_for_admin(limit, offset)

@router.post("/approve-credit-score/{user_id}")
async def approve_credit_score(user_id: str, admin: dict = Depends(get_admin_user)):
    """Approve credit score view access for a user."""
    target_user = await db.user.find_unique(where={"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.user.update(
        where={"id": user_id},
        data={
            "canViewCreditScore": True,
            "creditScoreRequested": False
        }
    )
    return {"message": "Akses fitur Credit Score telah diberikan"}
@router.get("/escrow-requests")
async def get_escrow_requests(admin: dict = Depends(get_admin_user)):
    """Get all Escrow requests."""
    requests = await db.escrowrequest.find_many(
        where={"status": "pending"},
        include={"user": True},
        order={"createdAt": "desc"}
    )
    
    return [
        {
            "id": r.id,
            "user_id": r.userId,
            "nama_toko": r.user.nama if r.user else "Unknown",
            "email": r.user.email if r.user else "Unknown",
            "nama_bank": r.namaBank,
            "nomor_rekening": r.nomorRekening,
            "nama_pemilik": r.namaPemilik,
            "link_umkm": r.linkUmkm,
            "catatan_produk": r.catatanProduk,
            "tujuan_escrow": r.tujuanEscrow,
            "status": r.status,
            "created_at": r.createdAt.isoformat()
        }
        for r in requests
    ]

@router.post("/approve-escrow/{request_id}")
async def approve_escrow(request_id: str, admin: dict = Depends(get_admin_user)):
    """Approve escrow access for a user."""
    req = await db.escrowrequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
        
    await db.escrowrequest.update(
        where={"id": request_id},
        data={"status": "approved"}
    )
    
    await db.user.update(
        where={"id": req.userId},
        data={
            "canUseEscrow": True
        }
    )
    return {"message": "Akses pembayaran Escrow telah diberikan"}

@router.post("/toggle-elite/{user_id}")
async def toggle_elite(user_id: str, admin: dict = Depends(get_admin_user)):
    """Toggle elite status for a user. Sets 30-day expiry when enabling."""
    target_user = await db.user.find_unique(where={"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = not target_user.isElite
    update_data = {"isElite": new_status}

    if new_status:
        update_data["eliteExpiresAt"] = datetime.now(timezone.utc) + timedelta(days=30)
    else:
        update_data["eliteExpiresAt"] = None

    await db.user.update(where={"id": user_id}, data=update_data)
    action = "diaktifkan (30 hari)" if new_status else "dinonaktifkan"
    return {"message": f"Status Elite {action} untuk {target_user.email}", "is_elite": new_status}


@router.get("/users/online")
async def get_online_users(admin: dict = Depends(get_admin_user)):
    """
    Get users who were active in the last 15 minutes.
    Uses the last_seen_at field updated on every authenticated request.
    """
    threshold = datetime.now(timezone.utc) - timedelta(minutes=15)

    users = await db.user.find_many(
        where={
            "lastSeenAt": {
                "gte": threshold
            }
        },
        order={"lastSeenAt": "desc"}
    )

    return {
        "online_count": len(users),
        "users": [
            {
                "id": u.id,
                "nama": u.nama,
                "email": u.email,
                "last_seen_at": u.lastSeenAt.isoformat() if u.lastSeenAt else None,
            }
            for u in users
        ],
    }


@router.post("/credits/add")
async def add_credits(request: AdminAddCreditsRequest, admin: dict = Depends(get_admin_user)):
    """Add credits to a specific user."""
    user = await db.user.find_unique(where={"id": request.user_id})

    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    if user.isAdmin:
        raise HTTPException(status_code=400, detail="Tidak bisa mengubah kredit admin")

    if request.tipe_kredit == "API":
        msg_kredit = "kredit API"
    else:
        msg_kredit = "kredit QR"
        
    desc = f"Admin Bonus: {request.amount} {msg_kredit}"
    await add_credits(request.user_id, request.amount, request.tipe_kredit, desc)
    
    # Fetch updated user to return new balance
    updated_user = await db.user.find_unique(where={"id": request.user_id})
    new_balance = updated_user.apiKredit if request.tipe_kredit == "API" else updated_user.sisaKredit

    return {
        "message": f"Berhasil menambahkan {request.amount} {msg_kredit} ke {user.email}",
        "new_balance": new_balance,
    }


@router.post("/users/ban")
async def ban_user(request: AdminBanRequest, admin: dict = Depends(get_admin_user)):
    """Ban or unban a user."""
    # Prevent banning self
    if request.user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Tidak bisa mem-ban diri sendiri")

    user = await db.user.find_unique(where={"id": request.user_id})

    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    if user.isAdmin:
        raise HTTPException(status_code=400, detail="Tidak bisa mem-ban admin")

    await db.user.update(
        where={"id": request.user_id},
        data={"isBanned": request.banned}
    )

    action = "diblokir" if request.banned else "di-unban"
    return {
        "message": f"User {user.email} berhasil {action}",
        "is_banned": request.banned,
    }


@router.get("/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    """Get overall platform statistics."""
    return await get_platform_stats()


@router.get("/dataset/export")
async def export_ml_dataset(admin: dict = Depends(get_admin_user)):
    """Export dataset for Supaledger ML training."""
    return await get_supaledger_dataset()


@router.get("/activities")
async def fetch_activities(admin: dict = Depends(get_admin_user)):
    """Fetch global QC generation activities across all users."""
    return await get_all_activities()

@router.get("/tracking-activities")
async def fetch_tracking_activities(
    page: int = 1,
    admin: dict = Depends(get_admin_user)
):
    """Fetch global Tracking Lite activities across all users."""
    limit = 10
    offset = (page - 1) * limit
    return await get_all_tracking_admin(limit, offset)


from app.models.schemas import ApiAccessRequestItem

@router.get("/api-requests")
async def get_api_requests(page: int = 1, admin: dict = Depends(get_admin_user)):
    """Get all API access requests."""
    limit = 10
    offset = (page - 1) * limit
    total = await db.apiaccessrequest.count()
    requests = await db.apiaccessrequest.find_many(
        include={"user": True},
        order={"createdAt": "desc"},
        take=limit,
        skip=offset
    )
    data = [
        ApiAccessRequestItem(
            id=r.id,
            user_id=r.userId,
            nama=r.user.nama if r.user else "Unknown",
            email=r.user.email if r.user else "Unknown",
            status=r.status,
            created_at=r.createdAt
        )
        for r in requests
    ]
    return {"data": data, "total": total}

@router.post("/api-requests/{request_id}/approve")
async def approve_api_request(request_id: str, admin: dict = Depends(get_admin_user)):
    """Approve an API access request and grant 2 API credits."""
    req = await db.apiaccessrequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request tidak ditemukan")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request sudah diproses")

    # Update request status
    await db.apiaccessrequest.update(
        where={"id": request_id},
        data={"status": "approved"}
    )
    # Update user access
    await db.user.update(
        where={"id": req.userId},
        data={"hasApiAccess": True}
    )
    
    # Add 2 API credits
    await add_credits(req.userId, 2, "API", "Free API Credits on Approval")
    
    return {"message": "Akses API disetujui, 2 kredit diberikan."}

@router.post("/api-requests/{request_id}/reject")
async def reject_api_request(request_id: str, admin: dict = Depends(get_admin_user)):
    """Reject an API access request."""
    req = await db.apiaccessrequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request tidak ditemukan")

    await db.apiaccessrequest.update(
        where={"id": request_id},
        data={"status": "rejected"}
    )
    return {"message": "Akses API ditolak."}

from app.models.schemas import AdminKycItem

@router.get("/kyc-requests")
async def get_kyc_requests(page: int = 1, admin: dict = Depends(get_admin_user)):
    """Get all KYC requests."""
    limit = 10
    offset = (page - 1) * limit
    total = await db.kyc.count()
    requests = await db.kyc.find_many(
        include={"user": True},
        order={"createdAt": "desc"},
        take=limit,
        skip=offset
    )
    data = [
        AdminKycItem(
            id=r.id,
            user_id=r.userId,
            nama=r.user.nama if r.user else "Unknown",
            email=r.user.email if r.user else "Unknown",
            nama_toko=r.namaToko,
            nik=r.nik,
            npwp=r.npwp,
            foto_ktp=r.fotoKtp,
            foto_npwp=r.fotoNpwp,
            foto_produk_1=r.fotoProduk1,
            foto_produk_2=r.fotoProduk2,
            deskripsi_produk=r.deskripsiProduk,
            website=r.website,
            status=r.status,
            created_at=r.createdAt
        )
        for r in requests
    ]
    return {"data": data, "total": total}

@router.post("/kyc-requests/{request_id}/approve")
async def approve_kyc_request(request_id: str, admin: dict = Depends(get_admin_user)):
    """Approve a KYC request."""
    req = await db.kyc.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request tidak ditemukan")

    await db.kyc.update(
        where={"id": request_id},
        data={"status": "approved"}
    )
    return {"message": "KYC disetujui."}

@router.post("/kyc-requests/{request_id}/reject")
async def reject_kyc_request(request_id: str, admin: dict = Depends(get_admin_user)):
    """Reject a KYC request."""
    req = await db.kyc.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request tidak ditemukan")

    await db.kyc.update(
        where={"id": request_id},
        data={"status": "rejected"}
    )
    return {"message": "KYC ditolak."}
