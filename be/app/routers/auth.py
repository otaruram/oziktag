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

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/google")
async def google_auth(request: GoogleAuthRequest):
    """
    Authenticate with Google via Supabase.
    Frontend sends the access_token from Supabase Auth (Google Provider).
    Backend verifies it and ensures user exists in our users table.
    """
    sb = get_supabase_auth()
    settings = get_settings()

    try:
        # Verify the token with Supabase
        user_response = sb.auth.get_user(request.access_token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token",
            )

        user = user_response.user
        user_id = str(user.id)
        email = user.email or ""
        name = ""
        if user.user_metadata:
            name = user.user_metadata.get("full_name", user.user_metadata.get("name", ""))

        # Check if user already exists in our users table (Prisma)
        db_user = await db.user.find_unique(where={"id": user_id})

        # Support multiple comma-separated admin emails
        admin_emails = ["okitr52@gmail.com", "adzikrim701@gmail.com"]
        is_admin = email.lower() in admin_emails

        if not db_user:
            # Check if user exists by email (happens if they deleted Supabase auth but not Prisma DB)
            existing_email_user = await db.user.find_unique(where={"email": email})
            
            if existing_email_user:
                # Relink the account by updating the Prisma ID to the new Supabase ID
                update_data = {
                    "id": user_id,
                    "nama": name,
                    "lastSeenAt": datetime.now(timezone.utc),
                }
                if is_admin:
                    update_data["isAdmin"] = True
                    update_data["sisaKredit"] = 999999
                    
                await db.user.update(
                    where={"email": email},
                    data=update_data,
                )
            else:
                # Create new user record
                await db.user.create(
                    data={
                        "id": user_id,
                        "nama": name,
                        "email": email,
                        "sisaKredit": 999999 if is_admin else 5,
                        "isAdmin": is_admin,
                    }
                )
        else:
            # Update lastSeenAt and ensure admin status if email matches
            update_data = {
                "nama": name,
                "lastSeenAt": datetime.now(timezone.utc),
            }
            if is_admin:
                update_data["isAdmin"] = True
                update_data["sisaKredit"] = 999999
            await db.user.update(
                where={"id": user_id},
                data=update_data,
            )

        # Check KYC status
        kyc = await db.kyc.find_unique(where={"userId": user_id})

        return {
            "message": "Login berhasil",
            "user_id": user_id,
            "email": email,
            "nama": name,
            "is_admin": is_admin,
            "kyc_completed": kyc is not None,
            "kyc_status": kyc.status if kyc else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}",
        )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile with KYC status."""
    user_id = current_user["id"]

    # Get user and KYC data in one query using include
    db_user = await db.user.find_unique(
        where={"id": user_id},
        include={"kyc": True}
    )
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    total_qr = await db.qcproduct.count(where={"userId": user_id})
    
    score = 300
    if db_user.kyc and db_user.kyc.status in ["verified", "approved"]:
        score += 150
    score += (total_qr * 5)
    score += min(db_user.sisaKredit * 2, 100)
    score = min(score, 850)

    return UserProfile(
        id=db_user.id,
        nama=db_user.nama,
        email=db_user.email,
        sisa_kredit=db_user.sisaKredit,
        api_kredit=db_user.apiKredit,
        is_admin=db_user.isAdmin,
        has_api_access=db_user.hasApiAccess,
        is_banned=db_user.isBanned,
        kyc_status=db_user.kyc.status if db_user.kyc else None,
        nama_toko=db_user.kyc.namaToko if db_user.kyc else None,
        credit_score=score,
        credit_score_requested=db_user.creditScoreRequested,
        can_view_credit_score=db_user.canViewCreditScore,
    )


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

    # Check if user already has KYC
    existing_kyc = await db.kyc.find_unique(where={"userId": user_id})
    if existing_kyc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="KYC sudah pernah diisi. Hubungi admin untuk mengubah data.",
        )

    nik = request.nik.strip()
    npwp = request.npwp.strip() if request.npwp else None

    # Ensure NIK uniqueness — append random suffix if duplicate
    nik = await _ensure_unique_field("nik", nik)

    # Ensure NPWP uniqueness if provided
    if npwp:
        npwp = await _ensure_unique_field("npwp", npwp)

    async with db.tx() as tx:
        # Insert KYC record
        await tx.kyc.create(
            data={
                "userId": user_id,
                "namaToko": request.nama_toko.strip(),
                "nik": nik,
                "npwp": npwp,
                "fotoKtp": request.foto_ktp,
                "fotoNpwp": request.foto_npwp,
                "status": "verified",
            }
        )

        # Update user's brand name
        await tx.user.update(
            where={"id": user_id},
            data={"nama": request.nama_toko.strip()}
        )

    return KYCResponse(
        message="Form telah terverifikasi. (Catatan: Ini masih dummy, di proses asli nanti akan dicek secara realtime oleh admin).",
        status="verified",
    )


async def _ensure_unique_field(field: str, value: str) -> str:
    """
    Check if a value already exists in a table field.
    If it does, append a random suffix to make it unique.
    """
    kwargs = {field: value}
    existing = await db.kyc.find_unique(where=kwargs)
    if existing:
        # Append random suffix
        suffix = f"_{uuid.uuid4().hex[:6]}_{int(time.time()) % 10000}"
        value = f"{value}{suffix}"
    return value

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
