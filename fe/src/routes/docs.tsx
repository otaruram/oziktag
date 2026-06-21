import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Menu, Search, BookOpen, Settings, Zap, ArrowRight, Home, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [{ title: "Dokumentasi (Khusus Developer) — Oziktag" }] }),
  component: DocsPage,
});

function DocsPage() {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    // Simple in-page search
    (window as any).find(searchQuery);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-background sm:hidden flex flex-col p-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <form onSubmit={(e) => {
              handleSearch(e);
              setMobileSearchOpen(false);
            }} className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Cari dokumentasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 rounded-lg border border-border bg-muted/30 pl-10 pr-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
            </form>
            <button 
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Ketik kata kunci lalu tekan enter/go pada keyboard
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Oziktag Docs (Khusus Developer)</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari dokumentasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 rounded-md border border-border bg-muted/50 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </form>
            <button 
              onClick={() => setMobileSearchOpen(true)} 
              className="sm:hidden flex items-center justify-center p-2 rounded-md border border-border bg-muted/50 text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary active:scale-95"
              title="Cari dokumen..."
            >
              <Search className="h-4 w-4" />
            </button>
            <Link to="/" className="text-sm font-medium hover:text-primary flex items-center gap-2">
              <Home className="h-4 w-4" /> Beranda
            </Link>

          </div>
        </div>
      </header>

      <div className="flex-1 flex px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-7xl">
        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-border bg-background pt-14 md:sticky md:block shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="px-4 py-6 md:px-2 md:py-8 space-y-6">
            <div>
              <h4 className="font-semibold mb-3 text-sm px-2">Getting Started</h4>
              <ul className="space-y-1">
                <li>
                  <a onClick={() => setMobileMenuOpen(false)} href="#cara-kerja" className="block px-2 py-1.5 text-sm rounded-md bg-primary/10 text-primary font-medium">Cara Kerja</a>
                </li>
                <li>
                  <a onClick={() => setMobileMenuOpen(false)} href="#arsitektur" className="block px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">Arsitektur</a>
                </li>
                <li>
                  <a onClick={() => setMobileMenuOpen(false)} href="#teknologi" className="block px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">Teknologi</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm px-2">Features</h4>
              <ul className="space-y-1">
                <li>
                  <a onClick={() => setMobileMenuOpen(false)} href="#ai-qc" className="block px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5" /> AI Quality Control
                  </a>
                </li>
                <li>
                  <a onClick={() => setMobileMenuOpen(false)} href="#kyc" className="block px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" /> Sistem KYC
                  </a>
                </li>
                <li>
                  <a onClick={() => setMobileMenuOpen(false)} href="#api" className="block px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2"><Settings className="h-3.5 w-3.5" /> API Reference</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-8 md:pl-10 lg:pl-12 w-full max-w-4xl">
          <div className="space-y-8">
            <section id="cara-kerja" className="scroll-mt-20">
              <p className="text-primary font-semibold text-sm mb-2">Getting Started</p>
              <h1 className="text-4xl font-bold tracking-tight mb-4">Cara Kerja Oziktag</h1>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Oziktag adalah Digital Trust Seal berbasis QR Code yang didesain untuk UMKM. Sistem ini membantu 
                memvalidasi kualitas produk (QC) secara transparan agar pembeli merasa aman dan percaya.
              </p>

              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
                    Registrasi & Verifikasi KYC
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pengguna melakukan login menggunakan Google OAuth (Supabase). Setelah itu, mereka diwajibkan 
                    mengisi form KYC (Know Your Customer) berupa Nama Brand, NIK, dan NPWP. Data ini disimpan dengan 
                    aman di database dan digunakan untuk menjamin identitas valid toko.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</span>
                    Input Data Produk & QC
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Pemilik toko memasukkan detail produk (Nama, Kategori, Batch), mengisi checklist QC, 
                    dan mengunggah foto produk riil. Foto tersebut dikirim ke layanan cloud (ImageKit) 
                    dan URL-nya diteruskan ke sistem AI.
                  </p>
                  <div className="bg-muted p-4 rounded-md overflow-x-auto text-sm border border-border/50">
                    <pre className="text-foreground">
                      <code>{`// Contoh Payload Submit QC
{
  "nama_produk": "Kopi Arabika Gayo",
  "kategori": "Makanan & Minuman",
  "checklist": ["Segel utuh", "Expired date jelas"],
  "images": [File1, File2]
}`}</code>
                    </pre>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</span>
                    Analisis AI (Gemini 2.5 Flash)
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Data yang dikirim akan dianalisis secara real-time oleh Google Gemini AI. AI akan memberikan 
                    Insight (sudut pandang kualitas) dan Solution (cara menyimpan atau mengkonsumsi) 
                    yang nantinya ditampilkan kepada pembeli.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">4</span>
                    Scan oleh Pembeli
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sistem menghasilkan UUID unik dan dirender menjadi QR Code. Saat pembeli melakukan pemindaian (Scan), 
                    mereka diarahkan ke halaman publik yang menampilkan:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>Status Verifikasi Toko (Centang Biru KYC)</li>
                    <li>Detail Checklist QC yang lulus</li>
                    <li>Review dari AI tentang produk</li>
                    <li>Foto riil kondisi barang sebelum dikirim</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="border-t border-border pt-8 mt-12">
              <h2 id="arsitektur" className="text-2xl font-bold tracking-tight mb-4 scroll-mt-20">Arsitektur End-to-End</h2>
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs uppercase bg-muted text-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-3">Layer</th>
                      <th className="px-6 py-3">Teknologi</th>
                      <th className="px-6 py-3">Fungsi Utama</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="px-6 py-4 font-medium text-foreground">Frontend</td>
                      <td className="px-6 py-4">Vite, React, TanStack Start</td>
                      <td className="px-6 py-4">UI interaktif, Routing, Form Handling</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-6 py-4 font-medium text-foreground">Backend</td>
                      <td className="px-6 py-4">Python, FastAPI</td>
                      <td className="px-6 py-4">API Endpoints, Rate Limiting, AI Orchestration</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-6 py-4 font-medium text-foreground">Database</td>
                      <td className="px-6 py-4">Supabase (PostgreSQL), Prisma</td>
                      <td className="px-6 py-4">Penyimpanan Relasional, ORM kuat dan statik</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-6 py-4 font-medium text-foreground">Storage</td>
                      <td className="px-6 py-4">ImageKit</td>
                      <td className="px-6 py-4">Kompresi dinamis dan CDN untuk foto produk</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-border pt-8 mt-12">
              <h2 id="ai-qc" className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2 scroll-mt-20">
                <Zap className="h-6 w-6 text-primary" /> AI Quality Control
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Sistem QC (Quality Control) di Oziktag tidak sekadar menyimpan data. Kami menggunakan <strong>Google Gemini 2.5 Flash</strong> untuk menganalisis checklist dan catatan penjual secara otomatis. AI bertugas memberikan <em>insight</em> kepada pembeli mengenai kondisi barang secara lebih ramah dan profesional, serta memberikan tips perawatan produk.
              </p>
            </div>

            <div className="border-t border-border pt-8 mt-12">
              <h2 id="kyc" className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2 scroll-mt-20">
                <BookOpen className="h-6 w-6 text-primary" /> Sistem KYC (Know Your Customer)
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Untuk mencegah penyalahgunaan label QC (pemalsuan identitas toko), setiap brand UMKM diwajibkan untuk mengisi form KYC yang berisi NIK KTP dan/atau NPWP. Data ini bersifat konfidensial dan hanya digunakan untuk validasi bahwa QR Code yang di-scan pembeli benar-benar berasal dari penjual asli, bukan pihak ketiga yang mencetak ulang QR.
              </p>
            </div>

            <div className="border-t border-border pt-8 mt-12">
              <h2 id="api" className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2 scroll-mt-20">
                <Settings className="h-6 w-6 text-primary" /> API Reference
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Integrasikan pembuatan QR Code QC secara otomatis dari sistem ERP, POS, atau aplikasi kasir internal Anda. Gunakan API Key yang dapat di-generate melalui dashboard Developer API.
              </p>

              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold font-mono">POST</span>
                    <code className="text-sm font-mono font-medium">/api/v1/qc</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Endpoint ini digunakan untuk men-generate label QR Code QC baru beserta analisis AI otomatis.</p>
                  
                  <h4 className="font-semibold text-sm mb-2">Headers</h4>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono border border-border/50 mb-4">
                    <div className="flex justify-between mb-1"><span className="text-primary">Authorization:</span> <span>Bearer {'<YOUR_API_KEY>'}</span></div>
                    <div className="flex justify-between"><span className="text-primary">Content-Type:</span> <span>application/json</span></div>
                  </div>

                  <h4 className="font-semibold text-sm mb-2">Request Body (JSON)</h4>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono border border-border/50 mb-4">
                    <pre>{`{
  "nama_produk": "String (Required)",
  "kategori": "String (Required)",
  "batch": "String (Optional)",
  "checklist": ["String", "String"] (Array of Strings, Required),
  "catatan_penjual": "String (Optional)",
  "image_urls": ["String"] (Array of HTTP URLs, max 5, Required)
}`}</pre>
                  </div>

                  <h4 className="font-semibold text-sm mb-2">Success Response (201 Created)</h4>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono border border-border/50 mb-4">
                    <pre>{`{
  "qr_url": "https://www.oziktag.my.id/scan/...",
  "product_id": "uuid-string"
}`}</pre>
                  </div>

                  <h4 className="font-semibold text-sm mb-2">Error Responses</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li><code className="text-xs bg-secondary px-1 py-0.5 rounded text-destructive">401 Unauthorized</code>: API Key tidak valid atau tidak disertakan.</li>
                    <li><code className="text-xs bg-secondary px-1 py-0.5 rounded text-destructive">402 Payment Required</code>: Saldo kredit API Anda habis.</li>
                    <li><code className="text-xs bg-secondary px-1 py-0.5 rounded text-destructive">400 Bad Request</code>: Format body JSON tidak sesuai.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
              <span className="text-sm text-muted-foreground">Oziktag Documentation v1.0</span>
              <a href="#cara-kerja" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                Kembali ke atas <ArrowRight className="h-3 w-3 -rotate-45" />
              </a>
            </div>
          </div>
        </main>
        
        {/* Right TOC (Optional, hidden on small screens) */}
        <aside className="hidden xl:block w-48 shrink-0 pt-14 pl-6">
          <div className="sticky top-20">
            <h5 className="font-semibold text-sm mb-3">On this page</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#cara-kerja" className="hover:text-foreground">Cara Kerja</a></li>
              <li><a href="#arsitektur" className="hover:text-foreground">Arsitektur</a></li>
              <li><a href="#ai-qc" className="hover:text-foreground">AI QC</a></li>
              <li><a href="#kyc" className="hover:text-foreground">Sistem KYC</a></li>
              <li><a href="#api" className="hover:text-foreground">API Reference</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
