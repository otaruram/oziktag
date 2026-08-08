# AGENTS Context & Rules

Folder ini (`.agents`) adalah tempat untuk menyimpan instruksi khusus (context/rules) bagi AI (Oziktag LLM / Assistant).
Jika Anda memiliki aturan desain, logika bisnis khusus, atau standar koding yang ingin selalu dipatuhi oleh AI, tambahkan di file ini atau buat file markdown baru di dalam folder ini.

## Aturan Umum Oziktag
1. **Keamanan (Security)**: Semua fitur pembayaran (Escrow) harus melalui Supabase dan sistem escrow yang ditahan selama 24 jam sebelum cair.
2. **Desain (UI/UX)**: Gunakan komponen Lucide React untuk icon, warna-warna dari Tailwind (misalnya bg-orange-600 untuk tombol utama), dan tampilan yang bersih (clean UI).
3. **Bisnis Model (Escrow)**: Oziktag tidak menyimpan dana sendiri, melainkan bekerja sama dengan payment gateway (bank/pihak ketiga) agar lolos regulasi OJK/Bank Indonesia.
4. **Pricing & Operasional**: Biaya infrastruktur (server, AI, DB) dijaga di bawah Rp 1 Juta/bulan. Dengan sistem Pay-As-You-Go (1 QR = 1 Kredit), titik impas (BEP) tercapai hanya dengan ~26 user UMKM per bulan.

Anda bisa menambahkan aturan baru di bawah ini.
