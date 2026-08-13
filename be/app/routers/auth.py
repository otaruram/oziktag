"""Authentication and KYC router."""

import uuid
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from app.database import db, get_supabase_auth
from app.dependencies import get_current_user
from app.config import get_settings
from app.models.schemas import (
    GoogleAuthRequest,
    KYCRequest,
    KYCResponse,
    UserProfile,
)
from app.services.user_service import process_google_login, get_user_profile_data, process_kyc_submission

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/google")
async def google_auth(request: GoogleAuthRequest):
    """
    Authenticate with Google via Supabase.
    Frontend sends the access_token from Supabase Auth (Google Provider).
    Backend verifies it and ensures user exists in our users table.
    """
    return await process_google_login(request.access_token)


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile with KYC status."""
    user_id = current_user["id"]
    return await get_user_profile_data(user_id)


@router.post("/request-credit-score-access")
async def request_credit_score_access(current_user: dict = Depends(get_current_user)):
    """Request admin access to view credit score."""
    user_id = current_user["id"]
    await db.user.update(
        where={"id": user_id},
        data={"creditScoreRequested": True}
    )
    return {"message": "Permintaan akses terkirim"}


from pydantic import BaseModel

class EmailPreferenceUpdate(BaseModel):
    receives_promo_emails: bool

from app.services.email_service import build_newsletter_welcome_email, send_email

@router.post("/email-preferences")
async def update_email_preferences(
    request: EmailPreferenceUpdate, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Update user email preferences."""
    user_id = current_user["id"]
    await db.user.update(
        where={"id": user_id},
        data={"receivesPromoEmails": request.receives_promo_emails}
    )
    
    # If they turn on promo emails, send them a welcome newsletter email
    if request.receives_promo_emails:
        user_name = current_user.get("user_metadata", {}).get("name") or current_user.get("email", "").split("@")[0] or "Pengguna"
        subject, html_body = build_newsletter_welcome_email(user_name)
        # Send in background (fire and forget) to avoid blocking the response
        background_tasks.add_task(send_email, current_user["email"], subject, html_body)
        
    return {"message": "Preferensi email diperbarui", "receivesPromoEmails": request.receives_promo_emails}


@router.post("/kyc", response_model=KYCResponse)
async def submit_kyc(request: KYCRequest, current_user: dict = Depends(get_current_user)):
    """
    Submit KYC data.
    """
    user_id = current_user["id"]
    await process_kyc_submission(
        user_id,
        request.nama_toko,
        request.nik,
        request.npwp,
        request.foto_ktp,
        request.foto_npwp,
        request.website,
        request.foto_produk_1,
        request.foto_produk_2,
        request.deskripsi_produk
    )

    return KYCResponse(
        message="Data KYC Anda berhasil dikirim dan sedang diverifikasi oleh sistem.",
        status="verified",
    )

from typing import Optional

@router.get("/credit-logs")
async def get_credit_logs(tipe_kredit: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get credit usage and topup logs."""
    where_clause = {"userId": current_user["id"]}
    if tipe_kredit:
        where_clause["tipeKredit"] = tipe_kredit

    logs = await db.creditlog.find_many(
        where=where_clause,
        order={"createdAt": "desc"},
        take=50
    )
    
    return [
        {
            "id": log.id,
            "tipe_kredit": log.tipeKredit,
            "action": log.action,
            "amount": log.amount,
            "description": log.description,
            "created_at": log.createdAt.isoformat()
        } for log in logs
    ]
