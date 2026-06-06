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
from app.routers import auth, qc, scan, topup, admin
from app.database import connect_db, disconnect_db


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Connect database
    await connect_db()
    
    # Start self-ping background task
    ping_task = asyncio.create_task(_self_ping_loop())
    print("[Oziktag] Backend started [OK]")
    print("[Oziktag] Self-ping loop active (every 12 min)")
    yield
    # Shutdown
    await disconnect_db()
    ping_task.cancel()
    try:
        await ping_task
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
