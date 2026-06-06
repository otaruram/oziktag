"""QC Product submission router with image upload and AI analysis."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import Optional
import json

from app.database import db
from prisma import Json
from app.dependencies import get_current_user
from app.services.imagekit_service import upload_multiple_images
from app.services.ai_service import analyze_qc
from app.models.schemas import QCSubmitResponse, QCProductListItem

router = APIRouter(prefix="/api/qc", tags=["Quality Control"])


@router.post("/submit", response_model=QCSubmitResponse)
async def submit_qc(
    nama_produk: str = Form(...),
    kategori: str = Form("Lainnya"),
    batch: Optional[str] = Form(None),
    checklist: str = Form(..., description="JSON array of checklist strings"),
    catatan_penjual: str = Form(...),
    images: list[UploadFile] = File(..., description="1-5 product images"),
    current_user: dict = Depends(get_current_user),
):
    """
    Submit a QC product form with images.
    - Validates credit balance
    - Uploads images to ImageKit
    - Calls Gemini AI for analysis
    - Saves product + images to database
    - Returns product ID (UUID for QR code)
    """
    user_id = current_user["id"]

    # 1. Validate images count
    if len(images) < 1:
        raise HTTPException(status_code=400, detail="Upload minimal 1 foto produk")
    if len(images) > 5:
        raise HTTPException(status_code=400, detail="Maksimal 5 foto produk")

    # 2. Parse checklist
    try:
        checklist_items = json.loads(checklist)
        if not isinstance(checklist_items, list) or len(checklist_items) == 0:
            raise ValueError()
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=400, detail="Checklist harus berupa JSON array minimal 1 item")

    # 3. Check and deduct credit
    user_data = await db.user.find_unique(where={"id": user_id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    credits = user_data.sisaKredit
    is_admin = user_data.isAdmin

    if not is_admin and credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Kredit habis. Silakan top-up dulu.",
        )

    if not is_admin:
        await db.user.update(
            where={"id": user_id},
            data={"sisaKredit": credits - 1}
        )

    # 4. Upload images to ImageKit
    try:
        image_files = []
        for img in images:
            content = await img.read()
            image_files.append((content, img.filename or "image.jpg"))
        image_urls = await upload_multiple_images(image_files)
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Refund credit if upload fails
        if not is_admin:
            await db.user.update(
                where={"id": user_id},
                data={"sisaKredit": credits}
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal upload gambar: {str(e)}",
        )

    # 5. Call AI for analysis
    try:
        ai_result = await analyze_qc(
            checklist=checklist_items,
            catatan_penjual=catatan_penjual,
            nama_produk=nama_produk,
            kategori=kategori,
        )
    except Exception as e:
        print(f"[QC Router] AI analysis failed: {e}")
        ai_result = {
            "ai_insight": f"Produk {nama_produk} telah melewati Quality Control.",
            "ai_solution": "Simpan produk sesuai petunjuk penyimpanan.",
        }

    # 6. Save product to database
    try:
        product = await db.qcproduct.create(
            data={
                "userId": user_id,
                "namaProduk": nama_produk.strip(),
                "kategori": kategori,
                "batch": batch.strip() if batch else None,
                "checklist": Json(checklist_items),
                "catatanPenjual": catatan_penjual.strip(),
                "aiInsight": ai_result["ai_insight"],
                "aiSolution": ai_result["ai_solution"],
                "images": {
                    "create": [
                        {"imagekitUrl": url} for url in image_urls
                    ]
                }
            }
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Refund credit if db save fails
        if not is_admin:
            await db.user.update(
                where={"id": user_id},
                data={"sisaKredit": credits}
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menyimpan data produk: {str(e)}",
        )

    return QCSubmitResponse(
        product_id=product.id,
        message="Trusted Label berhasil dibuat!",
        ai_insight=product.aiInsight,
        ai_solution=product.aiSolution,
    )


@router.get("/products", response_model=list[QCProductListItem])
async def list_products(current_user: dict = Depends(get_current_user)):
    """List all QC products for the current user."""
    user_id = current_user["id"]

    products = await db.qcproduct.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"},
        take=50
    )

    result = []
    for p in products:
        checklist_val = p.checklist
        if isinstance(checklist_val, str):
            checklist_val = json.loads(checklist_val)
        result.append(
            QCProductListItem(
                id=p.id,
                nama_produk=p.namaProduk,
                kategori=p.kategori,
                batch=p.batch,
                checklist=checklist_val,
                created_at=p.createdAt.isoformat(),
            )
        )
    return result


@router.delete("/{product_id}")
async def delete_qc(product_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a QC product (must be owner)."""
    user_id = current_user["id"]
    
    product = await db.qcproduct.find_unique(where={"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if product.userId != user_id and not current_user.get("isAdmin", False):
        raise HTTPException(status_code=403, detail="Forbidden")
        
    await db.qcproduct.delete(where={"id": product_id})
    return {"message": "Product deleted successfully"}


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    """Get total products and scans for current user."""
    user_id = current_user["id"]
    
    total_products = await db.qcproduct.count(where={"userId": user_id})
    
    from datetime import datetime
    now = datetime.now()
    start_of_month = datetime(now.year, now.month, 1)
    
    total_scans = await db.productscan.count(
        where={
            "userId": user_id,
            "scannedAt": {"gte": start_of_month}
        }
    )
    
    return {
        "total_products": total_products,
        "total_scans": total_scans
    }
