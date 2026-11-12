# Materi Pendukung Lampiran 2 — BUDAYA GO! 2026 (Tim Oziktag)

Dokumen ini melengkapi **Lampiran 2: Bukti Produk dan Materi Presentasi** dari panduan resmi `budaya.docx`, siap dipakai untuk merekam **Video Showcase (3–5 menit)** dan menyusun **Slide Deck PPT Presentasi**.

---

## A. Checklist Bukti Produk (Inovasi Digital)

Siapkan folder Google Drive (akses *Viewer / Anyone with the link*) berisi:
1. **Tangkapan Layar Antarmuka (Screenshots)**:
   - Landing Page Oziktag (3 Pilar + 5 Sektor Budaya Nusantara)
   - Form Verifikasi KYC Penjual & Generator **QR Trust Seal** (AI Insight + Tips Perawatan Tradisional)
   - Halaman Publik `/scan/{id}` saat pembeli memindai QR Trust Seal
   - Generator **QR Shield** + Tampilan Peta GPS Leaflet `/tracking/{id}` + Modal Verifikasi PIN 8-karakter
   - Halaman Dompet Penghasilan, Penarikan Escrow 24 Jam, & Form Sengketa Video Unboxing
2. **Tautan Demo & Repositori**:
   - Web Demo: `https://oziktag.my.id`
   - Repositori Kode: `https://github.com/otaruram/oziktag`
3. **Video Deskripsi & Demonstrasi Produk (3–5 Menit)**: Gunakan naskah di bawah ini.

---

## B. Naskah Video Showcase Oziktag (Durasi Target: ± 4 Menit)

*Sesuai 6 poin wajib di Lampiran 2.B `budaya.docx`.*

### `[00:00 – 00:40]` 1. Pengenalan Produk & Akar Budaya
- **Visual**: Pembuka wajah tim / rekaman batik tulis, anyaman bambu, & gerabah Nusantara, lalu tampil logo & halaman depan Oziktag.
- **Narasi**:
  > "Halo Dewan Juri BUDAYA GO! 2026. Kami dari tim Oziktag—Oki Taruna Ramadhan, Azdzikri Muhammad Hisyam Soleh, dan Rika Amelia. Sektor kriya, wastra, dan kuliner Nusantara adalah penopang terbesar ekonomi kreatif Indonesia. Namun ketika perajin daerah menjual karyanya lewat media sosial atau WhatsApp, mereka menghadapi dua masalah besar: pembeli takut karya tersebut tiruan pabrik dan khawatir tertipu transfer langsung, sementara cara perawatan tradisional—seperti mencuci batik dengan lerak—sering hilang begitu produk berpindah tangan. Karena itulah kami membangun **Oziktag**: platform QR Trust Seal berbasis AI Vision, QR Shield, dan Escrow 24 Jam untuk ekonomi budaya Nusantara."

### `[00:40 – 02:10]` 2. Demonstrasi Produk Langsung (Live Screen Recording)
- **Visual A (QR Trust Seal)**: Login akun terverifikasi KYC -> Buka `/generator` -> Upload foto karya budaya (mis. kain batik/kerajinan), isi checklist QC & catatan pengrajin -> Generate -> Tunjukkan hasil `aiInsight` & `aiSolution` (tips perawatan tradisional) + kode QR -> Pindai via `/scan/{id}`.
  > "Pertama, **QR Trust Seal**. Perajin mengunggah foto produk selesai produksi dan checklist kualitas. AI Vision kami menganalisis kesesuaian foto dengan catatan perajin, lalu menerbitkan QR Trust Seal yang menyertakan tips perawatan autentik budaya tersebut. Pembeli cukup scan QR pakai kamera HP—tanpa instal aplikasi."
- **Visual B (QR Shield & Escrow 24 Jam)**: Buka `/tracking` -> Buat transaksi QR Shield dengan harga -> Tunjukkan link pembayaran QRIS (SumoPod), QR kardus pengiriman, peta GPS Leaflet di `/tracking/{id}`, PIN rahasia pembeli 8-karakter alfanumerik, hingga simulasi modal sengketa / pencairan saldo di `/wallet`.
  > "Kedua, **QR Shield & Escrow 24 Jam**. Saat dikirim ke luar kota, kemasan disegel QR Shield yang merekam koordinat GPS kurir dan mengunci transaksi dengan PIN rahasia pembeli 8-karakter. Pembayaran diproses lewat payment gateway mitra yang patuh regulasi OJK dan Bank Indonesia—Oziktag tidak menahan dana sendiri. Setelah PIN dimasukkan pembeli, dana masuk masa proteksi 1×24 jam. Jika sesuai, dana otomatis cair ke dompet perajin; jika rusak atau palsu, pembeli bisa ajukan sengketa dengan video unboxing."

### `[02:10 – 02:55]` 3. Kegunaan, Manfaat, Keunikan & Nilai Tambah
- **Visual**: Split screen perbandingan transaksi direct WA biasa vs pakai Oziktag + tabel harga paket Pay-As-You-Go (`/pricing`).
- **Narasi**:
  > "Berbeda dari marketplace besar yang memotong komisi tinggi dan mengurung toko di dalam satu aplikasi, Oziktag bisa ditempel di mana saja—WhatsApp, Instagram, TikTok, maupun pameran luring—dengan biaya mikro Pay-As-You-Go mulai Rp 198 hingga Rp 300 per QR dan biaya escrow transparan 1,5% + Rp 1.000."

### `[02:55 – 03:35]` 4. Bukti Kesiapan & Pengujian Aktual
- **Visual**: Tampilkan repositori GitHub, kode FastAPI `escrow_service.py` (auto-release 24h) & `ai_service.py`, serta build antarmuka web yang berjalan mulus.
- **Narasi**:
  > "Seluruh alur utama Oziktag—mulai dari frontend React 19 + TanStack Start, backend Python FastAPI + Prisma, database Supabase, hingga fallback AI Vision dan worker auto-release escrow—telah selesai dibangun dan diuji secara fungsional internal pada aplikasi web aktif kami."

### `[03:35 – 04:10]` 5. Potensi Pengembangan & Penutup (Cultural Power)
- **Visual**: Tampilkan timeline Roadmap 6–12 bulan, 1–2 tahun, 3–5 tahun & foto tim lengkap.
- **Narasi**:
  > "Dengan infrastruktur hemat di bawah Rp 1 juta/bulan, Oziktag mencapai titik impas hanya dengan sekitar 26 UMKM aktif per bulan. Setelah kompetisi, kami siap menggandeng 20–50 sanggar kriya dan wastra lokal untuk uji coba lapangan, hingga menghadirkan paspor digital keaslian karya budaya Indonesia ke pasar diaspora dan kolektor dunia. Oziktag—Melindungi Nilai Karya, Memberdayakan Ekonomi Budaya Nusantara."

---

## C. Kerangka Slide Deck PPT Presentasi (10 Slide — Siap Pindah ke Canva/PowerPoint)

*Sesuai 10 poin wajib pada Lampiran 2.C `budaya.docx`.*

1. **Slide 1 — Judul & Latar Belakang**:
   - Judul: *OZIKTAG: QR Trust Seal, QR Shield, & Escrow Ekonomi Budaya Nusantara*
   - Subjudul: Inovasi Digital | Digital Commerce dan Ekonomi Budaya — Tim: Oki, Azdzikri, Rika
   - Fakta latar belakang: Kuliner, Fesyen, dan Kriya menopang ~75% PDB Ekraf RI (> Rp 1.388–1.500 T), namun perajin masih bergantung pada transaksi digital berisiko.
2. **Slide 2 — Permasalahan Nyata**:
   - (1) Pemalsuan kriya/wastra (printing vs tulis/tenun); (2) Putusnya literasi perawatan tradisional (lerak, kelembapan kayu/anyaman); (3) Penipuan social commerce (> 400 ribu aduan penipuan transaksi online tercatat Komdigi 2017–2024; OJK dirikan IASC).
3. **Slide 3 — Penyelesaian Eksisting vs Rencana Jangka Pendek & Panjang**:
   - Kesenjangan marketplace (potongan mahal) vs transfer langsung (tanpa proteksi) vs QR biasa (tanpa verifikasi).
   - Jangka pendek: Pilot sanggar & stabilisasi alur UMKM; Jangka panjang: Paspor digital ekspor budaya Nusantara.
4. **Slide 4 — Unsur Kebudayaan Indonesia sebagai Dasar Inovasi**:
   - AI Vision tidak hanya cek kondisi barang, tetapi bertindak sebagai **kurator budaya** yang mengekstrak teknik kriya dan **solusi perawatan tradisional**.
   - 5 Sektor: Wastra & Fesyen, Kriya Nusantara, Kuliner & Rempah, Edukasi Budaya, Aroma & Perawatan Tradisional + wajib KYC untuk menjaga atribusi pengrajin asli.
5. **Slide 5 — Solusi, Fungsi, dan Cara Kerja Produk**:
   - Diagram 3 langkah: `1. AI Vision QR Trust Seal (/generator -> /scan)` -> `2. QR Shield GPS + PIN 8-karakter (/tracking)` -> `3. Escrow 24 Jam via Gateway Mitra (/wallet & auto-release)`.
6. **Slide 6 — Sasaran Pengguna & Pasar Produk**:
   - Sisi Supply: Perajin batik/tenun/kriya, sanggar seni, UMKM kuliner/herbal daerah.
   - Sisi Demand: Pembeli social commerce lintas kota, kolektor, instansi pembeli suvenir resmi, & diaspora.
7. **Slide 7 — Keunikan & Nilai Tambah Produk**:
   - Tabel komparasi: AI kurasi budaya + GPS + PIN + Escrow non-custodial (patuh OJK/BI) + bisa dipakai di kanal jualan mana pun tanpa biaya bulanan wajib.
8. **Slide 8 — Dampak yang Diharapkan (Budaya, Ekonomi, Sosial)**:
   - Budaya: Arsip perawatan & autentisitas karya; Ekonomi: Margin pengrajin terjaga; Sosial: Transaksi lintas pulau bebas rasa cemas. Disertai indikator terukur fase pilot (20–50 UMKM, 1.000+ QR, < 2% sengketa).
9. **Slide 9 — Kondisi Aktual & Implementasi Teknis**:
   - Status: **Purwarupa Fungsional / Web App Siap Demo** (`https://oziktag.my.id`).
   - Tech Stack: React 19 + TypeScript + TanStack Start + Tailwind CSS + Leaflet | Python FastAPI + Prisma + Supabase PostgreSQL | ImageKit + Claude Haiku / Gemini Flash (SHA-256 cache) + SumoPod API.
   - Transparan: Sudah berfungsi end-to-end di demo; integrasi produksi multi-kanal & kemitraan sanggar adalah langkah lanjutan.
10. **Slide 10 — Model Bisnis, Ekonomi Unit, & Roadmap**:
    - Pay-As-You-Go: Starter Rp 15 rb (Rp 300/QR), Growth Rp 35 rb (Rp 233/QR), Pro Rp 79 rb (Rp 198/QR) + Escrow 1,5% + Rp 1.000.
    - Biaya AI ~Rp 14/QR, biaya tetap < Rp 1 Juta/bulan -> **BEP ~26 UMKM aktif/bulan**.
    - Roadmap: 6–12 Bulan (Pilot & Validasi) -> 1–2 Tahun (Ekspansi Nasional & B2B API) -> 3–5 Tahun (Pasar Diaspora & Cultural Power Global).

