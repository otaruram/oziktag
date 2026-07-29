"""Tracking router — supply chain tracking endpoints."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from typing import Optional

from app.dependencies import get_current_user
from app.services.tracking_service import (
    create_tracking_product,
    process_scan,
    get_tracking_data,
    get_seller_products,
)
from app.services.imagekit_service import upload_image
from app.models.schemas import (
    TrackingInitResponse,
    TrackingScanRequest,
    TrackingScanResponse,
    TrackingDetailResponse,
)

router = APIRouter(prefix="/api/tracking", tags=["Tracking"])


@router.post("/init", response_model=TrackingInitResponse)
async def init_tracking(
    name: str = Form(...),
    checklist_qc: str = Form("[]"),
    seller_notes: str = Form(""),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Initialize a tracking product (Seller only).
    - Uploads image to ImageKit
    - Generates AI summary via Gemini
    - Returns product ID for QR code generation
    """
    import json

    try:
        checklist = json.loads(checklist_qc)
    except (json.JSONDecodeError, TypeError):
        checklist = []

    # Upload image if provided
    image_url = None
    if image:
        try:
            content = await image.read()
            image_url = await upload_image(content, image.filename or "tracking_img.jpg")
        except Exception as e:
            print(f"[Tracking] Image upload failed: {e}")

    # Create tracking product
    result = await create_tracking_product(
        user_id=current_user["id"],
        name=name,
        checklist=checklist,
        seller_notes=seller_notes,
        image_url=image_url,
    )

    from app.config import get_settings
    settings = get_settings()
    tracking_url = f"{settings.frontend_url}/tracking/{result['id']}"

    return TrackingInitResponse(
        product_id=result["id"],
        tracking_url=tracking_url,
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
            lat=request.lat,
            lng=request.lng,
        )
        return TrackingScanResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/seller/my-products")
async def get_my_tracking_products(current_user: dict = Depends(get_current_user)):
    """Get all tracking products for the authenticated seller."""
    products = await get_seller_products(current_user["id"])
    return products


@router.get("/{product_id}", response_model=TrackingDetailResponse)
async def get_tracking(
    product_id: str,
    role: str = Query("buyer", description="View role: seller, courier, or buyer"),
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

    data = await get_tracking_data(product_id, role)
    if not data:
        raise HTTPException(status_code=404, detail="Tracking product tidak ditemukan")

    return TrackingDetailResponse(**data)

