"""Tracking service — business logic for supply chain tracking."""

import json
import httpx
from app.config import get_settings
from app.database import db


from app.services.ai_service import analyze_tracking


async def create_tracking_product(
    user_id: str,
    name: str,
    checklist: list[str],
    seller_notes: str,
    image_url: str | None = None,
    is_escrow: bool = False,
    price: int = 0,
    escrow_fee: int = 0,
    net_amount: int = 0,
    sumopod_ref: str | None = None,
    payment_url: str | None = None,
    youtube_url: str | None = None,
) -> dict:
    """Create a new tracking product with AI summary."""
    import random
    import string
    
    # Generate 8-character alphanumeric PIN
    buyer_pin = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

    # Generate AI summary
    ai_summary = await analyze_tracking(
        name=name,
        checklist=checklist,
        seller_notes=seller_notes,
        image_url=image_url
    )

    product = await db.trackingproduct.create(
        data={
            "userId": user_id,
            "name": name,
            "buyerPin": buyer_pin,
            "checklistQc": json.dumps(checklist),
            "sellerNotes": seller_notes,
            "aiSummary": ai_summary,
            "imageUrl": image_url,
            "currentStatus": "PENDING_PAYMENT" if is_escrow else "PACKED",
            "isEscrow": is_escrow,
            "price": price,
            "escrowFee": escrow_fee,
            "netAmount": net_amount,
            "sumopodRef": sumopod_ref,
            "paymentUrl": payment_url,
            "youtubeUrl": youtube_url,
        }
    )

    return {
        "id": product.id,
        "buyer_pin": buyer_pin,
        "ai_summary": ai_summary,
    }


async def process_scan(
    product_id: str,
    role: str,
    pin: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
) -> dict:
    """
    Process a tracking scan based on role.
    - seller: status -> IN_TRANSIT (handover to courier)
    - courier: log location only (blind scan)
    - buyer: status -> DELIVERED (requires PIN validation)
    """
    product = await db.trackingproduct.find_unique(where={"id": product_id})
    if not product:
        raise ValueError("Product not found")

    if role == "buyer" and product.buyerPin != pin:
        raise ValueError("PIN tidak valid")

    new_status = product.currentStatus
    status_update = ""

    if role == "seller":
        if product.currentStatus == "PACKED":
            new_status = "IN_TRANSIT"
            status_update = "Produk diserahkan ke kurir oleh penjual"
        else:
            status_update = f"Penjual melakukan scan (status: {product.currentStatus})"

    elif role == "courier":
        status_update = "Kurir mengkonfirmasi pengambilan / checkpoint"

    elif role == "buyer":
        if product.currentStatus != "DELIVERED":
            new_status = "DELIVERED"
            status_update = "Produk diterima oleh pembeli"
        else:
            status_update = "Pembeli melakukan verifikasi ulang"

    else:
        raise ValueError(f"Invalid role: {role}")

    # Update product status if changed
    update_data = {}
    if new_status != product.currentStatus:
        update_data["currentStatus"] = new_status
        if new_status == "DELIVERED" and product.deliveredAt is None:
            from datetime import datetime, timezone
            update_data["deliveredAt"] = datetime.now(timezone.utc)

    if update_data:
        if new_status == "DELIVERED" and product.deliveredAt is None and product.isEscrow and product.netAmount > 0:
            async with db.tx() as tx:
                await tx.trackingproduct.update(
                    where={"id": product_id},
                    data=update_data,
                )
                await tx.user.update(
                    where={"id": product.userId},
                    data={"escrowBalance": {"increment": product.netAmount}}
                )
                await tx.trackinghistory.create(
                    data={
                        "productId": product_id,
                        "statusUpdate": status_update,
                        "scannedByRole": role,
                        "latitude": lat,
                        "longitude": lng,
                    }
                )
        else:
            await db.trackingproduct.update(
                where={"id": product_id},
                data=update_data,
            )
            await db.trackinghistory.create(
                data={
                    "productId": product_id,
                    "statusUpdate": status_update,
                    "scannedByRole": role,
                    "latitude": lat,
                    "longitude": lng,
                }
            )
    else:
        # Log to tracking history even if status didn't change
        await db.trackinghistory.create(
            data={
                "productId": product_id,
                "statusUpdate": status_update,
                "scannedByRole": role,
                "latitude": lat,
                "longitude": lng,
            }
        )

    return {
        "message": status_update,
        "new_status": new_status,
    }


async def get_tracking_data(product_id: str, role: str, pin: str | None = None) -> dict | None:
    """
    Get tracking data filtered by role.
    - courier: minimal data (no image, no AI summary)
    - buyer/seller: full data (buyer MUST provide correct pin)
    """
    product = await db.trackingproduct.find_unique(
        where={"id": product_id},
        include={
            "history": {"order_by": {"timestamp": "asc"}},
            "user": {"include": {"kyc": True}},
        },
    )

    if not product:
        return None

    # Role-based filtering
    # If role is buyer but PIN is wrong, gracefully degrade to Courier view (or reject)
    if role == "buyer" and product.buyerPin != pin:
        # Give them the courier view instead
        role = "courier"

    # Parse checklist
    checklist = product.checklistQc
    if isinstance(checklist, str):
        try:
            checklist = json.loads(checklist)
        except Exception:
            checklist = []

    # Get brand name
    brand = "Brand UMKM"
    if product.user and product.user.kyc and product.user.kyc.namaToko:
        brand = product.user.kyc.namaToko
    elif product.user and product.user.nama:
        brand = product.user.nama

    # Build history
    history = [
        {
            "id": h.id,
            "status_update": h.statusUpdate,
            "scanned_by_role": h.scannedByRole,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "timestamp": h.timestamp.isoformat(),
        }
        for h in product.history
    ]

    # Role-based filtering
    if role == "courier":
        return {
            "id": product.id,
            "name": product.name,
            "current_status": product.currentStatus,
            "image_url": None,  # HIDDEN from courier
            "ai_summary": None,  # HIDDEN from courier
            "checklist_qc": [],  # HIDDEN from courier
            "seller_notes": None,
            "brand": None,
            "history": history,
            "created_at": product.createdAt.isoformat(),
        }

    # buyer or seller — full data
    return {
        "id": product.id,
        "name": product.name,
        "current_status": product.currentStatus,
        "image_url": product.imageUrl,
        "ai_summary": product.aiSummary,
        "checklist_qc": checklist,
        "seller_notes": product.sellerNotes,
        "brand": brand,
        "history": history,
        "created_at": product.createdAt.isoformat(),
        
        # Escrow fields
        "is_escrow": product.isEscrow,
        "price": product.price,
        "escrow_fee": product.escrowFee,
        "payment_url": product.paymentUrl,
        "youtube_url": product.youtubeUrl,
    }


async def get_seller_products(user_id: str, limit: int = 10, offset: int = 0) -> list[dict]:
    """Get all tracking products for a seller with pagination and filtering hidden."""
    products = await db.trackingproduct.find_many(
        where={"userId": user_id, "isHiddenBySeller": False},
        order={"createdAt": "desc"},
        take=limit,
        skip=offset,
        include={"history": {"order_by": {"timestamp": "desc"}, "take": 1}},
    )

    return [
        {
            "id": p.id,
            "name": p.name,
            "current_status": p.currentStatus,
            "image_url": p.imageUrl,
            "buyer_pin": p.buyerPin,
            "is_escrow": p.isEscrow,
            "price": p.price,
            "escrow_status": p.escrowStatus,
            "payment_url": p.paymentUrl,
            "last_update": p.history[0].statusUpdate if p.history else "Baru dibuat",
            "created_at": p.createdAt.isoformat(),
        }
        for p in products
    ]

async def hide_tracking_product(product_id: str, user_id: str) -> bool:
    """Soft delete tracking product for seller."""
    product = await db.trackingproduct.find_first(
        where={"id": product_id, "userId": user_id}
    )
    if not product:
        return False
    
    await db.trackingproduct.update(
        where={"id": product_id},
        data={"isHiddenBySeller": True}
    )
    return True

async def get_all_tracking_admin(limit: int = 20, offset: int = 0) -> list[dict]:
    """Get all tracking activities across all users for Admin."""
    products = await db.trackingproduct.find_many(
        order={"createdAt": "desc"},
        take=limit,
        skip=offset,
        include={
            "user": {"include": {"kyc": True}},
            "history": {"order_by": {"timestamp": "desc"}, "take": 1}
        },
    )

    return [
        {
            "id": p.id,
            "name": p.name,
            "current_status": p.currentStatus,
            "seller_email": p.user.email if p.user else "Unknown",
            "seller_name": (p.user.kyc.namaToko if p.user and p.user.kyc and p.user.kyc.namaToko else p.user.nama) if p.user else "Unknown",
            "last_update": p.history[0].statusUpdate if p.history else "Baru dibuat",
            "created_at": p.createdAt.isoformat(),
        }
        for p in products
    ]


async def auto_release_escrow():
    """Auto-release escrow funds 48 hours after delivery."""
    from datetime import datetime, timezone, timedelta
    
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
    
    products = await db.trackingproduct.find_many(
        where={
            "isEscrow": True,
            "currentStatus": "DELIVERED",
            "escrowStatus": "HELD",
            "deliveredAt": {"lt": cutoff},
        }
    )
    
    released_count = 0
    for product in products:
        try:
            async with db.tx() as tx:
                await tx.trackingproduct.update(
                    where={"id": product.id},
                    data={
                        "escrowStatus": "RELEASED",
                        "payoutReleasedAt": datetime.now(timezone.utc),
                    }
                )
                await tx.user.update(
                    where={"id": product.userId},
                    data={"escrowBalance": {"increment": product.netAmount}}
                )
                await tx.trackinghistory.create(
                    data={
                        "productId": product.id,
                        "statusUpdate": f"Dana escrow Rp {product.netAmount:,} otomatis dicairkan setelah 2x24 jam.",
                        "scannedByRole": "system",
                    }
                )
            released_count += 1
            print(f"[Auto-Release] Released escrow for product {product.id}, amount: {product.netAmount}")
        except Exception as e:
            print(f"[Auto-Release] Failed for product {product.id}: {e}")
    
    if released_count > 0:
        print(f"[Auto-Release] Total released: {released_count} products")
    return released_count
