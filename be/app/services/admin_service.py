from datetime import datetime, timedelta, timezone
from app.database import db
from app.models.schemas import AdminUserItem

async def get_all_users_for_admin() -> list[AdminUserItem]:
    users = await db.user.find_many(
        include={"kyc": True},
        order={"createdAt": "desc"}
    )

    # Bulk query to count products per user (Fix N+1 Query)
    qc_counts = await db.qcproduct.group_by(
        by=["userId"],
        count={"id": True}
    )
    count_map = {item["userId"]: item["_count"]["id"] for item in qc_counts}

    result = []
    for u in users:
        total_qr = count_map.get(u.id, 0)
        
        score = 300
        if u.kyc and u.kyc.status in ["verified", "approved"]:
            score += 150
        score += (total_qr * 5)
        score += min(u.sisaKredit * 2, 100)
        score = min(score, 850)
        
        result.append(AdminUserItem(
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
            credit_score=score,
            credit_score_requested=u.creditScoreRequested,
            can_view_credit_score=u.canViewCreditScore,
            is_elite=u.isElite,
        ))
    return result


async def get_platform_stats() -> dict:
    users_count = await db.user.count()
    products_count = await db.qcproduct.count()
    transactions_count = await db.topuptransaction.count(
        where={"status": "settled"}
    )

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


async def get_supaledger_dataset() -> list[dict]:
    products = await db.qcproduct.find_many(
        where={
            "hargaProduksi": {"not": None},
            "hargaJual": {"not": None}
        },
        include={"user": {"include": {"kyc": True}}, "scans": True}
    )

    dataset = []
    for p in products:
        if not p.hargaProduksi or not p.hargaJual:
            continue
            
        profit = p.hargaJual - p.hargaProduksi
        margin = round((profit / p.hargaJual * 100), 1) if p.hargaJual > 0 else 0
        total_scans = len(p.scans) if p.scans else 0
        
        kyc_status = "unverified"
        if p.user and p.user.kyc:
            kyc_status = p.user.kyc.status

        dataset.append({
            "id_produk": p.id,
            "kategori": p.kategori,
            "harga_produksi": p.hargaProduksi,
            "harga_jual": p.hargaJual,
            "margin_persen": margin,
            "total_scan": total_scans,
            "catatan_penjual": p.catatanPenjual or "",
            "ai_insight": p.aiInsight or "",
            "kyc_status": kyc_status
        })

    return dataset

async def get_all_activities() -> dict:
    """Fetch all QC Products (QRs) and CreditLogs globally."""
    # Fetch recent QR generations (QcProducts)
    products = await db.qcproduct.find_many(
        include={"user": True},
        order={"createdAt": "desc"},
        take=100
    )
    
    qrs = []
    for p in products:
        qrs.append({
            "id": p.id,
            "user_email": p.user.email if p.user else "Unknown",
            "nama_produk": p.namaProduk,
            "kategori": p.kategori,
            "catatan_penjual": p.catatanPenjual,
            "created_at": p.createdAt.isoformat()
        })
        
    # Fetch recent Credit Logs
    logs = await db.creditlog.find_many(
        include={"user": True},
        order={"createdAt": "desc"},
        take=100
    )
    
    credit_logs = []
    for log in logs:
        credit_logs.append({
            "id": log.id,
            "user_email": log.user.email if log.user else "Unknown",
            "action": log.action,
            "amount": log.amount,
            "description": log.description,
            "created_at": log.createdAt.isoformat()
        })
        
    return {
        "qrs": qrs,
        "credit_logs": credit_logs
    }
