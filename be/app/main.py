"""
Oziktag Backend — FastAPI Application
Main entry point with CORS, routers, health check, and Render cold-start prevention.
"""

import asyncio
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, qc, scan, topup, admin, apikeys, developer, elite, tracking
from app.database import connect_db, disconnect_db
from app.services.escrow_service import auto_release_escrow_funds


# ──────────────────────── Self-Ping (Anti Cold-Start) ────────────────────────

async def _self_ping_loop():
    """Ping /health every 12 minutes to prevent Render free-tier cold starts."""
    settings = get_settings()
    url = f"{settings.app_url}/health"
    while True:
        await asyncio.sleep(720)  # 12 minutes
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                print(f"[Self-Ping] {url} → {resp.status_code}")
        except Exception as e:
            print(f"[Self-Ping] Failed: {e}")

async def _auto_release_loop():
    """Check and auto-release escrow funds every hour."""
    while True:
        try:
            released_count = await auto_release_escrow_funds()
            if released_count > 0:
                print(f"[Escrow] Auto-released funds for {released_count} products.")
        except Exception as e:
            print(f"[Escrow] Auto-release failed: {e}")
        # Sleep for 1 hour (3600 seconds)
        await asyncio.sleep(3600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Connect database
    await connect_db()
    
    # Start self-ping background task
    ping_task = asyncio.create_task(_self_ping_loop())
    escrow_task = asyncio.create_task(_auto_release_loop())
    print("[Oziktag] Backend started [OK]")
    print("[Oziktag] Self-ping loop active (every 12 min)")
    print("[Oziktag] Escrow auto-release loop active (every 1 hr)")
    yield
    # Shutdown
    await disconnect_db()
    ping_task.cancel()
    escrow_task.cancel()
    try:
        await ping_task
        await escrow_task
    except asyncio.CancelledError:
        pass
    print("[Oziktag] Backend shutdown [OK]")



# ──────────────────────── FastAPI App ────────────────────────

app = FastAPI(
    title="Oziktag API",
    description="Digital Trust Seal & QC Backend for UMKM",
    version="1.0.0",
    lifespan=lifespan,
)


# ──────────────────────── CORS ────────────────────────

# Load origins safely — allow startup even if .env is missing (for build/import checks)
try:
    _settings = get_settings()
    _frontend_url = _settings.frontend_url
except Exception:
    _frontend_url = "http://localhost:5173"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        _frontend_url,
        "https://oziktag.vercel.app",
        "https://oziktag.my.id",
        "https://www.oziktag.my.id",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────── Routers ────────────────────────

app.include_router(auth.router)
app.include_router(qc.router)
app.include_router(scan.router)
app.include_router(topup.router)
app.include_router(admin.router)
app.include_router(apikeys.router)
app.include_router(developer.router)
app.include_router(elite.router)
app.include_router(tracking.router)


# ──────────────────────── Health Check ────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for Render and uptime monitors."""
    return {"status": "ok", "service": "oziktag-backend"}


@app.get("/", tags=["System"])
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Oziktag API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
