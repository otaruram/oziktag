"""Public QR scan endpoint — no authentication required."""

import json
from fastapi import APIRouter, HTTPException
from app.database import db
from app.models.schemas import ScanResponse

router = APIRouter(prefix="/api/scan", tags=["Scan (Public)"])


@router.get("/{product_id}", response_model=ScanResponse)
async def scan_product(product_id: str):
    """
    Public endpoint for QR code scanning.
    Returns product details, seller's notes (shown first),
    and AI insight/solution (toggleable in frontend).
    """
    product = await db.qcproduct.find_unique(
        where={"id": product_id},
        include={"images": True, "user": {"include": {"kyc": True}}}
    )

    if not product:
        raise HTTPException(status_code=404, detail="QR tidak ditemukan.")

    user = product.user
    
    # Check Inactive User Policy (90 days inactive & 0 credit)
    if user.lastSeenAt and user.sisaKredit <= 0:
        from datetime import datetime, timezone
        days_inactive = (datetime.now(timezone.utc) - user.lastSeenAt).days
        if days_inactive >= 90:
            raise HTTPException(
                status_code=403, 
                detail="QR Code ini dinonaktifkan sementara karena pemilik tidak aktif. Pemilik dapat mengaktifkannya kembali dengan Top-Up saldo Oziktag."
            )

    # Record the scan
    try:
        await db.productscan.create(
            data={
                "productId": product.id,
                "userId": product.userId
            }
        )
    except Exception as e:
        print(f"[Scan Tracker] Failed to record scan: {e}")

    image_urls = [img.imagekitUrl for img in product.images]

    # Get seller brand name from shop/KYC or name
    brand = "Brand UMKM"
    if product.user.kyc and product.user.kyc.namaToko:
        brand = product.user.kyc.namaToko
    elif product.user.nama:
        brand = product.user.nama

    checklist_val = product.checklist
    if isinstance(checklist_val, str):
        checklist_val = json.loads(checklist_val)

    return ScanResponse(
        id=product.id,
        nama_produk=product.namaProduk,
        kategori=product.kategori,
        batch=product.batch,
        checklist=checklist_val,
        catatan_penjual=product.catatanPenjual,
        ai_insight=product.aiInsight,
        ai_solution=product.aiSolution,
        images=image_urls,
        brand=brand,
        created_at=product.createdAt.isoformat(),
        verified=True,
    )
