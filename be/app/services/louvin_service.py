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
    Create a payment transaction by calling SumoPod API directly.
    """
    settings = get_settings()

    pkg = get_package(paket)
    
    # Payload expected by SumoPod API
    payload = {
        "order_id": reference,
        "amount": pkg["price"],
        "currency": "IDR",
        "expires_in_hours": 24,
        "payment_method_type_code": payment_type,
        "success_return_url": f"{settings.frontend_url}/payment/success",
        "cancel_return_url": f"{settings.frontend_url}/payment/cancel"
    }

    url = "https://api-pay.sumopod.com/api/v1/payments"
    headers = {
        "Content-Type": "application/json",
        "X-Api-Key": settings.louvin_api_key, # Repurposing louvin_api_key config for SumoPod API Key
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=15.0)
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
    """Check payment status via SumoPod API."""
    settings = get_settings()

    # Using SumoPod get payment API
    url = f"https://api-pay.sumopod.com/api/v1/payments/{transaction_id}"

    headers = {
        "Content-Type": "application/json",
        "X-Api-Key": settings.louvin_api_key,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Payment check error: {response.text}")
            
    data = response.json()
    return data


def get_package(paket: str) -> dict:
    """Get package details by name."""
    if paket not in PACKAGES:
        raise ValueError(f"Invalid paket: {paket}")
    return PACKAGES[paket]
