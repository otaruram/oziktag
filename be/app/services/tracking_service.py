"""Tracking service — business logic for supply chain tracking."""

import json
import httpx
from app.config import get_settings
from app.database import db


async def generate_tracking_summary(
    checklist: list[str],
    seller_notes: str,
    product_name: str,
) -> str:
    """
    Call Gemini AI to summarize seller notes + checklist into a
    friendly customer-facing narrative for the tracking page.
    Reuses the same Gemini infrastructure as ai_service.py.
    """
    settings = get_settings()

    prompt = f"""Kamu adalah asisten supply chain profesional untuk UMKM Indonesia.
Buatlah ringkasan singkat (3-4 kalimat) yang ramah untuk pembeli tentang kondisi produk ini
berdasarkan catatan penjual dan checklist QC. Tulis dalam Bahasa Indonesia yang natural.

Nama Produk: {product_name}

Checklist QC Penjual:
{chr(10).join(f"✓ {item}" for item in checklist) if checklist else "Tidak ada checklist khusus."}

Catatan Penjual:
{seller_notes or "Tidak ada catatan khusus."}

INSTRUKSI:
- Jangan gunakan format bullet/numbering.
- Langsung tulis ringkasannya saja tanpa label "RINGKASAN:" atau sejenisnya.
- Fokus pada transparansi kondisi produk dan alasan mengapa pembeli bisa percaya.
"""

    try:
        base_url = settings.gemini_base_url.rstrip("/")
        url = f"{base_url}/v1/chat/completions"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.gemini_api_key}",
        }

        payload = {
            "model": settings.gemini_model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 512,
            "temperature": 0.7,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return content.strip() if content.strip() else _fallback_summary(product_name, checklist, seller_notes)

    except Exception as e:
        print(f"[Tracking AI] Error calling Gemini: {e}")
        return _fallback_summary(product_name, checklist, seller_notes)


def _fallback_summary(name: str, checklist: list[str], notes: str) -> str:
    """Generate fallback summary when AI is unavailable."""
    parts = [f"Produk {name} telah melewati {len(checklist)} checklist Quality Control oleh penjual."]
    if notes:
        parts.append(f'Catatan penjual: "{notes}".')
    parts.append("Produk ini disiapkan dengan standar kualitas yang terjaga untuk menjamin kepuasan Anda.")
    return " ".join(parts)


async def create_tracking_product(
    user_id: str,
    name: str,
    checklist: list[str],
    seller_notes: str,
    image_url: str | None = None,
) -> dict:
    """Create a new tracking product with AI summary."""
    import random
    
    # Generate 6-digit PIN
    buyer_pin = f"{random.randint(0, 999999):06d}"

    # Generate AI summary
    ai_summary = await generate_tracking_summary(checklist, seller_notes, name)

    product = await db.trackingproduct.create(
        data={
            "userId": user_id,
            "name": name,
            "buyerPin": buyer_pin,
            "checklistQc": json.dumps(checklist),
            "sellerNotes": seller_notes,
            "aiSummary": ai_summary,
            "imageUrl": image_url,
            "currentStatus": "PACKED",
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
    if new_status != product.currentStatus:
        await db.trackingproduct.update(
            where={"id": product_id},
            data={"currentStatus": new_status},
        )

    # Log to tracking history
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
    }


async def get_seller_products(user_id: str) -> list[dict]:
    """Get all tracking products for a seller."""
    products = await db.trackingproduct.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"},
        include={"history": {"order_by": {"timestamp": "desc"}, "take": 1}},
    )

    return [
        {
            "id": p.id,
            "name": p.name,
            "current_status": p.currentStatus,
            "image_url": p.imageUrl,
            "last_update": p.history[0].statusUpdate if p.history else "Baru dibuat",
            "created_at": p.createdAt.isoformat(),
        }
        for p in products
    ]
