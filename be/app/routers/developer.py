"""Developer API router (v1)."""

from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import json
from app.database import db
from prisma import Json
from app.services.ai_service import analyze_qc
from app.services.tracking_service import create_tracking_product

router = APIRouter(prefix="/api/v1", tags=["Developer API"])
security = HTTPBearer()

async def get_user_from_api_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Dependency to validate API Key and return User."""
    key = credentials.credentials
    key_db = await db.apikey.find_unique(where={"key": key}, include={"user": True})
    
    if not key_db or not key_db.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API Key",
        )
    return key_db.user

class QCSubmitRequest(BaseModel):
    nama_produk: str
    kategori: str = "Lainnya"
    batch: Optional[str] = None
    checklist: list[str] = ["Kondisi fisik baik", "Sesuai standar"]
    catatan_penjual: Optional[str] = "Dibuat via API"
    image_urls: list[str] = ["https://ik.imagekit.io/nc7w3hotd/oziktag/products/dummy_api.jpg"]

@router.post("/qc")
async def submit_qc_api(
    req: QCSubmitRequest,
    user=Depends(get_user_from_api_key)
):
    """
    Developer API endpoint to create a QC label programmatically.
    Deducts 1 credit per successful request.
    """
    # 1. Check and deduct credit
    if not user.isAdmin and user.apiKredit <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Kredit API habis. Silakan top-up paket API dulu.",
        )

    # 2. Call actual AI
    ai_result = await analyze_qc(
        checklist=req.checklist or [],
        catatan_penjual=req.catatan_penjual or "",
        nama_produk=req.nama_produk.strip(),
        kategori=req.kategori
    )
    ai_insight = ai_result.get("ai_insight", "Lulus QC.")
    ai_solution = ai_result.get("ai_solution", "Simpan dengan baik.")

    async with db.tx() as tx:
        if not user.isAdmin:
            await tx.user.update(
                where={"id": user.id},
                data={"apiKredit": user.apiKredit - 1}
            )
        await tx.creditlog.create(
            data={
                "userId": user.id,
                "tipeKredit": "API",
                "action": "USAGE",
                "amount": 0 if user.isAdmin else -1,
                "description": f"Generate QC via API: {req.nama_produk[:20]}"
            }
        )

    # 3. Create Product
    try:
        product = await db.qcproduct.create(
            data={
                "userId": user.id,
                "namaProduk": req.nama_produk.strip(),
                "kategori": req.kategori,
                "batch": req.batch.strip() if req.batch else None,
                "checklist": Json(req.checklist),
                "catatanPenjual": req.catatan_penjual,
                "aiInsight": ai_insight,
                "aiSolution": ai_solution,
                "images": {
                    "create": [
                        {"imagekitUrl": url} for url in req.image_urls
                    ]
                }
            }
        )
    except Exception as e:
        # Refund on fail
        if not user.isAdmin:
            async with db.tx() as tx:
                await tx.user.update(
                    where={"id": user.id},
                    data={"apiKredit": user.apiKredit}
                )
                await tx.creditlog.create(
                    data={
                        "userId": user.id,
                        "tipeKredit": "API",
                        "action": "REFUND",
                        "amount": 1,
                        "description": f"Refund Gagal Generate API"
                    }
                )
        raise HTTPException(
            status_code=500, detail=str(e)
        )

    # Return 201 response with QR link
    return {
        "success": True,
        "product_id": product.id,
        "qr_url": f"https://www.oziktag.my.id/scan/{product.id}"
    }

class TrackingSubmitRequest(BaseModel):
    nama_produk: str
    checklist: list[str] = ["Kondisi fisik baik", "Kemasan rapi"]
    catatan_penjual: Optional[str] = "Dibuat via API"
    image_url: Optional[str] = "https://ik.imagekit.io/nc7w3hotd/oziktag/products/dummy_api.jpg"

@router.post("/tracking")
async def submit_tracking_api(
    req: TrackingSubmitRequest,
    user=Depends(get_user_from_api_key)
):
    """
    Developer API endpoint to create a Tracking Lite label programmatically.
    Deducts 1 credit per successful request.
    """
    # 1. Check and deduct credit
    if not user.isAdmin and user.apiKredit <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Kredit API habis. Silakan top-up paket API dulu.",
        )

    # 2. Call service layer which handles AI summary and DB creation
    try:
        async with db.tx() as tx:
            if not user.isAdmin:
                await tx.user.update(
                    where={"id": user.id},
                    data={"apiKredit": user.apiKredit - 1}
                )
            await tx.creditlog.create(
                data={
                    "userId": user.id,
                    "tipeKredit": "API",
                    "action": "USAGE",
                    "amount": 0 if user.isAdmin else -1,
                    "description": f"Generate Tracking via API: {req.nama_produk[:20]}"
                }
            )
            
        result = await create_tracking_product(
            user_id=user.id,
            name=req.nama_produk.strip(),
            checklist=req.checklist,
            seller_notes=req.catatan_penjual or "",
            image_url=req.image_url
        )
    except Exception as e:
        # Refund on fail
        if not user.isAdmin:
            async with db.tx() as tx:
                await tx.user.update(
                    where={"id": user.id},
                    data={"apiKredit": user.apiKredit}
                )
                await tx.creditlog.create(
                    data={
                        "userId": user.id,
                        "tipeKredit": "API",
                        "action": "REFUND",
                        "amount": 1,
                        "description": f"Refund Gagal Generate Tracking API"
                    }
                )
        raise HTTPException(
            status_code=500, detail=str(e)
        )

    return {
        "success": True,
        "product_id": result["id"],
        "buyer_pin": result["buyer_pin"],
        "tracking_url": f"https://www.oziktag.my.id/tracking/{result['id']}",
        "message": "Tracking Lite berhasil di-generate."
    }
