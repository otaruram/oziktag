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
  Cpu,
  Layers,
  Flame,
  Hammer,
  Scale,
  Award,
  CircleDot
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oziktag — Studio Sertifikasi Kualitas & Tiket Terakota" },
      {
        name: "description",
        content:
          "Platform sertifikasi kualitas produk pengrajin UMKM berbasis AI Vision dan sistem tiket event terintegrasi dengan garansi pembayaran Escrow.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"PRODUCT_QC" | "EVENT_PASS">("EVENT_PASS");

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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#cc4a1e] selection:text-white relative overflow-hidden">
      {/* 80% Werkstatt Architectural Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.08]"
        style={{
          backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "36px 36px"
        }}
      />

      {/* Floating Werkstatt Studio Header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1f1b18] text-white shadow-xs group-hover:bg-[#cc4a1e] transition-colors">
              <ShieldCheck className="h-4 w-4 text-orange-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-foreground font-mono">OZIKTAG</span>
              <span className="kiln-stamp px-1.5 py-0.5 rounded bg-[#cc4a1e]/10 text-[#cc4a1e] border border-[#cc4a1e]/20 text-[9px]">
                WERKSTATT // KILN
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <a href="#werkstatt-qc" className="hover:text-foreground transition">01 / Studio QC</a>
            <a href="#summarecon-event" className="hover:text-foreground transition">02 / Summarecon Pass</a>
            <a href="#escrow-arsitektur" className="hover:text-foreground transition">03 / Escrow Pool</a>
            <a href="#bengkel-tim" className="hover:text-foreground transition">04 / Bengkel Tim</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded bg-[#cc4a1e] px-4 py-2 text-xs font-bold text-white hover:bg-[#b83f15] transition shadow-xs tracking-tight"
            >
              Masuk Studio
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION: 80% Werkstatt Structural Composition + 20% Kiln Pottery Soul */}
        <section className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24 pb-20 border-b border-border/70">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Bold Bauhaus Workshop Headline */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Kiln Craft Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded border border-[#cc4a1e]/30 bg-[#cc4a1e]/10 px-3 py-1 text-xs font-mono font-bold text-[#cc4a1e] mb-6">
                <Flame className="h-3.5 w-3.5 animate-pulse" />
                <span>BANDUNG BUILD CHALLENGE 2026</span>
                <span className="text-muted-foreground">•</span>
                <span>SUMMARECON MALL BANDUNG</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08] font-sans">
                Presisi Bengkel Kerja, <br className="hidden sm:block"/>
                <span className="text-[#cc4a1e]">Kehangatan Sentuhan Pengrajin.</span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Oziktag menggabungkan arsitektur modular <strong>Werkstatt</strong> untuk verifikasi digital dengan jiwa seni kriya <strong>Kiln Pottery</strong>. Dari inspeksi serat rotan dan keramik studio hingga tiket gerbang Summarecon bergaransi Escrow 24 jam.
              </p>

              {/* Action Buttons: Clean Werkstatt Primary in Terracotta */}
              <div className="mt-8 flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/auth"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#cc4a1e] px-7 py-3.5 text-sm font-bold text-white hover:bg-[#b83f15] transition shadow-xs tracking-tight"
                >
                  Daftar Toko UMKM
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/docs"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3.5 text-sm font-mono font-semibold text-foreground hover:bg-secondary transition"
                >
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  Spesifikasi API
                </Link>
              </div>

              {/* Workshop Technical Metric Grid (Werkstatt Rules) */}
              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border/80 pt-6 w-full max-w-lg font-mono">
                <div>
                  <p className="text-2xl font-extrabold text-foreground">100%</p>
                  <p className="text-[11px] text-muted-foreground uppercase mt-0.5">Anti-Tamper Lock</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#cc4a1e]">24 Jam</p>
                  <p className="text-[11px] text-muted-foreground uppercase mt-0.5">Escrow Hold Pool</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground">&lt; 120ms</p>
                  <p className="text-[11px] text-muted-foreground uppercase mt-0.5">Gate Verification</p>
                </div>
              </div>
            </div>

            {/* Right Column: 20% Kiln Pottery School Craft Simulator Card */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-werkstatt-lg)] relative">
                {/* Kiln Bisque Studio Simulator Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/80">
                  <div className="flex gap-1 bg-secondary p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab("EVENT_PASS")}
                      className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
                        activeTab === "EVENT_PASS"
                          ? "bg-[#1f1b18] text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Summarecon Pass
                    </button>
                    <button
                      onClick={() => setActiveTab("PRODUCT_QC")}
                      className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
                        activeTab === "PRODUCT_QC"
                          ? "bg-[#1f1b18] text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Segel Studio QC
                    </button>
                  </div>
                  <span className="kiln-stamp px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                    ● LIVE VERIFIED
                  </span>
                </div>

                {activeTab === "EVENT_PASS" ? (
                  /* Summarecon Event Pass Simulation */
                  <div className="mt-4 space-y-4">
                    <div className="rounded-lg border border-border bg-[#1f1b18] p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-orange-400 font-bold block">
                            Summarecon Sawarga Courtyard
                          </span>
                          <h4 className="text-sm font-bold mt-0.5 font-sans">Bandung Build Challenge 2026</h4>
                          <p className="text-xs text-stone-400 font-mono">Seat Category: VIP Terakota</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#cc4a1e] text-white">
                          <Ticket className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-stone-800 pt-3 text-center font-mono">
                        <div className="bg-stone-900/90 p-2 rounded">
                          <span className="text-[9px] text-stone-500 block uppercase">No. Kursi</span>
                          <span className="text-xs font-bold text-orange-400">VIP-A04</span>
                        </div>
                        <div className="bg-stone-900/90 p-2 rounded">
                          <span className="text-[9px] text-stone-500 block uppercase">Gate</span>
                          <span className="text-xs font-bold text-white">Gate 1</span>
                        </div>
                        <div className="bg-stone-900/90 p-2 rounded">
                          <span className="text-[9px] text-stone-500 block uppercase">Escrow</span>
                          <span className="text-xs font-bold text-emerald-400">HELD</span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Pass Representation with Kiln Ceramic Texture */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-[#faf9f6] dark:bg-stone-900">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-white border p-1 shadow-xs">
                        <QrCode className="h-full w-full text-[#1f1b18]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground font-mono">HMAC-SHA256 Pass Token</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">
                          OZIK-KILN:7f4a9b2c8e1d...
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Pelepasan otomatis escrow ke saldo Dompet Penghasilan begitu pass discan panitia.
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/events"
                      className="block w-full text-center rounded bg-[#cc4a1e] py-2.5 text-xs font-bold text-white hover:bg-[#b83f15] transition font-mono tracking-tight"
                    >
                      Buka Denah Kursi Interaktif &rarr;
                    </Link>
                  </div>
                ) : (
                  /* Pottery / Craft Studio QC Inspection Representation */
                  <div className="mt-4 space-y-4">
                    <div className="rounded-lg border border-border bg-[#faf9f6] dark:bg-stone-900 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="kiln-stamp px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px]">
                            ✓ QC PASSED • SCORE 98/100
                          </span>
                          <h4 className="text-sm font-bold mt-2 font-sans">Gerabah & Keramik Studio Priangan</h4>
                          <p className="text-xs text-muted-foreground font-mono">Batch: KILN-2026-11 • Studio Keramik Rahayu</p>
                        </div>
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center border">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
                        <span className="rounded bg-secondary px-2 py-0.5 text-foreground">
                          ✓ Pembakaran 1220°C Stabil
                        </span>
                        <span className="rounded bg-secondary px-2 py-0.5 text-foreground">
                          ✓ Bebas Retak Glasir
                        </span>
                        <span className="rounded bg-secondary px-2 py-0.5 text-foreground">
                          ✓ Finishing Halus
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-[#1f1b18] text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded bg-[#cc4a1e]">
                          <QrCode className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold font-sans">Segel Terakota Digital</p>
                          <p className="text-[10px] text-stone-400 font-mono">1 QR = 1 Sertifikat Kualitas</p>
                        </div>
                      </div>
                      <Link
                        to="/generator"
                        className="rounded bg-white px-3 py-1.5 text-xs font-bold text-[#1f1b18] hover:bg-stone-100 transition font-mono"
                      >
                        Cetak Segel
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 80% WERKSTATT BENTO WORKSHOP UNITS */}
        <section id="werkstatt-qc" className="py-20 border-b border-border/70 bg-secondary/30">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold text-[#cc4a1e] uppercase tracking-widest font-mono">
                [ UNIT MODULAR WERKSTATT ]
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
                Empat Pilar Infrastruktur Kepercayaan
              </h2>
              <p className="mt-3 text-muted-foreground text-sm sm:text-base">
                Dirancang dengan ketelitian bengkel kerja modern: setiap data terikat kriptografi, transparan, dan dapat diverifikasi langsung oleh pembeli.
              </p>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              {/* Unit 01: AI Vision Craft Inspector */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-[#cc4a1e] font-bold">MODUL 01</span>
                    <Bot className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground font-sans">AI Vision Studio Inspector</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Pengrajin mengunggah foto produk riil saat selesai produksi. Sistem multimodal AI secara otomatis memverifikasi kerapatan anyaman, kehalusan glasir, dan simetri fisik.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/80 font-mono text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Didukung Gemini Vision Multimodal
                </div>
              </div>

              {/* Unit 02: Summarecon Sawarga Seat Grid */}
              <div id="summarecon-event" className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-[#cc4a1e] font-bold">MODUL 02</span>
                    <Ticket className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground font-sans">Summarecon Seat Grid</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Denah kursi 100-seat real-time untuk Summarecon Mall Bandung 2026. Fitur hold kursi 5 menit dengan kunci atomik mencegah perebutan tiket (anti double-booking).
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/80 font-mono text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Scanner Gate Real-Time &lt; 120ms
                </div>
              </div>

              {/* Unit 03: Escrow Treasury Pool */}
              <div id="escrow-arsitektur" className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-[#cc4a1e] font-bold">MODUL 03</span>
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground font-sans">Pool Escrow Terproteksi</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Dana pembeli ditahan aman dalam pool Escrow Oziktag dan hanya dicairkan ke Dompet Penjual setelah barang dikonfirmasi sampai atau tiket discan di pintu gate.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/80 font-mono text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Patuh Regulasi OJK & BI
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKSHOP PROTOCOL STEPS (Werkstatt Technical Line) */}
        <section className="py-20 border-b border-border/70">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-[#cc4a1e] uppercase tracking-widest font-mono">
                [ ALUR KERJA STUDIO ]
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground font-sans">
                Tiga Langkah Dari Meja Kerja ke Pembeli
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-secondary text-foreground mb-4 border font-mono font-extrabold text-base">
                  01
                </div>
                <h3 className="text-base font-bold text-foreground font-sans">Input Karya & Validasi QC</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Unggah detail produk anyaman, keramik, atau konfigurasi acara Summarecon Anda. Jalankan inspeksi kualitas dengan bantuan AI.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-[#1f1b18] text-orange-400 mb-4 font-mono font-extrabold text-base">
                  02
                </div>
                <h3 className="text-base font-bold text-foreground font-sans">Cetak Segel Terakota QR</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Sistem menghasilkan tanda pengenal digital yang tahan duplikasi dengan signature kriptografis HMAC-SHA256.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-secondary text-foreground mb-4 border font-mono font-extrabold text-base">
                  03
                </div>
                <h3 className="text-base font-bold text-foreground font-sans">Pencairan Dana Escrow</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Setelah pembeli scan atau panitia memverifikasi tiket di gate, dana masuk ke Dompet Penghasilan untuk dicairkan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BENGKEL TIM & FOUNDERS (Bauhaus Workshop Guild Format) */}
        <section id="bengkel-tim" className="py-20 bg-secondary/30 border-b border-border/70">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-[#cc4a1e] uppercase tracking-widest font-mono">
                [ BENGKEL KERJA OZIKTAG ]
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground font-sans">
                Tim Pengembang Protokol
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-mono">
                Didedikasikan untuk pemberdayaan UMKM Indonesia di Bandung Build Challenge 2026.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Oki */}
              <div className="rounded-xl border border-border bg-card p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 border-border shadow-xs">
                  <img src="/oki.png" alt="Oki Taruna Ramadhan" className="h-full w-full object-cover object-top" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground font-sans">Oki Taruna Ramadhan</h3>
                  <p className="text-xs font-mono text-[#cc4a1e] font-semibold uppercase">Founder & Systems Architect</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Merancang backend FastAPI, arsitektur Supabase PostgreSQL, kunci atomik anti double-booking, dan protokol kriptografi gate scanner.
                  </p>
                  <a
                    href="https://www.linkedin.com/in/otaruram/"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground hover:text-[#cc4a1e] transition"
                  >
                    LinkedIn Profile &rarr;
                  </a>
                </div>
              </div>

              {/* Azikri */}
              <div className="rounded-xl border border-border bg-card p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 border-border shadow-xs">
                  <img src="/zikri.jpeg" alt="Azdzikri Muhammad Hisyam Soleh" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground font-sans">Azdzikri Muhammad Hisyam Soleh</h3>
                  <p className="text-xs font-mono text-[#cc4a1e] font-semibold uppercase">Co-Founder & Business Strategist</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Merumuskan model bisnis Pay-As-You-Go berbiaya rendah, kemitraan Summarecon Mall Bandung, serta strategi kepatuhan regulasi OJK & BI.
                  </p>
                  <a
                    href="https://www.linkedin.com/in/azdzikri-muhammad-hisyam-soleh-086b43281/"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground hover:text-[#cc4a1e] transition"
                  >
                    LinkedIn Profile &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-20 bg-[#1f1b18] text-white">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <span className="kiln-stamp px-2.5 py-1 rounded bg-[#cc4a1e]/20 text-orange-400 border border-[#cc4a1e]/30 text-xs">
              MULAI SEKARANG
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight font-sans">
              Bangun Kepercayaan Pelanggan dengan Standar Studio
            </h2>
            <p className="mt-4 text-sm sm:text-base text-stone-400 max-w-2xl mx-auto leading-relaxed">
              Bergabung bersama ratusan pengrajin UMKM yang meningkatkan daya saing melalui verifikasi AI objektif dan transaksi bergaransi aman.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/auth"
                className="rounded-lg bg-[#cc4a1e] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#b83f15] transition shadow-xs tracking-tight"
              >
                Mulai Uji Coba Gratis
              </Link>
              <Link
                to="/docs"
                className="rounded-lg border border-stone-700 bg-stone-900 px-8 py-3.5 text-sm font-mono font-semibold text-white hover:bg-stone-800 transition"
              >
                Dokumentasi API
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-8 text-xs text-muted-foreground font-mono">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-[#cc4a1e]" />
            <span>OZIKTAG PROTOCOL</span>
            <span className="text-muted-foreground font-normal text-[11px]">// WERKSTATT-KILN-v3.0</span>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <Link to="/docs" className="hover:text-foreground transition">Dokumentasi</Link>
            <Link to="/terms" className="hover:text-foreground transition">Ketentuan</Link>
            <Link to="/privacy" className="hover:text-foreground transition">Privasi</Link>
          </div>
          <p className="text-[11px]">© {new Date().getFullYear()} Oziktag. Bandung Build Challenge 2026.</p>
        </div>
      </footer>
    </div>
  );
}
