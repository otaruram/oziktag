from datetime import datetime, timedelta, timezone
from app.database import db
from app.models.schemas import AdminUserItem

async def get_all_users_for_admin() -> list[AdminUserItem]:
    users = await db.user.find_many(
        include={"kyc": True},
        order={"createdAt": "desc"}
    )

    result = []
    for u in users:
        total_qr = await db.qcproduct.count(where={"userId": u.id})
        
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
