import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, QrCode, CheckCircle2, ArrowRight, Bot, Store, Camera, Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oziktag — Digital Trust Seal untuk UMKM" },
      {
        name: "description",
        content:
          "Validasi kualitas produk UMKM dengan QR Code tepercaya. Bangun kepercayaan pembeli dalam hitungan detik.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/register`,
        },
      });
      if (error) {
        toast.error(`Login gagal: ${error.message}`);
      }
    } catch (err: any) {
      toast.error(`Sistem error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background overflow-hidden relative">
      
      {/* Background Dot Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 border-b border-border/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <ShieldCheck className="h-6 w-6 text-foreground" />
          Oziktag
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/docs"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cara Kerja
          </Link>
          <button
            onClick={handleLogin}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Log In
          </button>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground uppercase">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Digital Trust Seal untuk UMKM
          </span>
          <h1 className="mt-8 text-balance text-5xl font-extrabold tracking-tight md:text-7xl leading-tight">
            Bangun kepercayaan pembeli, <br className="hidden md:block"/>
            <span className="text-muted-foreground">satu QR sekali tempel.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Oziktag membantu UMKM memvalidasi Quality Control produk lewat QR Code yang 
            dianalisis oleh AI. Simpel, cepat, dan 100% kredibel di mata pelanggan Anda.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleLogin}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-8 py-3.5 text-sm font-bold text-background transition-transform active:scale-95 hover:bg-foreground/90"
            >
              Mulai gratis sekarang <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-border bg-background px-8 py-3.5 text-sm font-bold transition-colors hover:bg-muted"
            >
              Lihat dokumentasi API
            </Link>
          </div>
          
          <div className="mt-16 pt-8 border-t border-border/50 flex flex-wrap justify-center gap-8 text-muted-foreground opacity-70 grayscale">
            <div className="flex items-center gap-2 font-semibold"><Store className="h-5 w-5"/> 1.000+ Toko</div>
            <div className="flex items-center gap-2 font-semibold"><QrCode className="h-5 w-5"/> 50k+ QR Terbuat</div>
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5"/> 99.9% Uptime</div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Cara Kerja yang Transparan</h2>
              <p className="mt-4 text-muted-foreground">Dari gudang Anda langsung ke tangan pembeli dengan jaminan AI.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-[2px] bg-border z-0"></div>
              
              <div className="relative z-10 bg-card border border-border p-8 rounded-2xl shadow-sm text-center">
                <div className="mx-auto w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mb-6">
                  <Camera className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">1. Upload Produk</h3>
                <p className="text-sm text-muted-foreground">Isi form QC ringkas dan upload foto riil produk sebelum dikemas.</p>
              </div>

              <div className="relative z-10 bg-card border border-border p-8 rounded-2xl shadow-sm text-center">
                <div className="mx-auto w-16 h-16 bg-foreground text-background border border-foreground rounded-full flex items-center justify-center mb-6">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">2. Analisis AI</h3>
                <p className="text-sm text-muted-foreground">Gemini AI memvalidasi foto dan memberikan insight jaminan kualitas secara objektif.</p>
              </div>

              <div className="relative z-10 bg-card border border-border p-8 rounded-2xl shadow-sm text-center">
                <div className="mx-auto w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mb-6">
                  <QrCode className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">3. Cetak & Tempel QR</h3>
                <p className="text-sm text-muted-foreground">Sistem mencetak QR Code unik. Pembeli scan untuk melihat sertifikat digital.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl leading-tight">
                Teknologi Enterprise<br/>untuk Skala UMKM
              </h2>
              <p className="mt-4 text-muted-foreground text-lg mb-8">
                Kami membangun sistem dengan arsitektur mutakhir untuk memastikan 
                data tidak bisa dimanipulasi oleh pihak manapun.
              </p>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 bg-muted p-2 rounded-md"><Database className="h-5 w-5" /></div>
                  <div>
                    <strong className="block text-foreground">Relational Storage</strong>
                    <span className="text-sm text-muted-foreground">Data disimpan secara presisi menggunakan PostgreSQL & Prisma.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 bg-muted p-2 rounded-md"><ShieldCheck className="h-5 w-5" /></div>
                  <div>
                    <strong className="block text-foreground">Verifikasi KYC Terpusat</strong>
                    <span className="text-sm text-muted-foreground">Setiap toko divalidasi keasliannya mencegah pemalsuan produk.</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="relative rounded-2xl border border-border bg-card p-2 overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-muted/50 to-background z-0"></div>
              <div className="relative z-10 bg-background border border-border rounded-xl p-6 h-full flex flex-col justify-center text-center py-16">
                <QrCode className="h-24 w-24 mx-auto text-foreground mb-6" />
                <div className="inline-flex mx-auto items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi Aman
                </div>
                <h4 className="mt-4 font-bold text-xl">Kopi Gayo Premium</h4>
                <p className="text-sm text-muted-foreground mt-2">Batch: B-2026-06</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-foreground text-background py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Siap Meningkatkan Penjualan?</h2>
            <p className="mt-6 text-background/80 text-lg">
              Bergabung dengan ribuan UMKM lain yang sudah membuktikan peningkatan 
              kepercayaan pelanggan mereka bersama Oziktag.
            </p>
            <div className="mt-10">
              <button
                onClick={handleLogin}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-background px-8 py-4 text-base font-bold text-foreground transition-transform active:scale-95 hover:bg-background/90"
              >
                Mulai Uji Coba Gratis
              </button>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <ShieldCheck className="h-5 w-5" />
            Oziktag
          </div>
          <p>© {new Date().getFullYear()} Oziktag. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
