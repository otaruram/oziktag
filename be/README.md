# Oziktag Backend

**Digital Trust Seal & QC Backend for UMKM** — FastAPI + Supabase + ImageKit + Louvin + Gemini AI

## Quick Start

### 1. Setup Environment

```bash
cd be
cp .env.example .env
# Edit .env with your actual API keys
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Setup Supabase Database

1. Go to [Supabase Dashboard](https://supabase.com) → SQL Editor
2. Copy-paste the contents of `sql/schema.sql`
3. Run the SQL to create all tables

### 4. Run Locally

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

---

## Deploy to Render

### Option 1: Docker (Recommended)

1. Push this `be/` folder to a Git repo
2. Create a new **Web Service** on Render
3. Select **Docker** as environment
4. Set root directory to `be/`
5. Add all environment variables from `.env.example`
6. Deploy!

### Option 2: Python Native

1. Create a new **Web Service** on Render
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set root directory to `be/`
5. Add all environment variables

---

## Cold-Start Prevention

The backend automatically pings `/health` every 12 minutes to prevent Render free-tier cold starts.

**Additional option:** Setup [UptimeRobot](https://uptimerobot.com) (free) to ping your `/health` endpoint every 5 minutes.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/google` | No | Google OAuth login |
| GET | `/api/auth/me` | Yes | Get user profile |
| POST | `/api/auth/kyc` | Yes | Submit KYC data |
| POST | `/api/qc/submit` | Yes | Submit QC + images |
| GET | `/api/qc/products` | Yes | List user's products |
| GET | `/api/scan/{id}` | No | Public QR scan |
| POST | `/api/topup/create` | Yes | Create payment |
| POST | `/api/topup/webhook` | No | Louvin webhook |
| GET | `/api/topup/history` | Yes | Payment history |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/users/online` | Admin | Online users |
| POST | `/api/admin/credits/add` | Admin | Add credits |
| POST | `/api/admin/users/ban` | Admin | Ban/unban user |
| GET | `/api/admin/stats` | Admin | Platform stats |
| GET | `/health` | No | Health check |

---

## Admin Access

The admin email is set in `.env` (`ADMIN_EMAIL`). This user automatically gets:
- Unlimited credits (999999)
- `is_admin = true` flag
- Access to all `/api/admin/*` endpoints
