"""Service for calculating user analytics, credit scores, and financial data."""

from datetime import datetime
from app.database import db
from fastapi import HTTPException

async def get_user_analytics(user_id: str) -> dict:
    """Calculate and return comprehensive user analytics, financials, and credit score."""
    user_data = await db.user.find_unique(
        where={"id": user_id},
        include={"kyc": True}
    )
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    total_products = await db.qcproduct.count(where={"userId": user_id})
    
    now = datetime.now()
    start_of_month = datetime(now.year, now.month, 1)
    
    total_scans_this_month = await db.productscan.count(
        where={
            "userId": user_id,
            "scannedAt": {"gte": start_of_month}
        }
    )
    
    all_time_scans = await db.productscan.count(where={"userId": user_id})

    # Financial data
    products_with_prices = await db.qcproduct.find_many(
        where={"userId": user_id, "hargaJual": {"not": None}}
    )
    total_revenue = sum(p.hargaJual for p in products_with_prices if p.hargaJual)
    total_cost = sum(p.hargaProduksi for p in products_with_prices if p.hargaProduksi)
    profit = total_revenue - total_cost
    margin = round((profit / total_revenue * 100), 1) if total_revenue > 0 else 0

    # 4-Layer Credit Score Calculation
    score = 300 # Base Score

    # Layer 1: KYC
    if user_data.kyc and user_data.kyc.status in ["verified", "approved"]:
        score += 150

    # Layer 2: Activity (Scans)
    activity_points = min(all_time_scans * 2, 150)
    score += activity_points

    # Layer 3 & 4: Financial & Trust Factor
    financial_points = 0
    if total_revenue > 0 and 0 <= margin <= 85: # Heuristic: Margin must be reasonable
        trust_factor = min(all_time_scans / 50.0, 1.0) # Need 50 scans to fully trust financial data
        financial_points = int(150 * trust_factor)
    score += financial_points

    # Loyalty (Elite/Credits)
    loyalty = min(user_data.sisaKredit * 2, 100)
    score += loyalty
        
    score = min(score, 850)
    
    # Rating
    if score >= 750:
        rating = "Sangat Baik"
    elif score >= 600:
        rating = "Baik"
    elif score >= 450:
        rating = "Sedang"
    else:
        rating = "Perlu Perbaikan"

    brand_name = user_data.nama
    if user_data.kyc and user_data.kyc.namaToko:
        brand_name = user_data.kyc.namaToko

    return {
        "user_data": user_data,
        "brand_name": brand_name,
        "total_products": total_products,
        "total_scans_this_month": total_scans_this_month,
        "all_time_scans": all_time_scans,
        "total_revenue": total_revenue,
        "total_cost": total_cost,
        "profit": profit,
        "margin_percent": margin,
        "credit_score": score,
        "rating": rating,
    }
