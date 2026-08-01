"""Louvin payment gateway service."""

import httpx
from fastapi import HTTPException, status
from app.config import get_settings


# Package definitions (synced with pricing_service.py)
PACKAGES = {
    "starter": {"name": "Starter", "price": 15000, "credits": 50},
    "growth": {"name": "Growth", "price": 35000, "credits": 150},
    "pro": {"name": "Pro", "price": 79000, "credits": 400},
    "elite_monthly": {"name": "Artisan Elite", "price": 49900, "credits": 0},
}


def get_package(paket_id: str) -> dict:
    if paket_id not in PACKAGES:
        raise ValueError(f"Paket {paket_id} tidak valid")
    return PACKAGES[paket_id]


async def create_transaction(
    paket: str,
    payment_type: str,
    customer_name: str,
    customer_email: str,
    reference: str,
) -> dict:
    """
    Create a payment transaction by proxying to the Node.js microservice.
    """
    settings = get_settings()
    node_url = settings.node_backend_url

    if not node_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Node backend URL not configured"
        )

    pkg = get_package(paket)
    
    # Payload expected by Node.js SumoPod controller
    payload = {
        "order_id": reference,
        "amount": pkg["price"],
        "currency": "IDR",
        "expires_in_hours": 24,
        "payment_method_type_code": payment_type,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{node_url}/api/payment/create", json=payload, timeout=15.0)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        error_detail = "Failed to create payment"
        try:
            error_data = e.response.json()
            error_detail = error_data.get("details", error_data.get("error", str(e)))
        except:
            pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment Gateway Error: {error_detail}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to communicate with payment service: {str(e)}",
        )


async def check_status(transaction_id: str) -> dict:
    """Check payment status via Louvin API."""
    settings = get_settings()

    url = f"{settings.louvin_base_url}/check-status"

    headers = {
        "Content-Type": "application/json",
        "x-api-key": settings.louvin_api_key,
    }

    params = {"id": transaction_id}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=headers, params=params)

    data = response.json()

    if not data.get("success"):
        raise Exception(f"Louvin check-status error: {data.get('error', 'Unknown')}")

    return data


def get_package(paket: str) -> dict:
    """Get package details by name."""
    if paket not in PACKAGES:
        raise ValueError(f"Invalid paket: {paket}")
    return PACKAGES[paket]
