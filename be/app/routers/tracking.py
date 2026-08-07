"""Tracking router — supply chain tracking endpoints."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from typing import Optional

from app.database import db
from app.dependencies import get_current_user, get_kyc_user
from app.services.tracking_service import (
    create_tracking_product,
    process_scan,
    get_tracking_data,
    get_seller_products,
    hide_tracking_product,
)
from app.services.escrow_service import verify_buyer_pin
from pydantic import BaseModel
from app.services.imagekit_service import upload_image, validate_and_read_images
from app.services.credit_service import deduct_qr_credit, refund_qr_credit
from app.models.schemas import (
    TrackingInitResponse,
    TrackingScanRequest,
    TrackingScanResponse,
    TrackingDetailResponse,
)
from app.config import get_settings

router = APIRouter(prefix="/api/tracking", tags=["Tracking"])




@router.post("/init", response_model=TrackingInitResponse)
async def init_tracking(
    name: str = Form(...),
    checklist_qc: str = Form("[]"),
    seller_notes: str = Form(""),
    image: UploadFile = File(...),
    is_escrow: bool = Form(False),
    price: int = Form(0),
    youtube_url: str = Form(""),
    current_user: dict = Depends(get_kyc_user),
):
    """
    Initialize a tracking product (Seller only).
    - Uploads image to ImageKit
    - Generates AI summary via Gemini
    - Returns product ID for QR code generation
    """
    import json
    import uuid
    from app.services.sumopod_service import create_escrow_transaction

    try:
        checklist = json.loads(checklist_qc)
    except (json.JSONDecodeError, TypeError):
        checklist = []

    # Check and deduct credit
    user_data = await db.user.find_unique(where={"id": current_user["id"]})
    if not user_data:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    credits = user_data.sisaKredit
    is_admin = user_data.isAdmin

    if not is_admin and credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Kredit habis. Silakan top-up dulu.",
        )

    await deduct_qr_credit(current_user["id"], is_admin, credits, f"Generate Tracking: {name[:20]}")

    # Upload image if provided
    image_url = None
    if image:
        try:
            image_files = await validate_and_read_images([image], max_size_mb=5)
        except HTTPException as e:
            await refund_qr_credit(current_user["id"], is_admin, credits, "Refund Gagal Validasi Format/Ukuran Gambar")
            raise
            
        try:
            content, filename = image_files[0]
            image_url = await upload_image(content, filename)
        except HTTPException:
            raise
        except Exception as e:
            print(f"[Tracking] Image upload failed: {e}")
            await refund_qr_credit(current_user["id"], is_admin, credits, "Refund Gagal Upload Gambar Tracking")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Gagal upload gambar: {str(e)}",
            )

    escrow_fee = 0
    net_amount = 0
    sumopod_ref = None
    payment_url = None

    if is_escrow and price > 0:
        escrow_fee = int((price * 0.015) + 1000)
        net_amount = price - escrow_fee
        sumopod_ref = f"ESC-TRACK-{uuid.uuid4()}"
        
    # Create tracking product
    try:
        result = await create_tracking_product(
            user_id=current_user["id"],
            name=name,
            checklist=checklist,
            seller_notes=seller_notes,
            image_url=image_url,
            is_escrow=is_escrow,
            price=price,
            escrow_fee=escrow_fee,
            net_amount=net_amount,
            sumopod_ref=sumopod_ref,
            payment_url=None,
            youtube_url=youtube_url.strip() if youtube_url else None,
        )
    except Exception as e:
        await refund_qr_credit(current_user["id"], is_admin, credits, "Refund Gagal Generate Tracking")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menyimpan data tracking: {str(e)}",
        )

    settings = get_settings()
    tracking_url = f"{settings.frontend_url}/tracking/{result['id']}"
    
    payment_url = None
    if is_escrow and price > 0:
        try:
            # We use QRIS as default for Escrow checkout
            res = await create_escrow_transaction(
                amount=price,
                payment_type="qris",
                customer_name="Oziktag Buyer",
                customer_email="buyer@oziktag.com",
                reference=sumopod_ref,
                return_url=f"{tracking_url}?paid=1"
            )
            payment_url = res.get("payment_link_url", res.get("payment_url"))
            if not payment_url and "payment" in res:
                payment_url = res["payment"].get("payment_link_url", res["payment"].get("payment_url"))
                
            if payment_url:
                await db.trackingproduct.update(
                    where={"id": result["id"]},
                    data={"paymentUrl": payment_url}
                )
        except Exception as e:
            # If payment gateway fails, fallback to standard tracking or raise
            raise HTTPException(status_code=500, detail=f"Gagal membuat link pembayaran: {str(e)}")

    return TrackingInitResponse(
        product_id=result["id"],
        tracking_url=tracking_url,
        buyer_pin=result["buyer_pin"],
        ai_summary=result["ai_summary"],
        message="Tracking product berhasil dibuat",
    )


@router.post("/scan", response_model=TrackingScanResponse)
async def scan_tracking(request: TrackingScanRequest):
    """
    Dynamic scan endpoint (Public).
    Records geolocation and updates status based on role.
    """
    valid_roles = {"seller", "courier", "buyer"}
    if request.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role harus salah satu dari: {', '.join(valid_roles)}",
        )

    try:
        result = await process_scan(
            product_id=request.product_id,
            role=request.role,
            pin=request.pin,
            lat=request.lat,
            lng=request.lng,
        )
        return TrackingScanResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


class VerifyPinRequest(BaseModel):
    product_id: str
    buyer_pin: str

@router.post("/verify-pin")
async def verify_pin(request: VerifyPinRequest):
    """
    Verify buyer PIN for escrow release.
    """
    try:
        result = await verify_buyer_pin(request.product_id, request.buyer_pin)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/seller/my-products")
async def get_my_tracking_products(
    page: int = Query(1, ge=1),
    current_user: dict = Depends(get_kyc_user)
):
    """Get all tracking products for the authenticated seller."""
    limit = 10
    offset = (page - 1) * limit
    products = await get_seller_products(current_user["id"], limit, offset)
    return products


@router.delete("/seller/my-products/{product_id}")
async def delete_my_tracking_product(
    product_id: str,
    current_user: dict = Depends(get_kyc_user)
):
    """Soft delete a tracking product from seller's dashboard."""
    success = await hide_tracking_product(product_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Tracking product tidak ditemukan")
    return {"message": "Tracking product berhasil dihapus dari riwayat"}


@router.get("/{product_id}", response_model=TrackingDetailResponse)
async def get_tracking(
    product_id: str,
    role: str = Query("buyer", description="View role: seller, courier, or buyer"),
    pin: Optional[str] = Query(None, description="Buyer PIN"),
):
    """
    Get tracking data filtered by role (Public).
    - courier: minimal data (no image, no AI summary)
    - buyer/seller: full data with timeline
    """
    valid_roles = {"seller", "courier", "buyer"}
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role harus salah satu dari: {', '.join(valid_roles)}",
        )

    data = await get_tracking_data(product_id, role, pin)
    if not data:
        raise HTTPException(status_code=404, detail="Tracking product tidak ditemukan")

    return TrackingDetailResponse(**data)


class DisputeRequest(BaseModel):
    buyer_email: str
    buyer_phone: Optional[str] = None
    reason: str
    video_url: Optional[str] = None

@router.post("/{product_id}/dispute")
async def open_dispute(product_id: str, request: DisputeRequest):
    """
    Open a dispute for a delivered tracking product within 24h settlement window.
    """
    from datetime import datetime, timedelta, timezone
    from app.services.email_service import send_email

    product = await db.trackingproduct.find_unique(where={"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Tracking product tidak ditemukan")
        
    if product.currentStatus != "DELIVERED":
        raise HTTPException(status_code=400, detail="Pesanan belum diterima, sengketa belum dapat diajukan.")
        
    if product.escrowStatus != "HELD":
        raise HTTPException(status_code=400, detail="Sengketa tidak dapat diajukan untuk status ini.")
        
    if not product.deliveredAt:
        raise HTTPException(status_code=400, detail="Waktu penerimaan tidak valid.")
        
    # Check if within 24 hours
    now = datetime.now(timezone.utc)
    if now > product.deliveredAt + timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Masa pengajuan sengketa (1x24 jam) telah habis.")

    # Create ticket and update status
    async with db.tx() as tx:
        await tx.trackingproduct.update(
            where={"id": product_id},
            data={"escrowStatus": "DISPUTED"}
        )
        ticket = await tx.disputeticket.create(
            data={
                "trackingProductId": product_id,
                "buyerEmail": request.buyer_email,
                "buyerPhone": request.buyer_phone,
                "reason": request.reason,
                "videoUrl": request.video_url,
                "status": "OPEN"
            }
        )

    # Send email to admin
    try:
        html_content = f"""
        <h2>Tiket Sengketa Baru #{ticket.id}</h2>
        <p><strong>Tracking ID:</strong> {product_id}</p>
        <p><strong>Email Pembeli:</strong> {request.buyer_email}</p>
        <p><strong>Telepon:</strong> {request.buyer_phone}</p>
        <p><strong>Alasan:</strong><br/>{request.reason}</p>
        <p><strong>Bukti Video:</strong> <a href="{request.video_url}">Lihat Video</a></p>
        <br/>
        <p>Harap segera tinjau di Dashboard Admin Oziktag.</p>
        """
        await send_email(
            to_email="admin@oziktag.my.id",
            subject=f"🚨 Sengketa Baru: {product.name}",
            body_html=html_content
        )
    except Exception as e:
        print(f"[Dispute] Failed to send email to admin: {e}")

    return {"message": "Sengketa berhasil diajukan. Dana ditahan sementara hingga masalah selesai."}

