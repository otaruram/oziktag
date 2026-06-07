"""Admin panel router — manage users, credits, bans."""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.database import db
from app.dependencies import get_admin_user
from app.models.schemas import AdminUserItem, AdminAddCreditsRequest, AdminBanRequest

router = APIRouter(prefix="/api/admin", tags=["Admin Panel"])


@router.get("/users", response_model=list[AdminUserItem])
async def list_all_users(admin: dict = Depends(get_admin_user)):
    """List all registered users with their details."""
    users = await db.user.find_many(
        order={"createdAt": "desc"}
    )

    return [
        AdminUserItem(
            id=u.id,
            nama=u.nama,
            email=u.email,
            sisa_kredit=u.sisaKredit,
            api_kredit=u.apiKredit,
            is_banned=u.isBanned,
            is_admin=u.isAdmin,
            has_api_access=u.hasApiAccess,
            last_seen_at=u.lastSeenAt.isoformat() if u.lastSeenAt else None,
            created_at=u.createdAt.isoformat(),
        )
        for u in users
    ]


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

    if request.tipe_kredit == "API":
        new_credits = user.apiKredit + request.amount
        await db.user.update(
            where={"id": request.user_id},
            data={"apiKredit": new_credits}
        )
        msg_kredit = "kredit API"
    else:
        new_credits = user.sisaKredit + request.amount
        await db.user.update(
            where={"id": request.user_id},
            data={"sisaKredit": new_credits}
        )
        msg_kredit = "kredit QR"

    return {
        "message": f"Berhasil menambahkan {request.amount} {msg_kredit} ke {user.email}",
        "new_balance": new_credits,
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
    users_count = await db.user.count()
    products_count = await db.qcproduct.count()
    transactions_count = await db.topuptransaction.count(
        where={"status": "settled"}
    )

    # Online users (last 15 min)
    threshold = datetime.now(timezone.utc) - timedelta(minutes=15)
    online_count = await db.user.count(
        where={
            "lastSeenAt": {
                "gte": threshold
            }
        }
    )

    banned_count = await db.user.count(
        where={"isBanned": True}
    )

    return {
        "total_users": users_count,
        "total_products": products_count,
        "total_transactions": transactions_count,
        "online_users": online_count,
        "banned_users": banned_count,
    }


from app.models.schemas import ApiAccessRequestItem

@router.get("/api-requests", response_model=list[ApiAccessRequestItem])
async def get_api_requests(admin: dict = Depends(get_admin_user)):
    """Get all API access requests."""
    requests = await db.apiaccessrequest.find_many(
        include={"user": True},
        order={"createdAt": "desc"}
    )
    return [
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
    # Update user access and give 2 credits
    await db.user.update(
        where={"id": req.userId},
        data={
            "hasApiAccess": True,
            "apiKredit": {
                "increment": 2
            }
        }
    )
    
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
