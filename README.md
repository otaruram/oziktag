<div align="center">
  <img src="https://raw.githubusercontent.com/otaruram/oziktag/main/fe/public/logo.png" alt="Oziktag Logo" width="120" />
  <h1>Oziktag</h1>
  <p><strong>Platform Digital Trust Seal & Quality Control untuk UMKM</strong></p>

  <!-- Badges -->
  <a href="https://github.com/otaruram/oziktag/actions"><img src="https://img.shields.io/github/actions/workflow/status/otaruram/oziktag/build.yml?branch=main&style=flat-square" alt="Build Status"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" alt="React"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.111.0-009688?style=flat-square&logo=fastapi" alt="FastAPI"></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma"></a>
  <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/AI-Gemini_Flash-orange?style=flat-square&logo=google" alt="Google Gemini"></a>
</div>

<br />

## 📖 Ringkasan

**Oziktag** adalah platform Quality Control (QC) tingkat perusahaan dan *Digital Trust Seal* (Stempel Kepercayaan Digital) yang dibangun khusus untuk Usaha Mikro, Kecil, dan Menengah (UMKM). Dengan memanfaatkan Kecerdasan Buatan (AI) dan arsitektur backend yang kokoh, Oziktag memungkinkan penjual untuk menghasilkan label QC berbasis kode QR yang dapat diverifikasi dan tidak dapat diubah. Ini memberikan transparansi absolut kepada konsumen akhir mengenai keaslian produk, kondisi, dan petunjuk perawatannya.

Dengan API Developer yang terintegrasi dan ekosistem dompet ganda (dual-wallet), Oziktag bukan sekadar aplikasi—ini adalah infrastruktur *Trust-as-a-Service* yang komprehensif.

---

## ✨ Fitur Enterprise

- 🧠 **Analisis Kualitas Berbasis AI**: Integrasi cerdas dengan **Google Gemini 1.5 Flash** untuk secara otomatis menghasilkan analisis produk profesional dan solusi perawatan yang disesuaikan berdasarkan data daftar periksa QC mentah.
- ⚡ **Sistem Caching Cerdas**: Lapisan *caching* SHA-256 yang sangat optimal (`AiCache`) yang memotong pemrosesan AI yang berlebihan, secara signifikan mengurangi konsumsi token LLM eksternal dan mempercepat waktu respons hingga 80%.
- 💰 **Arsitektur Kredit Dompet Ganda**: Pemisahan buku besar independen untuk Kredit Pembuatan QR berbasis UI dan Kredit API terprogram, memastikan kontrol penagihan terperinci yang ketat untuk metrik penggunaan platform yang berbeda.
- 🔌 **API Developer & Webhook**: Endpoint RESTful dengan autentikasi Bearer Token aman yang dirancang untuk integrasi POS dan ERP yang mulus.
- 🛒 **Payment Gateway Otomatis**: Integrasi end-to-end dengan **Louvin Payment Gateway** yang mendukung perutean dinamis QRIS/GoPay dengan pemenuhan Webhook secara instan.
- 📊 **Dashboard Telemetri Real-time**: Langganan *event* WebSocket langsung melalui Supabase untuk melacak pemindaian produk yang aktif, log konsumsi kredit, dan analitik platform yang komprehensif.
- 🔐 **Sistem Autentikasi Grandfathering & KYC**: Penerapan KYC ketat untuk pengguna baru demi menjaga kualitas platform, sementara pengguna lama (*grandfathered*) dapat login lebih mulus. Dilengkapi dengan SMTP HTTP Relay Fallback (via SumoPod API) untuk bypassing batasan port provider hosting.
- 🖨️ **HD Tracking & QC Labels (SHA-256)**: Pembuatan label produk berkualitas tinggi (1200x1500px) lengkap dengan hash SHA-256 unik yang langsung bisa diunduh dalam format PNG atau PDF siap cetak, baik untuk sistem QC AI maupun Tracking Lite.
- 📈 **Admin Dashboard Teroptimasi (FIFO)**: Sistem manajemen data admin yang telah dipaginasi (10 baris per halaman) agar lebih efisien dan ringan saat memuat ribuan data pengguna atau transaksi.

---

## 🏗️ Arsitektur Sistem & Alur Kerja

Oziktag menggunakan arsitektur monolitik modern yang terpisah untuk memastikan ketersediaan tinggi (high availability) dan pengalaman developer yang mulus.

```mermaid
graph TD
    %% Entities
    User((UMKM / Developer))
    Buyer((Konsumen Akhir))
    
    %% Frontend
    subgraph Frontend [Frontend (React + Vite)]
        UI[Web Dashboard]
        Scanner[Pemindai QR Publik]
    end

    %% Backend
    subgraph Backend [Backend (FastAPI)]
        Auth[Layanan Auth & KYC]
        QC[QC & Kontroler API]
        Payment[Topup & Router Webhook]
    end

    %% External Services
    subgraph External [Layanan Eksternal]
        Gemini[Google Gemini AI]
        Louvin[Louvin Payment Gateway]
        ImageKit[ImageKit CDN]
    end

    %% Database
    subgraph Database [Database (PostgreSQL + Prisma)]
        Prisma[(Prisma ORM)]
        Supabase[(Database Supabase)]
    end

    %% Workflows
    User -->|Membuat QC| UI
    User -->|Permintaan API| QC
    Buyer -->|Memindai QR| Scanner
    
    UI -->|REST API| Backend
    Scanner -->|Mengambil Data| QC
    
    QC -->|1. Unggah Media| ImageKit
    QC -->|2. Cek Hash| Prisma
    QC -.->|3. Jika Tidak Ada Cache| Gemini
    
    Payment <-->|Buat Transaksi & Webhook| Louvin
    
    Auth --> Prisma
    QC --> Prisma
    Payment --> Prisma
    
    Prisma --- Supabase
```

### Alur Permintaan: Pembuatan QC AI
1. **Penerimaan Permintaan**: Klien (Web UI atau Developer API) mengirimkan detail produk, catatan penjual, dan daftar periksa.
2. **Otorisasi Penagihan**: Sistem merutekan transaksi ke modul Dompet Ganda untuk memotong Kredit QR atau Kredit API berdasarkan konteks pemanggil.
3. **Validasi Cache**: Hash SHA-256 dihasilkan dari muatan payload dan direferensikan silang dengan `AiCache`.
4. **Pemanggilan LLM**: Jika tidak ada di cache (Cache miss), sistem secara aman memanggil Google Gemini untuk menyintesis wawasan/analisis.
5. **Penyimpanan & Pengembalian**: Analisis yang dihasilkan, bersama dengan gambar yang diunggah ke CDN, disimpan di PostgreSQL. UUID unik dihasilkan dan dikembalikan sebagai tautan kode QR.

---

## 💳 Model Harga (Pay-As-You-Go)

Oziktag menggunakan **Sistem Berbasis Kredit (Pay-As-You-Go)** alih-alih langganan bulanan yang kaku. Ini memastikan UMKM hanya membayar untuk apa yang mereka gunakan. 
**1 Kredit = 1x Generate QR QC atau 1x Tracking Lite.**

| Paket | Harga | Kredit | Biaya per QR | Target Pengguna |
|---------|-------|---------|-------------|-------------|
| **Starter** | Rp 15.000 | 50 | Rp 300 | UMKM Tahap Awal |
| **Growth** | Rp 35.000 | 150 | Rp 233 | Bisnis Berkembang *(Paling Laris)* |
| **Pro** | Rp 79.000 | 400 | Rp 198 | Produksi Volume Tinggi |

**Sumber Pendapatan Lainnya:**
- **Artisan Elite Membership**: Rp 499.000 / tahun (Akses ke Elite Hub, badge khusus, prioritas dukungan).
- **Escrow Fee**: (Harga Produk × 1.5%) + Rp 1.000 per transaksi yang menggunakan fitur perlindungan pembeli.

**Kebal terhadap Fluktuasi Dolar (Skala Ekonomi):**
Dengan menjual kredit dalam mata uang Rupiah (Rp 198 - Rp 300 per QR) sementara biaya variabel AI inti kami (Gemini 1.5 Flash / Claude) dipatok sangat murah, biaya produksi HPP per proses AI kira-kira hanya **Rp 15 - Rp 50**. Ini mencapai margin kotor **>80%**. Model harga ini tetap sangat menguntungkan tanpa pernah perlu menaikkan harga untuk UMKM.

---

## 🏗️ Infrastruktur, Biaya Operasional & BEP

Untuk menjalankan Oziktag di tingkat enterprise, tumpukan infrastruktur berikut dan biaya dasarnya diperlukan. Pendekatan ini memastikan ketersediaan tinggi, skalabilitas, dan keamanan:

1. **Backend (VPS / Docker)**: ~Rp 100.000 - 200.000/bulan.
2. **Frontend (Vercel / Cloudflare Pages)**: Gratis (Tier Hobby).
3. **Database & Auth (Supabase Pro)**: ~Rp 380.000/bulan (atau gratis di tahap awal).
4. **Media CDN (ImageKit)**: Gratis (Tier 20GB/bulan).
5. **AI API (Claude/Gemini)**: ~Rp 150.000 - 300.000/bulan (Sistem bayar per penggunaan).
6. **Domain & Email Server**: ~Rp 50.000 - 100.000/bulan.
7. **Payment Gateway (SumoPod)**: Menggunakan model pemotongan dari transaksi (MDR), tanpa biaya bulanan tetap.

**Total Estimasi Biaya Server/Infrastruktur**: **Rp 900.000 – Rp 1.000.000 per bulan.**

### Analisis Break-Even Point (BEP) Cepat
Hanya dengan biaya infrastruktur maksimal **Rp 1 Juta / bulan**, Oziktag hanya membutuhkan sekitar **26 - 29 pelanggan UMKM aktif** yang membeli paket *Growth* (Rp 35.000) setiap bulannya untuk mencapai titik impas (BEP). Setiap pertumbuhan pengguna di atas angka ini, beserta transaksi Escrow dan langganan Elite, akan langsung menjadi keuntungan bersih (*net profit*) bagi platform.

---

## 💎 Keunggulan Tidak Wajar (Mengapa sulit ditiru)

Meskipun konsep dasar membuat kode QR mudah ditiru, parit pelindung (moat) sejati Oziktag terletak pada **Tulang Punggung Data dan Penguncian Ekosistem (Ecosystem Lock-in)**:

1. **Penguncian Vendor melalui Kemasan Fisik:**
   Setelah UMKM mencetak ratusan atau ribuan kotak/stiker kemasan yang berisi kode QR Oziktag, mereka tidak dapat begitu saja beralih ke pesaing. Jika mereka berhenti menggunakan Oziktag atau pindah ke platform lain, kode QR cetak mereka yang ada akan mengarah ke tautan mati. Ini menciptakan basis pengguna yang sangat terikat dengan retensi jangka panjang.
2. **Data Rantai Pasokan & KYC Eksklusif:**
   Oziktag mengumpulkan sejumlah besar data lokal dunia nyata mengenai frekuensi produksi UMKM, kualitas produk (melalui analisis AI terhadap foto mentah), dan identitas KYC yang divalidasi. Kumpulan data ini memiliki nilai yang sangat besar untuk monetisasi B2B (misal, riset pasar FMCG) atau analitik pemerintah.
3. **Penilaian Kredit Alternatif (Integrasi Fintech):**
   Bank tradisional berjuang untuk memberikan pinjaman kepada UMKM karena kurangnya data produksi. Platform Oziktag bertindak sebagai buku besar alternatif: frekuensi pembuatan QC berkorelasi langsung dengan penjualan produk dan perputaran persediaan. Data ini dapat bermitra dengan platform P2P Lending untuk menawarkan pinjaman mikro berisiko rendah kepada UMKM.

### Validasi Penilaian Kredit Alternatif 4-Lapis
Untuk memastikan bahwa skor kesehatan keuangan yang dihasilkan untuk UMKM benar-benar kuat dan tangguh terhadap manipulasi (misal, memalsukan margin keuntungan), Oziktag menerapkan kerangka validasi 4-lapis milik kami sendiri:
1. **Filter Masuk Akal (Heuristik):** Penolakan otomatis terhadap margin keuangan yang tidak mungkin (misal >85%) untuk mencegah manipulasi skor dari data yang dilaporkan sendiri secara mentah.
2. **Validasi Pasar (Faktor Kepercayaan):** Memverifikasi silang pendapatan yang diklaim terhadap aktivitas pemindaian QR aktual oleh konsumen akhir. Skor keuangan akan dikurangi secara signifikan kecuali didukung oleh pengali Faktor Kepercayaan yang tinggi.
3. **Deteksi Penipuan AI:** Evaluasi berbasis konteks melalui Google Gemini 1.5 Flash untuk memastikan biaya produksi dan harga jual berkorelasi secara realistis dengan kategori produk.
4. **Distribusi Tertimbang:** Skor 850 poin akhir adalah gabungan kuat dari status verifikasi KYC, Aktivitas pemindaian (keterlibatan pasar), Profitabilitas (pasca-heuristik), dan Loyalitas platform.

---

## 📂 Struktur Proyek

Repositori ini diatur ke dalam domain batas (boundary domains) yang ketat:

```text
oziktag/
├── be/                       # Aplikasi Backend
│   ├── app/                  
│   │   ├── models/           # Skema Pydantic
│   │   ├── routers/          # Pengontrol Rute FastAPI
│   │   ├── services/         # Logika Bisnis (AI, ImageKit, Louvin)
│   │   └── database.py       # Koneksi Klien Prisma
│   ├── prisma/               # Skema Database & Migrasi
│   └── main.py               # Titik Masuk & Siklus Hidup Aplikasi
│
├── fe/                       # Aplikasi Frontend
│   ├── src/                  
│   │   ├── components/       # Komponen UI React yang dapat digunakan ulang
│   │   ├── routes/           # Halaman TanStack Router
│   │   └── lib/              # Klien API, Supabase, Store
│   └── vite.config.ts        # Konfigurasi Bundler
│
└── README.md                 # Dokumentasi Proyek
```

---

## 🚀 Memulai

### Prasyarat
- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.12+
- [PostgreSQL](https://www.postgresql.org/) (melalui Supabase atau instans lokal)

### 1. Pengaturan Database (Backend)
Navigasi ke direktori backend dan konfigurasikan lingkungan:
```bash
cd be
python -m venv venv
source venv/bin/activate  # Di Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Atur file `.env` Anda berdasarkan `.env.example`, lalu dorong skema:
```bash
npx prisma db push
python -m prisma generate
```

Mulai Server API:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
> Dokumentasi API akan tersedia di `https://api.oziktag.my.id/docs` (atau `http://localhost:8000/docs` di lokal)

### 2. Pengaturan UI (Frontend)
Buka terminal baru dan navigasi ke direktori frontend:
```bash
cd fe
npm install
```

Atur file `.env` Anda untuk frontend, lalu mulai server pengembangan:
```bash
npm run dev
```
> UI akan dapat diakses di `http://localhost:5173`

---

## 🔐 Keamanan & Operasi

- **Manajemen Kunci API**: Kunci developer diamankan dan di-*hash*. Akses dapat dicabut secara instan melalui dasbor.
- **Mitigasi Cold-Start**: Tugas *asyncio* latar belakang bawaan melakukan *ping* otomatis (self-ping) untuk mencegah hibernasi kontainer pada lingkungan hosting serverless/tier gratis (misal, Render).
- **Integritas Data**: Kendala Kunci Asing (*Foreign Key constraints*) yang ditegakkan, manajemen status tingkat transaksi, dan pembatalan (*rollback*) buku besar secara *real-time* untuk proses yang gagal.

---

## 📄 Lisensi

Proyek ini bersifat tertutup dan rahasia (*proprietary and confidential*). Penyalinan, distribusi, atau penggunaan kode sumber ini tanpa izin dilarang keras. 

<div align="center">
  <br />
  <p>Direkayasa dengan ❤️ untuk UMKM Indonesia.</p>
</div>
