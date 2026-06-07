import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsOfService,
});

function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background relative">
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
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
            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl mb-4">Syarat & Ketentuan Layanan</h1>
            <p className="text-muted-foreground text-sm md:text-base">Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="space-y-6 text-foreground/80 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Definisi dan Interpretasi</h2>
              <p>
                Dokumen Syarat dan Ketentuan ("Perjanjian") ini mengikat secara hukum antara Anda ("Pengguna" atau "Merchant") dan platform Oziktag ("Perusahaan"). Dengan mengakses, mendaftar, atau menggunakan layanan pada platform Kami, Pengguna menyatakan telah membaca, memahami, serta menyetujui secara tanpa paksaan seluruh ketentuan yang tertuang dalam dokumen ini. 
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. Ruang Lingkup Layanan</h2>
              <p className="mb-2">Oziktag menyediakan layanan terpadu berbasis teknologi kecerdasan buatan (Artificial Intelligence) dan sistem pangkalan data (Database System) yang berfungsi untuk:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Melakukan validasi otomatis kualitas produk UMKM melalui analisis foto menggunakan model Gemini AI.</li>
                <li>Menerbitkan <em>Digital Trust Seal</em> dalam bentuk QR Code sebagai jaminan transparansi kepada konsumen akhir.</li>
                <li>Menyimpan rekam jejak (audit trail) histori Quality Control produk secara mutakhir.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Kewajiban Pengguna</h2>
              <p className="mb-2">Selama menggunakan Layanan, Pengguna diwajibkan untuk:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Integritas Data:</strong> Memberikan informasi profil, KYC, dan representasi foto produk yang otentik, akurat, dan tidak dimanipulasi.</li>
                <li><strong>Keamanan Akun:</strong> Menjaga kerahasiaan kredensial akses (Single Sign-On / kredensial login). Segala transaksi yang bersumber dari akun Pengguna adalah tanggung jawab mutlak Pengguna.</li>
                <li><strong>Anti Fraud:</strong> Tidak menggunakan sistem Kami untuk aktivitas pencucian uang (Money Laundering), pendanaan terorisme, penipuan (Scam/Fraud), maupun pelanggaran hak kekayaan intelektual pihak lain.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Hak Kekayaan Intelektual</h2>
              <p>
                Semua hak kekayaan intelektual atas platform Oziktag, termasuk namun tidak terbatas pada kode sumber, desain UI/UX, algoritma AI, basis data, dan merek dagang adalah hak milik tunggal Perusahaan. Pengguna dilarang merekayasa balik (reverse engineer), menyalin, mendistribusikan ulang, atau mengeksploitasi aset Kami tanpa persetujuan tertulis dari pihak legal Perusahaan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">5. Batasan Tanggung Jawab (Limitation of Liability)</h2>
              <p>
                Sistem analisis AI yang Kami miliki berfungsi sebagai instrumen mitigasi risiko sekunder (secondary risk mitigation tool). Perusahaan tidak memberikan garansi mutlak atas kualitas fisik barang yang dikirimkan kepada pihak ketiga/konsumen akhir. Perusahaan dibebaskan dari setiap gugatan, klaim kerugian, atau kerusakan (termasuk kerugian konsekuensial, tidak langsung, dan immaterial) yang timbul akibat penyalahgunaan QR Code oleh Pengguna, gangguan force majeure, maupun serangan siber di luar batas kendali wajar (reasonable control) Perusahaan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">6. Penghentian Layanan (Suspension and Termination)</h2>
              <p>
                Perusahaan memegang hak prerogatif untuk membekukan sementara (suspend) atau menutup (terminate) akun Pengguna secara sepihak dan tanpa pemberitahuan sebelumnya, apabila ditemukan indikasi kuat bahwa Pengguna melanggar Ketentuan Layanan ini, memanipulasi parameter AI, atau diduga melakukan tindak kejahatan finansial maupun perdata sesuai dengan temuan sistem deteksi fraud Kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">7. Hukum yang Berlaku dan Penyelesaian Sengketa</h2>
              <p>
                Perjanjian ini tunduk dan ditafsirkan sepenuhnya berdasarkan hukum positif Negara Kesatuan Republik Indonesia. Segala perselisihan yang timbul sehubungan dengan interpretasi Perjanjian ini akan diselesaikan secara musyawarah untuk mufakat dalam waktu 30 (tiga puluh) hari kalender. Jika tidak tercapai kesepakatan, sengketa akan diselesaikan melalui yurisdiksi Pengadilan Negeri domisili kantor terdaftar Perusahaan.
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
