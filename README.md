<div align="center">
  <img src="https://raw.githubusercontent.com/otaruram/oziktag/main/fe/public/logo.png" alt="Oziktag Logo" width="120" />
  <h1>Oziktag</h1>
  <p><strong>Digital Trust Seal & Quality Control Platform for UMKM</strong></p>

  <!-- Badges -->
  <a href="https://github.com/otaruram/oziktag/actions"><img src="https://img.shields.io/github/actions/workflow/status/otaruram/oziktag/build.yml?branch=main&style=flat-square" alt="Build Status"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" alt="React"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.111.0-009688?style=flat-square&logo=fastapi" alt="FastAPI"></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma"></a>
  <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/AI-Gemini_Flash-orange?style=flat-square&logo=google" alt="Google Gemini"></a>
</div>

<br />

## 📖 Overview

**Oziktag** is an enterprise-grade Quality Control (QC) and Digital Trust Seal platform built explicitly for Micro, Small, and Medium Enterprises (UMKMs). By leveraging Artificial Intelligence and a robust backend architecture, Oziktag allows sellers to generate verifiable, immutable QR-based QC labels that provide end-consumers with absolute transparency regarding product authenticity, condition, and care instructions.

With an integrated Developer API and a dual-wallet ecosystem, Oziktag is not just an application—it's a comprehensive Trust-as-a-Service infrastructure.

---

## ✨ Enterprise Features

- 🧠 **AI-Powered Quality Insights**: Intelligent integration with **Google Gemini 2.5 Flash** to automatically generate professional product insights and tailored care solutions based on raw QC checklist data.
- ⚡ **Intelligent Caching System**: A highly optimized SHA-256 caching layer (`AiCache`) that intercepts redundant AI processing, significantly reducing external LLM token consumption and accelerating response times by up to 80%.
- 💰 **Dual-Wallet Credit Architecture**: Independent ledger separation for UI-based QR Generation Credits and programmatic API Credits, ensuring strict granular billing control for different platform usage metrics.
- 🔌 **Developer API & Webhooks**: RESTful endpoints with secure Bearer Token authentication designed for seamless POS and ERP integration.
- 🛒 **Automated Payment Gateways**: End-to-end integration with **Louvin Payment Gateway** supporting dynamic QRIS/GoPay routing with instantaneous Webhook fulfillment.
- 📊 **Real-time Telemetry Dashboard**: Live WebSocket event subscriptions via Supabase to track active product scans, credit consumption logs, and comprehensive platform analytics.

---

## 🏗️ System Architecture & Workflow

Oziktag utilizes a modern, decoupled monolithic architecture ensuring high availability and seamless developer experience.

```mermaid
graph TD
    %% Entities
    User((UMKM / Developer))
    Buyer((End Consumer))
    
    %% Frontend
    subgraph Frontend [Frontend (React + Vite)]
        UI[Web Dashboard]
        Scanner[Public QR Scanner]
    end

    %% Backend
    subgraph Backend [Backend (FastAPI)]
        Auth[Auth & KYC Service]
        QC[QC & API Controller]
        Payment[Topup & Webhook Router]
    end

    %% External Services
    subgraph External [External Services]
        Gemini[Google Gemini AI]
        Louvin[Louvin Payment Gateway]
        ImageKit[ImageKit CDN]
    end

    %% Database
    subgraph Database [Database (PostgreSQL + Prisma)]
        Prisma[(Prisma ORM)]
        Supabase[(Supabase DB)]
    end

    %% Workflows
    User -->|Generates QC| UI
    User -->|API Requests| QC
    Buyer -->|Scans QR| Scanner
    
    UI -->|REST API| Backend
    Scanner -->|Fetch Data| QC
    
    QC -->|1. Upload Media| ImageKit
    QC -->|2. Check Hash| Prisma
    QC -.->|3. If Cache Miss| Gemini
    
    Payment <-->|Create Transaction & Webhook| Louvin
    
    Auth --> Prisma
    QC --> Prisma
    Payment --> Prisma
    
    Prisma --- Supabase
```

### Request Flow: AI QC Generation
1. **Request Intake**: Client (Web UI or Developer API) submits product details, seller notes, and checklists.
2. **Billing Authorization**: The system routes the transaction to the Dual-Wallet module to deduct either QR Credits or API Credits based on the caller context.
3. **Cache Validation**: An SHA-256 hash is generated from the payload and cross-referenced with `AiCache`.
4. **LLM Invocation**: On a cache miss, the system securely invokes Google Gemini to synthesize insights.
5. **Persistence & Return**: The generated insight, along with CDN-uploaded images, are stored in PostgreSQL. A unique UUID is generated and returned as a QR code link.

---

## 📂 Project Structure

The repository is organized into strict boundary domains:

```text
oziktag/
├── be/                       # Backend Application
│   ├── app/                  
│   │   ├── models/           # Pydantic Schemas
│   │   ├── routers/          # FastAPI Route Controllers
│   │   ├── services/         # Business Logic (AI, ImageKit, Louvin)
│   │   └── database.py       # Prisma Client Connection
│   ├── prisma/               # Database Schema & Migrations
│   └── main.py               # Application Entrypoint & Lifecycle
│
├── fe/                       # Frontend Application
│   ├── src/                  
│   │   ├── components/       # Reusable React UI Components
│   │   ├── routes/           # TanStack Router Pages
│   │   └── lib/              # API Clients, Supabase, Store
│   └── vite.config.ts        # Bundler Configuration
│
└── README.md                 # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.12+
- [PostgreSQL](https://www.postgresql.org/) (via Supabase or local instance)

### 1. Database Setup (Backend)
Navigate to the backend directory and configure the environment:
```bash
cd be
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Set up your `.env` file based on `.env.example`, then push the schema:
```bash
npx prisma db push
python -m prisma generate
```

Start the API Server:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
> The API documentation will be available at `http://localhost:8000/docs`

### 2. UI Setup (Frontend)
Open a new terminal and navigate to the frontend directory:
```bash
cd fe
npm install
```

Set up your `.env` file for the frontend, then start the development server:
```bash
npm run dev
```
> The UI will be accessible at `http://localhost:5173`

---

## 🔐 Security & Operations

- **API Keys Management**: Developer keys are secured and hashed. Access can be revoked instantly via the dashboard.
- **Cold-Start Mitigation**: Built-in background asyncio tasks perform automated self-pings to prevent container hibernation on serverless/free-tier hosting environments (e.g., Render).
- **Data Integrity**: Enforced Foreign Key constraints, transaction-level state management, and real-time ledger rollbacks for failed processes.

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this source code is strictly prohibited. 

<div align="center">
  <br />
  <p>Engineered with ❤️ for UMKM Indonesia.</p>
</div>
