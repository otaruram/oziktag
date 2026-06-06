"""
Database layer: Prisma for all DB operations, Supabase only for Auth.
"""

from prisma import Prisma
from supabase import create_client, Client
from app.config import get_settings

# ──────────────────────── Prisma Client ────────────────────────
db = Prisma()


async def connect_db():
    """Connect Prisma client. Call in FastAPI lifespan startup."""
    await db.connect()
    print("[Database] Prisma connected")


async def disconnect_db():
    """Disconnect Prisma client. Call in FastAPI lifespan shutdown."""
    await db.disconnect()
    print("[Database] Prisma disconnected")


# ──────────────────────── Supabase Auth Client ────────────────────────
_supabase: Client | None = None


def get_supabase_auth() -> Client:
    """Get Supabase client — used ONLY for auth.get_user() verification."""
    global _supabase
    if _supabase is None:
        settings = get_settings()
        _supabase = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase
