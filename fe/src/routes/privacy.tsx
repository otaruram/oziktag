import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background relative">
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <ShieldCheck className="h-5 w-5" />
            Oziktag
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl mb-4">Kebijakan Privasi</h1>
            <p className="text-muted-foreground text-sm md:text-base">Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="space-y-6 text-foreground/80 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Pendahuluan</h2>
              <p>
                Oziktag ("Kami" atau "Perusahaan") berkomitmen tinggi untuk melindungi dan menghormati privasi data pribadi Pengguna. Kebijakan Privasi ini disusun sesuai dengan standar keamanan tata kelola data industri perbankan dan korporasi berskala nasional di Indonesia. Kebijakan ini menjelaskan bagaimana Kami mengumpulkan, menggunakan, memelihara, dan melindungi informasi Pengguna pada platform Oziktag.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. Pengumpulan Data Informasi</h2>
              <p className="mb-2">Kami mengumpulkan informasi yang secara langsung maupun tidak langsung mengidentifikasi Pengguna ("Data Pribadi"), termasuk namun tidak terbatas pada:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Data Identitas:</strong> Nama lengkap, Nomor Induk Kependudukan (NIK), NPWP, dan detail profil entitas bisnis/UMKM.</li>
                <li><strong>Data Kontak:</strong> Alamat email aktif, nomor telepon, dan alamat domisili usaha.</li>
                <li><strong>Data Transaksional & Operasional:</strong> Foto produk, hasil Quality Control, dan rekam jejak pembuatan QR Code.</li>
                <li><strong>Data Teknis:</strong> Alamat IP, jenis peramban, geolokasi, dan log akses server.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Penggunaan Data</h2>
              <p className="mb-2">Data Pribadi yang Kami kumpulkan digunakan dengan prinsip kehati-hatian (prudent principle) untuk tujuan:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Melakukan verifikasi identitas (Know Your Customer/KYC) guna mencegah tindak penipuan (fraud).</li>
                <li>Menyediakan layanan analisis AI (Artificial Intelligence) pada produk Pengguna.</li>
                <li>Pemrosesan pembuatan segel kepercayaan digital (Digital Trust Seal) berupa QR Code.</li>
                <li>Penyelesaian sengketa, pelaporan berkala, dan kepatuhan terhadap regulasi yang berlaku di wilayah Republik Indonesia.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Keamanan dan Retensi Data</h2>
              <p>
                Seluruh data Pengguna disimpan dalam infrastruktur basis data relasional (PostgreSQL) yang diamankan menggunakan enkripsi End-to-End dengan protokol kriptografi standar industri terkini (sejalan dengan standar ISO/IEC 27001). Kami menerapkan sistem pemantauan berlapis untuk mendeteksi anomali akses. Data Pribadi akan disimpan selama Pengguna masih aktif dan untuk periode retensi tertentu sebagaimana diwajibkan oleh ketentuan perundang-undangan (minimum 5 tahun).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">5. Pengungkapan kepada Pihak Ketiga</h2>
              <p>
                Kami menjunjung tinggi kerahasiaan data (Data Confidentiality). Kami tidak akan memperjualbelikan Data Pribadi Pengguna. Pengungkapan hanya dapat dilakukan kepada:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Otoritas pemerintah, badan peradilan, atau lembaga penegak hukum atas dasar perintah hukum (subpoena) yang sah.</li>
                <li>Mitra penyedia teknologi (seperti infrastruktur cloud dan penyedia AI) yang terikat oleh Perjanjian Kerahasiaan (Non-Disclosure Agreement) yang ketat.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">6. Hak Pengguna</h2>
              <p>
                Sejalan dengan Undang-Undang Pelindungan Data Pribadi (UU PDP), Pengguna berhak atas: akses, perbaikan, pemutakhiran, dan/atau penghapusan Data Pribadi. Pengguna juga berhak menarik persetujuan pemrosesan data dengan menyadari bahwa hal tersebut dapat berdampak pada penonaktifan sebagian atau seluruh layanan Oziktag.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">7. Hubungi Kami</h2>
              <p>
                Untuk setiap pertanyaan, pengaduan, maupun permohonan eksekusi hak subjek data, silakan menghubungi Data Protection Officer Kami melalui: <strong>legal@oziktag.id</strong> atau ke alamat kantor terdaftar Kami.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border bg-background py-10 mt-10">
        <div className="mx-auto max-w-4xl px-6 text-sm text-muted-foreground text-center">
          <p>© {new Date().getFullYear()} Oziktag. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
