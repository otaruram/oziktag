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
            is_banned=u.isBanned,
            is_admin=u.isAdmin,
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

    new_credits = user.sisaKredit + request.amount

    await db.user.update(
        where={"id": request.user_id},
        data={"sisaKredit": new_credits}
    )

    return {
        "message": f"Berhasil menambahkan {request.amount} kredit ke {user.email}",
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
