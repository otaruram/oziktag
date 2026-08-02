"""QC Product submission router with image upload and AI analysis."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import Optional
from datetime import datetime
import json

from app.database import db
from prisma import Json
from app.dependencies import get_current_user, get_kyc_user
from app.services.imagekit_service import upload_multiple_images
from app.services.ai_service import analyze_qc
from app.services.credit_service import deduct_qr_credit, refund_qr_credit
from app.services.qc_service import process_qc_submission
from app.models.schemas import QCSubmitResponse, QCProductListItem

router = APIRouter(prefix="/api/qc", tags=["Quality Control"])

@router.post("/upload")
async def upload_images_api(
    images: list[UploadFile] = File(..., description="1-5 product images"),
    current_user: dict = Depends(get_kyc_user),
):
    """Utility endpoint to upload images and return URLs. Useful for API Playground."""
    if len(images) < 1:
        raise HTTPException(status_code=400, detail="Upload minimal 1 foto produk")
    if len(images) > 5:
        raise HTTPException(status_code=400, detail="Maksimal 5 foto produk")

    # Validate file type and size
    for img in images:
        if img.content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise HTTPException(status_code=400, detail=f"File {img.filename} bukan format gambar yang diizinkan (JPG/PNG/WEBP).")
        # Optional: check size if spooling (FastAPI handles large files by writing to disk)
        # But we can read to check length.
        
    try:
        image_files = []
        for img in images:
            content = await img.read()
            if len(content) > 5 * 1024 * 1024:
                raise HTTPException(status_code=413, detail=f"Ukuran file {img.filename} terlalu besar (Maks 5MB)")
            image_files.append((content, img.filename or "image.jpg"))
        image_urls = await upload_multiple_images(image_files)
        return {"urls": image_urls}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gagal upload gambar: {str(e)}")


@router.post("/submit", response_model=QCSubmitResponse)
async def submit_qc(
    nama_produk: str = Form(...),
    kategori: str = Form("Lainnya"),
    batch: Optional[str] = Form(None),
    checklist: str = Form(..., description="JSON array of checklist strings"),
    catatan_penjual: str = Form(...),
    harga_produksi: Optional[int] = Form(None),
    harga_jual: Optional[int] = Form(None),
    images: list[UploadFile] = File(..., description="1-5 product images"),
    current_user: dict = Depends(get_kyc_user),
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

    for img in images:
        if img.content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise HTTPException(status_code=400, detail=f"File {img.filename} bukan format gambar yang diizinkan (JPG/PNG/WEBP).")

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

    await deduct_qr_credit(user_id, is_admin, credits, f"Generate QC Label: {nama_produk[:20]}")

    # 4. Upload images to ImageKit
    try:
        image_files = []
        for img in images:
            content = await img.read()
            if len(content) > 5 * 1024 * 1024:
                # Refund credit if upload fails due to size
                await refund_qr_credit(user_id, is_admin, credits, "Refund Gagal Upload (Ukuran Terlalu Besar)")
                raise HTTPException(status_code=413, detail=f"Ukuran file {img.filename} terlalu besar (Maks 5MB)")
            image_files.append((content, img.filename or "image.jpg"))
        image_urls = await upload_multiple_images(image_files)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Refund credit if upload fails
        await refund_qr_credit(user_id, is_admin, credits, "Refund Gagal Upload Gambar")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal upload gambar: {str(e)}",
        )

    # 5. Call AI and save product (via service layer)
    try:
        product, ai_result = await process_qc_submission(
            user_id, nama_produk, kategori, batch, checklist_items, 
            catatan_penjual, harga_produksi, harga_jual, image_urls
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Refund credit if db save fails
        await refund_qr_credit(user_id, is_admin, credits, "Refund Gagal Generate QR")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menyimpan data produk: {str(e)}",
        )

    return QCSubmitResponse(
        product_id=product.id,
        message="Produk berhasil di-generate beserta QR code-nya",
        ai_insight=ai_result.get("ai_insight"),
        ai_solution=ai_result.get("ai_solution"),
    )


@router.get("/products", response_model=list[QCProductListItem])
async def list_products(current_user: dict = Depends(get_kyc_user)):
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
async def delete_qc(product_id: str, current_user: dict = Depends(get_kyc_user)):
    """Delete a QC product (must be owner)."""
    user_id = current_user["id"]
    
    product = await db.qcproduct.find_unique(where={"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if product.userId != user_id and not current_user.get("isAdmin", False):
        raise HTTPException(status_code=403, detail="Forbidden")
        
    await db.qcproduct.delete(where={"id": product_id})
    return {"message": "Product deleted successfully"}


@router.get("/scan/{product_id}")
async def scan_qc_public(product_id: str):
    """Public endpoint to view a QC product from a QR scan."""
    product = await db.qcproduct.find_unique(
        where={"id": product_id},
        include={"user": {"include": {"kyc": True}}, "images": True}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Record the scan for the dashboard
    try:
        await db.productscan.create(
            data={
                "productId": product.id,
                "userId": product.userId
            }
        )
    except Exception as e:
        print(f"Failed to record scan: {e}")

    checklist_val = product.checklist
    if isinstance(checklist_val, str):
        checklist_val = json.loads(checklist_val)

    brand_name = "Brand UMKM"
    if product.user:
        brand_name = product.user.nama
        if product.user.kyc and product.user.kyc.namaToko:
            brand_name = product.user.kyc.namaToko

    photos = [img.imagekitUrl for img in product.images] if product.images else []

    return {
        "id": product.id,
        "productName": product.namaProduk,
        "category": product.kategori,
        "batch": product.batch,
        "qc": checklist_val,
        "notes": product.catatanPenjual,
        "createdAt": product.createdAt.isoformat(),
        "brand": brand_name,
        "photos": photos,
        "aiInsight": product.aiInsight,
        "aiSolution": product.aiSolution,
        "isElite": product.user.isElite if product.user else False,
    }


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_kyc_user)):
    """Get total products and scans for current user."""
    from app.services.analytics_service import get_user_analytics
    
    user_id = current_user["id"]
    stats = await get_user_analytics(user_id)
    return {
        "total_products": stats["total_products"],
        "total_scans": stats["total_scans_this_month"],
        "credit_score": stats["credit_score"],
        "total_revenue": stats["total_revenue"],
        "avg_margin": stats["margin_percent"],
    }


@router.get("/credit-report")
async def get_credit_report(current_user: dict = Depends(get_kyc_user)):
    """Get detailed credit report data for PDF generation."""
    from app.services.analytics_service import get_user_analytics
    
    user_id = current_user["id"]
    stats = await get_user_analytics(user_id)

    from datetime import datetime
    
    return {
        "brand_name": stats["brand_name"],
        "email": stats["user_data"].email,
        "credit_score": stats["credit_score"],
        "rating": stats["rating"],
        "total_products": stats["total_products"],
        "total_scans": stats["all_time_scans"],
        "total_revenue": stats["total_revenue"],
        "total_cost": stats["total_cost"],
        "profit": stats["profit"],
        "margin_percent": stats["margin_percent"],
        "is_elite": stats["user_data"].isElite,
        "generated_at": datetime.now().isoformat(),
    }
