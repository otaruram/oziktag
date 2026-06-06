"""Louvin payment gateway service."""

import httpx
from app.config import get_settings


# Package definitions
PACKAGES = {
    "starter": {"name": "Starter", "price": 20000, "credits": 50},
    "growth": {"name": "Growth", "price": 50000, "credits": 150},
    "pro": {"name": "Pro", "price": 100000, "credits": 400},
}


async def create_transaction(
    paket: str,
    payment_type: str,
    customer_name: str = "",
    customer_email: str = "",
    reference: str = "",
) -> dict:
    """
    Create a Louvin payment transaction.
    Returns the full Louvin API response.
    """
    settings = get_settings()

    if paket not in PACKAGES:
        raise ValueError(f"Invalid paket: {paket}. Must be one of {list(PACKAGES.keys())}")

    pkg = PACKAGES[paket]

    url = f"{settings.louvin_base_url}/create-transaction"

    headers = {
        "Content-Type": "application/json",
        "x-api-key": settings.louvin_api_key,
    }

    payload = {
        "amount": pkg["price"],
        "payment_type": payment_type,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "description": f"Oziktag Top-Up Paket {pkg['name']} ({pkg['credits']} kredit)",
    }

    if reference:
        payload["reference"] = reference

    # Add source_url for tracking
    payload["source_url"] = settings.app_url

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)

    data = response.json()

    if response.status_code not in (200, 201) or not data.get("success"):
        error_msg = data.get("error", "Unknown Louvin error")
        details = data.get("details", "")
        raise Exception(f"Louvin API error: {error_msg} {details}")

    return data


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
