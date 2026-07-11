"""Authentication and KYC router."""

import uuid
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
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


@router.post("/kyc", response_model=KYCResponse)
async def submit_kyc(request: KYCRequest, current_user: dict = Depends(get_current_user)):
    """
    Submit KYC data. If NIK/NPWP already exists, auto-append random suffix
    to keep it unique (dummy mode).
    """
    user_id = current_user["id"]
    await process_kyc_submission(
        user_id,
        request.nama_toko,
        request.nik,
        request.npwp,
        request.foto_ktp,
        request.foto_npwp
    )

    return KYCResponse(
        message="Form telah terverifikasi. (Catatan: Ini masih dummy, di proses asli nanti akan dicek secara realtime oleh admin).",
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
