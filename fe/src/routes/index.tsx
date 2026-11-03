import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  ArrowRight, 
  Bot, 
  Camera, 
  Database, 
  MapPin, 
  Lock, 
  Ticket,
  Sparkles,
  ExternalLink,
  Cpu,
  Layers,
  Check,
  Building2,
  Calendar,
  Users
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oziktag — Infrastruktur Kepercayaan Digital untuk Pengrajin & Event" },
      {
        name: "description",
        content:
          "Platform sertifikasi kualitas produk kerajinan tangan UMKM berbasis AI Vision dan sistem tiket event interaktif dengan garansi pembayaran Escrow.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"PRODUCT_QC" | "EVENT_PASS">("EVENT_PASS");
  const [demoStep, setDemoStep] = useState(1);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.navigate({ to: "/dashboard" });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.navigate({ to: "/dashboard" });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Hallmark Architectural Grid Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Floating Hallmark Header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-foreground">Oziktag</span>
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#solusi" className="hover:text-foreground transition">Solusi Produk</a>
            <a href="#event" className="hover:text-foreground transition">Tiket Summarecon</a>
            <a href="#arsitektur" className="hover:text-foreground transition">Arsitektur Escrow</a>
            <a href="#tim" className="hover:text-foreground transition">Tentang Kami</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/events"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-secondary transition"
            >
              <Ticket className="h-3.5 w-3.5 text-emerald-600" />
              <span>Tiket Event 2026</span>
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition shadow-xs"
            >
              Masuk / Daftar
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION: Hallmark Asymmetrical Material Hero */}
        <section className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24 pb-20">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Authentic Copy & Actions */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-50/60 dark:bg-orange-950/30 px-3 py-1 text-xs font-semibold text-orange-700 dark:text-orange-400 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                <span>Bandung Build Challenge 2026 Edition</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-mono text-[10px]">Summarecon Mall Bandung</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Infrastruktur Kepercayaan Digital untuk <span className="underline decoration-orange-500 decoration-wavy decoration-2 underline-offset-8">Pengrajin & Event</span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Oziktag menggabungkan AI Vision Quality Control dengan segel kriptografi QR dan sistem tiket event terintegrasi Escrow. Memastikan keaslian karya UMKM serta transparansi transaksi hingga ke pintu gate.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/events"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-orange-700 transition shadow-sm"
                >
                  <Ticket className="h-4 w-4" />
                  Beli Tiket & Pilih Kursi
                </Link>
                <Link
                  to="/auth"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition shadow-sm"
                >
                  Daftar Toko UMKM
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/docs"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
                >
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  Dokumentasi API
                </Link>
              </div>

              {/* Verified Trust Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border/80 pt-6 w-full max-w-lg">
                <div>
                  <p className="text-2xl font-extrabold text-foreground font-mono">100%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Anti Double-Booking</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground font-mono">24 Jam</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Escrow Protection</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-emerald-600 font-mono">&lt; 120ms</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Gate QR Validation</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hallmark Live Interactive Simulator */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-hallmark-lg)] relative">
                {/* Simulator Header Tabs */}
                <div className="flex items-center justify-between pb-3 border-b border-border/80">
                  <div className="flex gap-1 bg-secondary/80 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveTab("EVENT_PASS")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        activeTab === "EVENT_PASS"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Tiket Event Pass
                    </button>
                    <button
                      onClick={() => setActiveTab("PRODUCT_QC")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        activeTab === "PRODUCT_QC"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Label QC Produk
                    </button>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Simulator
                  </span>
                </div>

                {activeTab === "EVENT_PASS" ? (
                  /* Simulator View: Summarecon Event Pass */
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-border bg-slate-950 p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold">
                            Official Pass
                          </span>
                          <h4 className="text-sm font-bold mt-0.5">Bandung Build Challenge 2026</h4>
                          <p className="text-xs text-slate-400">Summarecon Mall Bandung (Sawarga Courtyard)</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white">
                          <Ticket className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-center font-mono">
                        <div className="bg-slate-900/80 p-2 rounded-lg">
                          <span className="text-[9px] text-slate-500 block uppercase">Kursi</span>
                          <span className="text-xs font-extrabold text-orange-400">VIP-A04</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg">
                          <span className="text-[9px] text-slate-500 block uppercase">Gate</span>
                          <span className="text-xs font-extrabold text-white">Gate 1</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg">
                          <span className="text-[9px] text-slate-500 block uppercase">Escrow</span>
                          <span className="text-xs font-extrabold text-emerald-400">HELD</span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Pass representation */}
                    <div className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-border bg-secondary/40">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white border p-1 shadow-xs">
                        <QrCode className="h-full w-full text-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">Cryptographic Pass Token</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
                          OZIK-PASS:7f4a9b2c...
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Otomatis mencairkan dana escrow ke dompet organizer saat discan di gate.
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/events"
                      className="block w-full text-center rounded-lg bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-700 transition"
                    >
                      Buka Denah Kursi Interaktif &rarr;
                    </Link>
                  </div>
                ) : (
                  /* Simulator View: Product QC Label */
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                            ✓ AI QC Score 98/100
                          </span>
                          <h4 className="text-sm font-bold mt-2">Tas Anyaman Rotan Motif Priangan</h4>
                          <p className="text-xs text-muted-foreground">Batch: B-2026-11-03 • Toko Batik & Anyam Rahayu</p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border">
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                          ✓ Kerapatan Anyaman Sempurna
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                          ✓ Finishing Serat Halus
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                          ✓ Bebas Cacat Permukaan
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-slate-900 text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                          <QrCode className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Label Digital Siap Ditempel</p>
                          <p className="text-[10px] text-slate-400 font-mono">1 QR = 1 Sertifikat Terproteksi</p>
                        </div>
                      </div>
                      <Link
                        to="/generator"
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-slate-100 transition"
                      >
                        Coba Buat
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID SHOWCASE (Hallmark Material Architecture) */}
        <section id="solusi" className="border-t border-border/80 bg-secondary/30 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest font-mono">
                Pilar Arsitektur
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Didesain Khusus untuk Standar Kepercayaan Tanpa Celah
              </h2>
              <p className="mt-4 text-muted-foreground text-sm sm:text-base">
                Menghubungkan rantai pasok pengrajin lokal, transparansi pembeli, dan kenyamanan pengunjung event dalam satu protokol terpadu.
              </p>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              {/* Card 1: AI Vision Quality Control */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 mb-5">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">AI Vision Quality Control</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Pengrajin mengunggah foto produk riil saat selesai produksi. Sistem multimodal AI secara otomatis memverifikasi kerapatan, simetri, dan cacat fisik sebelum QR dicetak.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/60">
                  <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Didukung Google Gemini Multimodal
                  </span>
                </div>
              </div>

              {/* Card 2: Interactive Seat Map & Event Pass */}
              <div id="event" className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-5">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Interactive Seat & Gate Pass</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Denah kursi 100-seat real-time untuk Summarecon Mall Bandung 2026. Fitur hold kursi 5 menit dengan kunci atomik mencegah perebutan tiket (anti double-booking).
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/60">
                  <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Gate Scanner & Instant Check-in
                  </span>
                </div>
              </div>

              {/* Card 3: Escrow Payment & Dompet Penghasilan */}
              <div id="arsitektur" className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-5">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Sistem Escrow Terproteksi</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Dana pembeli ditahan aman dalam pool Escrow Oziktag dan hanya dicairkan ke Dompet Penjual setelah barang dikonfirmasi sampai atau tiket discan di pintu gate.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/60">
                  <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Sesuai Regulasi Bank Indonesia
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-20 border-t border-border/80">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest font-mono">
                Alur Protokol
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                Tiga Langkah Mudah Menuju Transparansi
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground mb-5 border">
                  <span className="font-mono font-extrabold text-lg">01</span>
                </div>
                <h3 className="text-base font-bold text-foreground">Input Data & Validasi QC</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Pilih produk atau konfigurasikan acara Anda. Jalankan inspeksi kualitas dengan bantuan AI.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white mb-5">
                  <span className="font-mono font-extrabold text-lg text-orange-400">02</span>
                </div>
                <h3 className="text-base font-bold text-foreground">Cetak Label / E-Pass QR</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Sistem menghasilkan tanda pengenal digital yang tahan duplikasi dengan signature kriptografis.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground mb-5 border">
                  <span className="font-mono font-extrabold text-lg">03</span>
                </div>
                <h3 className="text-base font-bold text-foreground">Pencairan Dana Escrow</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Setelah pembeli scan atau panitia memverifikasi tiket di gate, dana masuk ke Dompet Penghasilan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOUNDERS & TEAM (Hallmark Architectural Cards) */}
        <section id="tim" className="border-t border-border/80 bg-secondary/30 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest font-mono">
                Tim Pengembang
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                Inovator di Balik Oziktag
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Dirancang dan dikembangkan untuk memenangkan Bandung Build Challenge 2026.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Oki */}
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-border shadow-xs">
                  <img src="/oki.png" alt="Oki Taruna Ramadhan" className="h-full w-full object-cover object-top" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Oki Taruna Ramadhan</h3>
                  <p className="text-xs font-mono text-orange-600 font-semibold uppercase">Founder & Lead Engineer</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Merancang arsitektur backend FastAPI, Supabase database, atomic seat locking, dan algoritma verifikasi kriptografis gate pass.
                  </p>
                  <a
                    href="https://www.linkedin.com/in/otaruram/"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-orange-600 transition"
                  >
                    Profil LinkedIn &rarr;
                  </a>
                </div>
              </div>

              {/* Azikri */}
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-border shadow-xs">
                  <img src="/zikri.jpeg" alt="Azdzikri Muhammad Hisyam Soleh" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Azdzikri Muhammad Hisyam Soleh</h3>
                  <p className="text-xs font-mono text-orange-600 font-semibold uppercase">Co-Founder & Product Strategist</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Merumuskan model bisnis Pay-As-You-Go, kemitraan Summarecon Mall Bandung, dan strategi kepatuhan regulasi OJK/Bank Indonesia.
                  </p>
                  <a
                    href="https://www.linkedin.com/in/azdzikri-muhammad-hisyam-soleh-086b43281/"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-orange-600 transition"
                  >
                    Profil LinkedIn &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="border-t border-border/80 bg-slate-950 text-white py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-mono font-bold text-orange-400 uppercase">
              Mulai Dalam 2 Menit
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight">
              Beri Pelanggan Anda Alasan Nyata untuk Percaya
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Bergabung sekarang bersama ratusan UMKM yang meningkatkan daya saing melalui verifikasi AI dan integrasi transaksi aman.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/auth"
                className="rounded-xl bg-orange-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-orange-700 transition shadow-sm"
              >
                Mulai Uji Coba Gratis
              </Link>
              <Link
                to="/events"
                className="rounded-xl border border-slate-700 bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Lihat Event & Kursi
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/80 bg-background py-8 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
            <span>Oziktag Protocol</span>
            <span className="text-muted-foreground font-normal font-mono text-[11px]">v2.4-hallmark</span>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <Link to="/docs" className="hover:text-foreground transition">Dokumentasi</Link>
            <Link to="/terms" className="hover:text-foreground transition">Ketentuan Layanan</Link>
            <Link to="/privacy" className="hover:text-foreground transition">Kebijakan Privasi</Link>
          </div>
          <p className="text-[11px] font-mono">© {new Date().getFullYear()} Oziktag. Bandung Build Challenge.</p>
        </div>
      </footer>
    </div>
  );
}
