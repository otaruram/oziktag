import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Shield,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Bot,
  Lock,
  Cpu,
  MapPin,
  KeyRound,
  Plus,
  Minus,
  Flame,
  Sparkles,
  Wallet,
  Scale,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oziktag — QR Trust Seal, QR Shield & Escrow Karya Budaya Nusantara" },
      {
        name: "description",
        content:
          "Solusi digital untuk industri & ekonomi budaya Indonesia: AI QR Trust Seal, QR Shield anti-tukar pengiriman GPS+PIN, dan pembayaran Escrow 24 jam.",
      },
    ],
  }),
  component: LandingPage,
});

const FAQS = [
  {
    q: "Bagaimana QR Trust Seal melindungi karya kriya dan wastra dari pemalsuan?",
    a: "Setiap produk budaya yang difoto saat selesai produksi dianalisis oleh AI Vision (Gemini/Claude Multimodal) beserta checklist kualitas studio. Sistem menghasilkan QR Trust Seal unik yang terikat pada hash gambar riil dan riwayat toko terverifikasi KYC, sehingga pembeli cukup memindai QR untuk mengecek keaslian bahan, detail teknik pengerjaan, dan tips perawatan tradisionalnya.",
  },
  {
    q: "Apa fungsi QR Shield saat pengiriman produk berlangsung?",
    a: "QR Shield adalah segel keamanan logistik berlapis: label QR kardus merekam lokasi GPS kurir saat penjemputan/transit dan mengunci transaksi dengan PIN rahasia 6-digit milik pembeli. Dana hanya dapat diproses cair setelah pembeli memasukkan PIN penerima, atau pembeli dapat mengajukan sengketa dengan bukti video unboxing sebelum 24 jam berakhir.",
  },
  {
    q: "Apakah Oziktag menyimpan dana transaksi sendiri (Regulasi OJK & Bank Indonesia)?",
    a: "Tidak. Oziktag tidak menampung dana masyarakat secara langsung. Seluruh arus dana Escrow diproses melalui mitra payment gateway/perbankan pihak ketiga yang berizin agar sepenuhnya patuh terhadap regulasi OJK dan Bank Indonesia.",
  },
  {
    q: "Bagaimana mekanisme penahanan Escrow 24 jam bekerja?",
    a: "Setelah barang diterima dan dikonfirmasi menggunakan PIN Pembeli, status berubah menjadi DELIVERED dan memasuki masa tunggu perlindungan selama 1×24 jam. Jika tidak ada pengajuan sengketa dari pembeli dalam jendela 24 jam tersebut, sistem otomatis meneruskan dana bersih ke Dompet Penghasilan pengrajin/penjual.",
  },
  {
    q: "Berapa biaya penggunaan Oziktag untuk pelaku budaya & UMKM?",
    a: "Oziktag menerapkan skema hemat Pay-As-You-Go (1 QR = 1 Kredit) tanpa biaya langganan bulanan yang memberatkan pengrajin kecil, dengan biaya pemrosesan Escrow transparan sebesar 1,5% + Rp 1.000 per transaksi terproteksi.",
  },
];

const CULTURAL_SECTORS = [
  {
    code: "01",
    title: "Wastra & Fesyen Nusantara",
    desc: "Membedakan batik tulis/cap asli, tenun ikat, dan songket dari cetakan massal lewat dokumentasi proses & tips perawatan lerak.",
  },
  {
    code: "02",
    title: "Kriya Nusantara",
    desc: "Validasi kerapatan anyaman rotan/bambu, ketahanan glasir keramik terakota, dan kehalusan ukiran kayu sebelum dikirim ke kolektor.",
  },
  {
    code: "03",
    title: "Kuliner & Rempah Nusantara",
    desc: "Menjamin keutuhan segel kemasan kopi spesialti daerah, bumbu warisan, dan tanggal kedaluwarsa yang diverifikasi AI Vision.",
  },
  {
    code: "04",
    title: "Produk Edukasi Budaya",
    desc: "Sertifikasi keaslian alat musik tradisional, alat peraga aksara, dan permainan rakyat beserta panduan penggunaan interaktif.",
  },
  {
    code: "05",
    title: "Aroma & Perawatan Tradisional",
    desc: "Jaminan kemurnian minyak atsiri, jamu, dan racikan perawatan herbal Nusantara dengan perlindungan anti-pecah QR Shield.",
  },
];

function LandingPage() {
  const router = useRouter();
  const [activePillar, setActivePillar] = useState<"QR_SEAL" | "QR_SHIELD" | "ESCROW">("QR_SEAL");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
    <div className="min-h-screen bg-[#121212] text-[#f4ecdd] font-sans selection:bg-orange-600 selection:text-white relative overflow-hidden">
      {/* 80% Werkstatt Architectural Blueprint Lines */}
      <div className="absolute inset-0 pointer-events-none werkstatt-grid opacity-80" />

      {/* Top Navigation Bar (budayago.id + Werkstatt 1px line) */}
      <header className="sticky top-0 z-50 border-b border-[#383838] bg-[#121212]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white shadow-xs group-hover:bg-orange-500 transition-colors">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-lg tracking-tight text-[#f4ecdd]">OZIKTAG</span>
              <span className="kiln-stamp hidden sm:inline-flex px-2 py-0.5 bg-[#fac603]/15 text-[#fac603] border border-[#fac603]/30 text-[9px]">
                BUDAYA DIGITAL
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-[#bdbdbd]">
            <a href="#pilar" className="hover:text-[#f4ecdd] transition">01 / Pilar Produk</a>
            <a href="#budaya" className="hover:text-[#f4ecdd] transition">02 / Karya Budaya</a>
            <a href="#alur" className="hover:text-[#f4ecdd] transition">03 / Alur & FAQ</a>
            <a href="#tim" className="hover:text-[#f4ecdd] transition">04 / Tim</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/docs"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#383838] bg-[#1c1c1c] px-3.5 py-2 text-xs font-mono font-semibold text-[#f4ecdd] hover:bg-[#262626] transition"
            >
              API Docs
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition shadow-xs"
            >
              Masuk Studio
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="mx-auto max-w-7xl px-4 sm:px-8 pt-16 sm:pt-24 pb-20 border-b border-[#383838]">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Budaya GO! Editorial Authority */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#383838] bg-[#1c1c1c] px-3 py-1.5 text-xs font-mono text-[#fac603] mb-6">
                <Flame className="h-3.5 w-3.5 text-[#ff792f]" />
                <span className="font-bold tracking-wider uppercase">Solusi Digital Ekonomi & Industri Budaya</span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-[62px] font-extrabold tracking-tight text-[#f4ecdd] leading-[1.08]">
                Karya Budaya Terjaga.{" "}
                <span className="text-[#ff792f]">Kepercayaan Terbukti.</span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-[#bdbdbd] leading-relaxed max-w-2xl">
                Platform proteksi keaslian dan transaksi produk kriya serta wastra Nusantara berbasis{" "}
                <strong className="text-[#f4ecdd]">QR Trust Seal (AI Vision QC)</strong>,{" "}
                <strong className="text-[#f4ecdd]">QR Shield (GPS Kurir & PIN Pembeli)</strong>, dan{" "}
                <strong className="text-[#f4ecdd]">Escrow 24 Jam</strong> melalui payment gateway mitra berizin OJK/BI.
              </p>

              {/* Primary Buttons (.agents/AGENTS.md bg-orange-600 rule) */}
              <div className="mt-8 flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/auth"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-7 py-3.5 text-sm font-bold text-white hover:bg-orange-700 transition shadow-sm"
                >
                  Daftar Pelaku Budaya / UMKM
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/docs"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[#383838] bg-[#1c1c1c] px-6 py-3.5 text-sm font-mono font-semibold text-[#f4ecdd] hover:bg-[#262626] transition"
                >
                  <Cpu className="h-4 w-4 text-[#2ea4a9]" />
                  Dokumentasi API
                </Link>
              </div>

              {/* Technical Proof Bar (Werkstatt discipline) */}
              <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-8 border-t border-[#383838] pt-6 w-full max-w-xl font-mono">
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#fac603]">1 QR = 1</p>
                  <p className="text-[11px] text-[#bdbdbd] uppercase mt-1">Kredit Pay-As-You-Go</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#2ea4a9]">GPS + PIN</p>
                  <p className="text-[11px] text-[#bdbdbd] uppercase mt-1">QR Shield Logistik</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#ff792f]">24 JAM</p>
                  <p className="text-[11px] text-[#bdbdbd] uppercase mt-1">Escrow Safe Window</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive 3-Pillar Product Demonstrator */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[#383838] bg-[#1c1c1c] p-5 shadow-[var(--shadow-werkstatt-lg)]">
                {/* Simulator Tab Switcher */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#383838]">
                  <div className="flex gap-1 bg-[#121212] p-1 rounded-lg border border-[#383838]">
                    <button
                      type="button"
                      onClick={() => setActivePillar("QR_SEAL")}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-bold transition ${
                        activePillar === "QR_SEAL"
                          ? "bg-orange-600 text-white"
                          : "text-[#bdbdbd] hover:text-[#f4ecdd]"
                      }`}
                    >
                      01 QR Seal
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePillar("QR_SHIELD")}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-bold transition ${
                        activePillar === "QR_SHIELD"
                          ? "bg-orange-600 text-white"
                          : "text-[#bdbdbd] hover:text-[#f4ecdd]"
                      }`}
                    >
                      02 QR Shield
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePillar("ESCROW")}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-bold transition ${
                        activePillar === "ESCROW"
                          ? "bg-orange-600 text-white"
                          : "text-[#bdbdbd] hover:text-[#f4ecdd]"
                      }`}
                    >
                      03 Escrow
                    </button>
                  </div>
                  <span className="kiln-stamp px-2 py-0.5 bg-[#2ea4a9]/15 text-[#2ea4a9] border border-[#2ea4a9]/30 text-[9px]">
                    ● FUNGSIONAL
                  </span>
                </div>

                {activePillar === "QR_SEAL" && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-[#383838] bg-[#121212] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="kiln-stamp inline-block px-2 py-0.5 bg-[#fac603]/15 text-[#fac603] border border-[#fac603]/30 text-[9px]">
                            ✓ VERIFIED WASTRA NUSANTARA
                          </span>
                          <h3 className="text-base font-bold text-[#f4ecdd] mt-2">
                            Batik Tulis Mega Mendung Cirebon
                          </h3>
                          <p className="text-xs font-mono text-[#bdbdbd] mt-0.5">
                            Batch: BATIK-CRB-2026 • Sanggar Trusmi
                          </p>
                        </div>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                          <QrCode className="h-full w-full text-[#121212]" />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
                        <span className="rounded bg-[#1c1c1c] border border-[#383838] px-2 py-1 text-[#f4ecdd]">
                          ✓ Pewarnaan Malam Alami
                        </span>
                        <span className="rounded bg-[#1c1c1c] border border-[#383838] px-2 py-1 text-[#f4ecdd]">
                          ✓ Tembusan Depan-Belakang Rapi
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#2ea4a9]/30 bg-[#2ea4a9]/10 p-3.5 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-[#2ea4a9] text-[11px]">
                        <Bot className="h-3.5 w-3.5" />
                        ANALISIS AI VISION &amp; TIPS PELESTARIAN
                      </div>
                      <p className="text-[#f4ecdd]/90 leading-relaxed text-[12px]">
                        Garis gradasi 7 warna awan konsisten tanpa cacat cetak. Rawat kain dengan mencuci lembut memakai{" "}
                        <strong>ekstrak buah lerak</strong> dan hindari jemur di matahari langsung.
                      </p>
                    </div>

                    <Link
                      to="/generator"
                      className="block w-full text-center rounded-lg bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-700 transition"
                    >
                      Buat QR Trust Seal Produk Anda &rarr;
                    </Link>
                  </div>
                )}

                {activePillar === "QR_SHIELD" && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-[#383838] bg-[#121212] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#2ea4a9] font-bold">
                            Dual-QR Segel Kardus &amp; Kurir
                          </span>
                          <h3 className="text-base font-bold text-[#f4ecdd] mt-0.5">
                            Gerabah Terakota Kasongan
                          </h3>
                          <p className="text-xs font-mono text-[#bdbdbd]">
                            Status: IN_TRANSIT • GPS Kurir Terkunci
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2ea4a9]/20 text-[#2ea4a9]">
                          <Shield className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5 font-mono">
                        <div className="rounded-lg border border-[#383838] bg-[#1c1c1c] p-2.5">
                          <span className="text-[9px] text-[#bdbdbd] uppercase block">PIN Rahasia Pembeli</span>
                          <span className="text-sm font-extrabold tracking-[0.2em] text-[#fac603]">482910</span>
                        </div>
                        <div className="rounded-lg border border-[#383838] bg-[#1c1c1c] p-2.5">
                          <span className="text-[9px] text-[#bdbdbd] uppercase block">Checkpoint GPS</span>
                          <span className="text-xs font-bold text-[#2ea4a9] flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> -7.848, 110.335
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#383838] bg-[#121212] p-3.5 text-xs space-y-1">
                      <p className="font-mono font-bold text-[#ff792f] text-[11px] flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5" /> ANTI-PENIPUAN TUKAR BARANG
                      </p>
                      <p className="text-[#bdbdbd] leading-relaxed">
                        Pembeli hanya memasukkan PIN 6-digit setelah membuka paket. Jika barang tidak sesuai, ajukan{" "}
                        <strong className="text-[#f4ecdd]">Sengketa + Video Unboxing</strong> sebelum dana cair.
                      </p>
                    </div>

                    <Link
                      to="/tracking"
                      className="block w-full text-center rounded-lg bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-700 transition"
                    >
                      Buka Panel QR Shield &amp; Resi Aman &rarr;
                    </Link>
                  </div>
                )}

                {activePillar === "ESCROW" && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-[#383838] bg-[#121212] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#fac603] font-bold">
                            Payment Gateway Mitra (OJK / BI)
                          </span>
                          <h3 className="text-base font-bold text-[#f4ecdd] mt-0.5">
                            Settlement Escrow 1×24 Jam
                          </h3>
                        </div>
                        <Lock className="h-5 w-5 text-[#fac603]" />
                      </div>

                      <div className="space-y-2 border-t border-[#383838] pt-3 text-xs font-mono">
                        <div className="flex justify-between text-[#bdbdbd]">
                          <span>Harga Karya Budaya</span>
                          <span className="text-[#f4ecdd]">Rp 500.000</span>
                        </div>
                        <div className="flex justify-between text-[#bdbdbd]">
                          <span>Biaya Proteksi (1,5% + Rp 1.000)</span>
                          <span className="text-[#ff792f]">- Rp 8.500</span>
                        </div>
                        <div className="flex justify-between border-t border-[#383838] pt-2 font-bold text-sm">
                          <span className="text-[#f4ecdd]">Dana Bersih Penjual</span>
                          <span className="text-[#2ea4a9]">Rp 491.500</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#fac603]/30 bg-[#fac603]/10 p-3.5 text-xs">
                      <p className="font-mono font-bold text-[#fac603] text-[11px] flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5" /> KEPATUHAN REGULASI BANK INDONESIA
                      </p>
                      <p className="text-[#f4ecdd]/90 mt-1 leading-relaxed">
                        Oziktag tidak menyimpan dana sendiri. Dana ditahan aman oleh payment gateway pihak ketiga hingga 24 jam pasca konfirmasi diterima, lalu cair ke Dompet Penghasilan.
                      </p>
                    </div>

                    <Link
                      to="/wallet"
                      className="block w-full text-center rounded-lg bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-700 transition"
                    >
                      Kelola Dompet Penghasilan Escrow &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CULTURAL MANIFESTO STRIP (budayago.id horizontal pillar bar) */}
        <section className="border-b border-[#383838] bg-[#1c1c1c]">
          <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <p className="text-xs font-mono uppercase tracking-widest text-[#fac603] font-bold">
                Indonesia Cultural Power
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#f4ecdd]">
                Budaya yang hidup.{" "}
                <span className="text-[#bdbdbd]">Transaksi yang tepercaya.</span>
              </h2>
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-4 font-mono">
              <div className="rounded-xl border border-[#383838] bg-[#121212] p-4">
                <span className="text-xs font-bold text-[#ff792f]">01</span>
                <p className="mt-1.5 text-xs font-bold text-[#f4ecdd]">QR Trust Seal AI</p>
                <p className="mt-1 text-[11px] text-[#bdbdbd] font-sans">Uji foto &amp; sertifikat autentik produk budaya.</p>
              </div>
              <div className="rounded-xl border border-[#383838] bg-[#121212] p-4">
                <span className="text-xs font-bold text-[#2ea4a9]">02</span>
                <p className="mt-1.5 text-xs font-bold text-[#f4ecdd]">QR Shield Logistik</p>
                <p className="mt-1 text-[11px] text-[#bdbdbd] font-sans">Segel kardus, GPS kurir &amp; PIN 6-digit pembeli.</p>
              </div>
              <div className="rounded-xl border border-[#383838] bg-[#121212] p-4">
                <span className="text-xs font-bold text-[#fac603]">03</span>
                <p className="mt-1.5 text-xs font-bold text-[#f4ecdd]">Escrow 24 Jam</p>
                <p className="mt-1 text-[11px] text-[#bdbdbd] font-sans">Rekber aman patuh regulasi Bank Indonesia.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 01: TIGA PILAR UTAMA PRODUK (QR, QR Shield, Escrow) */}
        <section id="pilar" className="mx-auto max-w-7xl px-4 sm:px-8 py-20 border-b border-[#383838]">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ff792f]">
              [ 01 / ARSITEKTUR PRODUK FUNGSIONAL ]
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f4ecdd]">
              Tiga Pilar Infrastruktur Kepercayaan Oziktag
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#bdbdbd]">
              Dibangun untuk menuntaskan krisis pemalsuan produk kerajinan lokal serta ketakutan penipuan jual-beli daring lintas daerah.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {/* Pilar 01: QR Trust Seal */}
            <div className="budaya-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold text-[#ff792f] tracking-wider">01 / QR TRUST SEAL</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600/15 text-[#ff792f]">
                    <QrCode className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#f4ecdd]">Validasi Kualitas AI &amp; Sertifikat QR</h3>
                <p className="mt-3 text-xs sm:text-sm text-[#bdbdbd] leading-relaxed">
                  Pengrajin mengunggah foto produk dan checklist kualitas studio. AI Vision memvalidasi klaim produk secara objektif serta menyusun halaman sertifikat publik bebas iklan lengkap dengan panduan perawatan tradisional.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#383838] flex items-center justify-between text-xs font-mono">
                <span className="text-[#2ea4a9] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Model Pay-As-You-Go
                </span>
                <span className="text-[#bdbdbd]">1 QR = 1 Kredit</span>
              </div>
            </div>

            {/* Pilar 02: QR Shield */}
            <div className="budaya-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold text-[#2ea4a9] tracking-wider">02 / QR SHIELD</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2ea4a9]/15 text-[#2ea4a9]">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#f4ecdd]">Perisai Logistik GPS &amp; PIN Pembeli</h3>
                <p className="mt-3 text-xs sm:text-sm text-[#bdbdbd] leading-relaxed">
                  Segel QR fisik pada paket merekam koordinat GPS kurir secara transparan dan mengunci penerimaan menggunakan PIN 6-digit rahasia pembeli. Dilengkapi fitur Sengketa dengan unggahan bukti video unboxing.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#383838] flex items-center justify-between text-xs font-mono">
                <span className="text-[#2ea4a9] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Anti-Tukar Paket
                </span>
                <span className="text-[#bdbdbd]">Leaflet GPS + Video</span>
              </div>
            </div>

            {/* Pilar 03: Escrow */}
            <div className="budaya-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold text-[#fac603] tracking-wider">03 / ESCROW POOL</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fac603]/15 text-[#fac603]">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#f4ecdd]">Escrow 24 Jam &amp; Dompet Penjual</h3>
                <p className="mt-3 text-xs sm:text-sm text-[#bdbdbd] leading-relaxed">
                  Dana ditahan di payment gateway mitra pihak ketiga (patuh OJK &amp; BI) selama masa verifikasi 24 jam pasca barang tiba. Setelah aman tanpa sengketa, saldo otomatis cair dan siap ditarik ke bank atau e-wallet UMKM.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#383838] flex items-center justify-between text-xs font-mono">
                <span className="text-[#fac603] flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Auto-Release 24H
                </span>
                <span className="text-[#bdbdbd]">Fee 1,5% + Rp 1rb</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 02: AKAR BUDAYA NUSANTARA (25% BUDAYA GO! FIT) */}
        <section id="budaya" className="py-20 bg-[#1c1c1c] border-b border-[#383838]">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#fac603]">
                  [ 02 / AKAR BUDAYA &amp; KRIYA NUSANTARA ]
                </span>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f4ecdd]">
                  Didedikasikan untuk Lima Sektor Karya Budaya Indonesia
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[#bdbdbd]">
                  Setiap kategori produk memiliki profil inspeksi AI dan panduan pelestarian tradisional tersendiri di halaman sertifikat publik Oziktag.
                </p>
              </div>
              <Link
                to="/auth"
                className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-[#383838] bg-[#121212] px-4 py-2.5 text-xs font-mono font-bold text-[#f4ecdd] hover:border-[#fac603] transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#fac603]" />
                Sertifikasi Karya Anda
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {CULTURAL_SECTORS.map((sector) => (
                <div
                  key={sector.code}
                  className="rounded-xl border border-[#383838] bg-[#121212] p-5 flex flex-col justify-between hover:border-[#ff792f]/60 transition"
                >
                  <div>
                    <span className="font-mono text-lg font-extrabold text-[#fac603]">{sector.code}</span>
                    <h3 className="mt-2 text-sm font-bold text-[#f4ecdd] leading-snug">{sector.title}</h3>
                    <p className="mt-2 text-xs text-[#bdbdbd] leading-relaxed">{sector.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#383838] font-mono text-[10px] text-[#2ea4a9] uppercase">
                    QR Seal + Shield Ready
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 03: ALUR KERJA END-TO-END (budayago.id vertical/step timeline) */}
        <section id="alur" className="mx-auto max-w-7xl px-4 sm:px-8 py-20 border-b border-[#383838]">
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#2ea4a9]">
              [ 03 / ALUR END-TO-END ]
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f4ecdd]">
              Dari Bengkel Pengrajin ke Tangan Pembeli dengan Aman
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: "01",
                title: "Verifikasi KYC Pengrajin",
                desc: "Pelaku budaya mendaftar dengan identitas KTP & foto riil karya untuk memastikan keaslian sumber bengkel.",
                accent: "text-[#fac603]",
              },
              {
                num: "02",
                title: "Cetak QR Trust Seal AI",
                desc: "Unggah foto & checklist QC; AI mengevaluasi kualitas lalu mencetak label QR sertifikat digital (1 QR = 1 Kredit).",
                accent: "text-[#ff792f]",
              },
              {
                num: "03",
                title: "Kirim dengan QR Shield",
                desc: "Buat resi QR Shield ber-Escrow. Kurir merekam GPS dan pembeli membuka paket lalu memasukkan PIN 6-digit.",
                accent: "text-[#2ea4a9]",
              },
              {
                num: "04",
                title: "Dana Cair Setelah 24 Jam",
                desc: "Jika aman tanpa video sengketa selama 24 jam, saldo otomatis masuk ke Dompet Penghasilan untuk ditarik.",
                accent: "text-[#d5f76c]",
              },
            ].map((step) => (
              <div key={step.num} className="rounded-2xl border border-[#383838] bg-[#1c1c1c] p-6">
                <span className={`font-mono text-2xl font-extrabold ${step.accent}`}>{step.num}</span>
                <h3 className="mt-3 text-base font-bold text-[#f4ecdd]">{step.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#bdbdbd] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: FAQ ACCORDION (Persis gaya budayago.id!) */}
        <section className="bg-[#1c1c1c] py-20 border-b border-[#383838]" id="faq">
          <div className="mx-auto max-w-5xl px-4 sm:px-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f4ecdd]">
              Masih ada pertanyaan?
            </h2>
            <p className="mt-2 text-sm text-[#bdbdbd]">
              Penjelasan teknis seputar AI QR Trust Seal, QR Shield anti-penipuan, dan kepatuhan regulasi Escrow 24 jam.
            </p>

            <div className="mt-8 flex flex-col">
              {FAQS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="flex w-full min-h-[72px] items-center justify-between gap-5 py-5 text-left cursor-pointer focus:outline-none"
                    >
                      <span className="text-base sm:text-lg font-semibold leading-snug text-[#f4ecdd]">
                        {item.q}
                      </span>
                      <span className="shrink-0 text-[#d5f76c]">
                        {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="pb-6 text-sm sm:text-base leading-relaxed text-[#bdbdbd]">
                        {item.a}
                      </p>
                    )}
                    {idx < FAQS.length - 1 && <div className="h-px w-full bg-[#383838]" />}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 04: TIM PENGEMBANG */}
        <section id="tim" className="mx-auto max-w-7xl px-4 sm:px-8 py-20 border-b border-[#383838]">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ff792f]">
              [ 04 / TIM PENGEMBANG OZIKTAG ]
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f4ecdd]">
              Dibangun untuk Kemajuan Ekonomi Budaya
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                code: "01 · TEKNOLOGI & SISTEM",
                name: "Oki Taruna Ramadhan",
                role: "Founder & Systems Architect",
                photo: "/oki.png",
                imgClass: "object-cover object-top",
                bio: "Merancang infrastruktur FastAPI, integrasi AI Vision QC, sistem QR Shield GPS + PIN Pembeli, serta mekanisme auto-release Escrow 24 jam via Supabase.",
                linkedin: "https://www.linkedin.com/in/otaruram/",
              },
              {
                code: "02 · EKONOMI & BISNIS",
                name: "Azdzikri Muhammad Hisyam Soleh",
                role: "Co-Founder & Business Strategist",
                photo: "/zikri.jpeg",
                imgClass: "object-cover",
                bio: "Merumuskan model bisnis Pay-As-You-Go ramah UMKM budaya (BEP ~26 pengrajin/bulan), struktur kepatuhan OJK/Bank Indonesia, dan kemitraan sanggar.",
                linkedin: "https://www.linkedin.com/in/azdzikri-muhammad-hisyam-soleh-086b43281/",
              },
              {
                code: "03 · QUALITY CONTROL & KURASI BUDAYA",
                name: "Rika Amelia",
                role: "Quality Control & Cultural Curator",
                photo: "/Rika Amelya.jpeg",
                imgClass: "object-cover object-top",
                bio: "Memastikan setiap karya kriya, wastra Nusantara, dan produk UMKM memenuhi standar kurasi, keaslian bahan, serta kualitas tertinggi sebelum sampai ke pembeli.",
                linkedin: "https://www.linkedin.com/in/rikaameliaz/",
              },
            ].map((member) => (
              <div key={member.name} className="budaya-card rounded-2xl p-6 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#383838]">
                      <img src={member.photo} alt={member.name} className={`h-full w-full ${member.imgClass}`} />
                    </div>
                    <span className="kiln-stamp px-2 py-0.5 bg-[#121212] text-[#2ea4a9] border border-[#383838] text-[9px] text-right">
                      {member.code}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#f4ecdd]">{member.name}</h3>
                  <p className="text-xs font-mono text-[#ff792f] font-bold uppercase mt-1">{member.role}</p>
                  <p className="mt-3 text-xs text-[#bdbdbd] leading-relaxed">{member.bio}</p>
                </div>
                <div className="pt-4 border-t border-[#383838]">
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#fac603] hover:underline"
                  >
                    LinkedIn Profile &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA BOTTOM */}
        <section className="py-20 bg-[#1c1c1c]">
          <div className="mx-auto max-w-4xl px-4 sm:px-8 text-center">
            <span className="kiln-stamp inline-block px-3 py-1 bg-orange-600/20 text-[#ff792f] border border-orange-600/30">
              SIAPKAN KARYA ANDA
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#f4ecdd]">
              Lindungi Nilai Karya Budaya Anda Sekarang
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#bdbdbd] max-w-2xl mx-auto">
              Mulai terbitkan QR Trust Seal AI, amankan pengiriman dengan QR Shield, dan terima pembayaran aman melalui Escrow 24 jam.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/auth"
                className="rounded-lg bg-orange-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-orange-700 transition shadow-sm"
              >
                Mulai Gratis Sekarang
              </Link>
              <Link
                to="/docs"
                className="rounded-lg border border-[#383838] bg-[#121212] px-8 py-3.5 text-sm font-mono font-semibold text-[#f4ecdd] hover:bg-[#262626] transition"
              >
                Integrasi API UMKM
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#383838] bg-[#121212] py-10 text-xs text-[#bdbdbd] font-mono">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 font-bold text-[#f4ecdd]">
            <ShieldCheck className="h-5 w-5 text-orange-600" />
            <span>OZIKTAG</span>
            <span className="text-[#bdbdbd] font-normal text-[11px]">// QR • QR SHIELD • ESCROW</span>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <Link to="/docs" className="hover:text-[#f4ecdd] transition">Dokumentasi</Link>
            <Link to="/terms" className="hover:text-[#f4ecdd] transition">Ketentuan</Link>
            <Link to="/privacy" className="hover:text-[#f4ecdd] transition">Privasi</Link>
          </div>
          <p className="text-[11px]">© {new Date().getFullYear()} Oziktag. Inovasi Budaya Digital Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}
