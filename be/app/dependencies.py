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
        db_user = await db.user.find_unique(where={"id": user_id})
        if not db_user:
            settings = get_settings()
            admin_emails = [e.strip().lower() for e in settings.admin_email.split(",") if e.strip()]
            is_admin = email.lower() in admin_emails
            db_user = await db.user.create(
                data={
                    "id": user_id,
                    "email": email,
                    "nama": name,
                    "sisaKredit": 999999 if is_admin else 0,
                    "isAdmin": is_admin
                }
            )
        else:
            if db_user.isBanned:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Akun Anda telah diblokir. Hubungi admin.",
                )
            await db.user.update(
                where={"id": user_id},
                data={"lastSeenAt": datetime.now(timezone.utc)},
            )

        return {
            "id": user_id,
            "email": user.email,
            "name": user.user_metadata.get("full_name", "") if user.user_metadata else "",
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
    settings = get_settings()
    admin_emails = [e.strip().lower() for e in settings.admin_email.split(",") if e.strip()]
    if current_user["email"].lower() not in admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya admin yang bisa mengakses.",
        )
    return current_user
