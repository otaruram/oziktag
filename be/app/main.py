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


async def _retention_loop():
    """Daily check for inactive users to send warnings and deactivate QR codes."""
    from datetime import datetime, timezone, timedelta
    from app.services.email_service import send_email
    
    while True:
        try:
            now = datetime.now(timezone.utc)
            # Find users with 0 credits and lastSeenAt older than 75 days
            inactive_users = await db.user.find_many(
                where={"sisaKredit": 0}
            )
            
            for user in inactive_users:
                if not user.lastSeenAt:
                    continue
                
                days_inactive = (now - user.lastSeenAt).days
                
                # Only process if they opted into promo/news emails (retention emails fall under this)
                if hasattr(user, 'receivesPromoEmails') and not user.receivesPromoEmails:
                    continue
                
                if days_inactive == 75:
                    # Send H-15 Warning
                    subject = "Aksi Diperlukan: Masa Aktif QR Code Anda"
                    html = f"""
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #000000; border: 1px solid #eaeaea; border-radius: 8px;">
                        <h2 style="margin-top: 0;">Halo {user.nama or user.email.split('@')[0]},</h2>
                        <p>Kami perhatikan Anda sudah tidak aktif selama 75 hari dan saldo kredit Anda saat ini <strong>0</strong>.</p>
                        <p>Untuk menjaga seluruh QR Code Anda tetap aktif dan dapat di-scan oleh pelanggan, silakan lakukan <strong>Top-Up Kredit</strong> dalam waktu <strong>15 hari</strong> ke depan.</p>
                        <p>Jika tidak ada aktivitas atau Top-Up hingga hari ke-90, QR Code Anda akan <strong>dinonaktifkan sementara</strong>.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://oziktag.my.id/pricing" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Top-Up Sekarang</a>
                        </div>
                        <p style="font-size: 12px; color: #666666; margin-bottom: 0;">Tim Oziktag</p>
                    </div>
                    """
                    await send_email(user.email, subject, html)
                    print(f"[Retention] Sent H-15 warning to {user.email}")
                    
                elif days_inactive == 90:
                    # Send Deactivated Notice
                    subject = "QR Code Dinonaktifkan Sementara"
                    html = f"""
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #000000; border: 1px solid #eaeaea; border-radius: 8px;">
                        <h2 style="margin-top: 0;">Halo {user.nama or user.email.split('@')[0]},</h2>
                        <p>Karena akun Anda tidak aktif selama 90 hari dan saldo kredit Anda 0, seluruh QR Code produk Anda saat ini <strong>dinonaktifkan sementara</strong>.</p>
                        <p>Jangan khawatir! QR Code Anda tidak dihapus. Anda dapat mengaktifkannya kembali detik ini juga cukup dengan melakukan <strong>Login dan Top-Up Kredit</strong>.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://oziktag.my.id/pricing" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Aktifkan Kembali QR Code</a>
                        </div>
                        <p style="font-size: 12px; color: #666666; margin-bottom: 0;">Tim Oziktag</p>
                    </div>
                    """
                    await send_email(user.email, subject, html)
                    print(f"[Retention] Sent deactivated notice to {user.email}")
                    
        except Exception as e:
            print(f"[Retention] Loop error: {e}")
            
        # Sleep for 24 hours
        await asyncio.sleep(86400)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Connect database
    await connect_db()
    
    # Start background tasks
    ping_task = asyncio.create_task(_self_ping_loop())
    escrow_task = asyncio.create_task(_auto_release_loop())
    retention_task = asyncio.create_task(_retention_loop())
    print("[Oziktag] Backend started [OK]")
    print("[Oziktag] Self-ping loop active (every 12 min)")
    print("[Oziktag] Escrow auto-release loop active (every 1 hr)")
    print("[Oziktag] Retention & Churn loop active (daily)")
    yield
    # Shutdown
    await disconnect_db()
    ping_task.cancel()
    escrow_task.cancel()
    retention_task.cancel()
    try:
        await ping_task
        await escrow_task
        await retention_task
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
