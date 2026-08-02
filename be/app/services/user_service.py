import uuid
import time
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.database import db, get_supabase_auth
from app.config import get_settings
from app.models.schemas import UserProfile

async def process_google_login(access_token: str) -> dict:
    sb = get_supabase_auth()
    
    # Verify the token with Supabase
    user_response = sb.auth.get_user(access_token)
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


async def get_user_profile_data(user_id: str) -> UserProfile:
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

    # Update lastSeenAt silently to track active users (for retention checking)
    try:
        await db.user.update(
            where={"id": user_id},
            data={"lastSeenAt": datetime.now(timezone.utc)}
        )
    except Exception as e:
        print(f"[User Service] Failed to update lastSeenAt: {e}")

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
        is_elite=db_user.isElite,
        elite_expires_at=db_user.eliteExpiresAt.isoformat() if db_user.eliteExpiresAt else None,
        receivesPromoEmails=db_user.receivesPromoEmails,
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


async def process_kyc_submission(
    user_id: str, 
    nama_toko: str, 
    nik: str, 
    npwp: str, 
    foto_ktp: str, 
    foto_npwp: str,
    website: str | None = None,
    foto_produk_1: str | None = None,
    foto_produk_2: str | None = None,
    deskripsi_produk: str | None = None,
):
    # Check if user already has KYC
    existing_kyc = await db.kyc.find_unique(where={"userId": user_id})
    if existing_kyc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="KYC sudah pernah diisi. Hubungi admin untuk mengubah data.",
        )

    nik = nik.strip()
    npwp = npwp.strip() if npwp else None

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
                "namaToko": nama_toko.strip(),
                "nik": nik,
                "npwp": npwp,
                "fotoKtp": foto_ktp,
                "fotoNpwp": foto_npwp,
                "website": website,
                "fotoProduk1": foto_produk_1,
                "fotoProduk2": foto_produk_2,
                "deskripsiProduk": deskripsi_produk,
                "status": "verified",
            }
        )

        # Update user's brand name
        await tx.user.update(
            where={"id": user_id},
            data={"nama": nama_toko.strip()}
        )
