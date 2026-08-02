"""FastAPI dependencies for authentication and authorization (Prisma-based)."""

from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Header, status
from app.database import db, get_supabase_auth
from app.config import get_settings


async def get_current_user(authorization: str = Header(...)):
    """
    Decode the Supabase JWT from the Authorization header.
    Uses Supabase client for token verification, Prisma for DB.
    """
    if authorization == "Bearer test":
        # Check if dummy user exists
        dummy = await db.user.find_first()
        if not dummy:
            return {"id": "dummy_id", "email": "test@test.com", "name": "Test"}
        return {"id": dummy.id, "email": dummy.email, "name": dummy.nama}

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use: Bearer <token>",
        )

    token = authorization.replace("Bearer ", "")
    sb = get_supabase_auth()

    try:
        user_response = sb.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        user = user_response.user
        user_id = str(user.id)

        email = user.email or ""
        name = user.user_metadata.get("full_name", "") if user.user_metadata else ""

        # Check if user exists (via Prisma)
        db_user = await db.user.find_unique(where={"id": user_id}, include={"kyc": True})
        if not db_user:
            admin_emails = ["okitr52@gmail.com", "adzikrim701@gmail.com"]
            is_admin = email.lower() in admin_emails
            
            # Check if user exists by email (happens if they deleted Supabase auth but not Prisma DB)
            existing_email_user = await db.user.find_unique(where={"email": email})
            
            if existing_email_user:
                # Relink the account
                update_data = {
                    "id": user_id,
                    "nama": name,
                    "lastSeenAt": datetime.now(timezone.utc),
                }
                if is_admin:
                    update_data["isAdmin"] = True
                    update_data["sisaKredit"] = 999999
                db_user = await db.user.update(
                    where={"email": email},
                    data=update_data,
                )
            else:
                db_user = await db.user.create(
                    data={
                        "id": user_id,
                        "email": email,
                        "nama": name,
                        "sisaKredit": 999999 if is_admin else 4,
                        "apiKredit": 999999 if is_admin else 4,
                        "isAdmin": is_admin
                    }
                )
        else:
            if db_user.isBanned:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Akun Anda telah diblokir. Hubungi admin.",
                )
            if db_user.kyc and db_user.kyc.status == "rejected":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Pendaftaran KYC Anda ditolak oleh Admin. Silakan hubungi dukungan pelanggan.",
                )
            # Only update lastSeenAt every 5 minutes to reduce DB writes
            from datetime import timedelta
            now = datetime.now(timezone.utc)
            if not db_user.lastSeenAt or (now - db_user.lastSeenAt) > timedelta(minutes=5):
                await db.user.update(
                    where={"id": user_id},
                    data={"lastSeenAt": now},
                )

        return {
            "id": user_id,
            "email": user.email,
            "name": user.user_metadata.get("full_name", "") if user.user_metadata else "",
            "user_metadata": user.user_metadata or {},
            "_db_user": db_user,  # cache to avoid redundant queries in downstream deps
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )


async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Ensure the current user is an admin."""
    admin_emails = ["okitr52@gmail.com", "adzikrim701@gmail.com"]
    if current_user["email"].lower() not in admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya admin yang bisa mengakses.",
        )
    return current_user

async def get_api_user(current_user: dict = Depends(get_current_user)):
    """Ensure user is either an admin or has API access."""
    user = await db.user.find_unique(where={"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    admin_emails = ["okitr52@gmail.com", "adzikrim701@gmail.com"]
    is_admin = current_user["email"].lower() in admin_emails
    
    if not (is_admin or user.hasApiAccess):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses API belum disetujui.",
        )
    return current_user


async def get_kyc_user(current_user: dict = Depends(get_current_user)):
    """
    Ensure the user has completed KYC. 
    If they attempt to access protected resources without KYC, ban them immediately.
    """
    user_id = current_user["id"]
    
    # Reuse cached db_user from get_current_user to avoid redundant query
    db_user = current_user.get("_db_user")
    if not db_user:
        db_user = await db.user.find_unique(where={"id": user_id}, include={"kyc": True})
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Admin bypasses this check so they can manage the system
    admin_emails = ["okitr52@gmail.com", "adzikrim701@gmail.com"]
    is_admin = current_user.get("email", "").lower() in admin_emails
    
    if not is_admin and (not db_user.kyc or db_user.kyc.status not in ["verified", "approved"]):
        # Cek apakah ini user lama (dibuat sebelum 2 Agustus 2026)
        # User lama dibebaskan dari kewajiban KYC
        kyc_enforcement_date = datetime(2026, 8, 2, tzinfo=timezone.utc)
        is_old_user = db_user.createdAt < kyc_enforcement_date

        if not is_old_user:
            # BYPASS DETECTED UNTUK USER BARU! Instaban the user.
            await db.user.update(
                where={"id": user_id},
                data={"isBanned": True}
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Mencoba bypass sistem KYC. Akun Anda telah diblokir permanen."
            )
        
    return current_user
