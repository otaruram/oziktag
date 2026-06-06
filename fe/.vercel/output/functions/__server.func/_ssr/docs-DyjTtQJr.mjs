import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { M as Menu, S as ShieldCheck, d as Search, e as House, G as Github, Z as Zap, f as BookOpen, g as Settings, A as ArrowRight } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
function DocsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground flex flex-col font-sans", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMobileMenuOpen(!mobileMenuOpen), className: "md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 font-bold tracking-tight", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Oziktag Docs" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden md:flex items-center px-3 py-1.5 rounded-md border border-border bg-muted/50 text-muted-foreground text-sm gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Cari dokumen..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "ml-4 font-mono text-[10px] opacity-50", children: "Ctrl K" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "text-sm font-medium hover:text-primary flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-4 w-4" }),
          " Beranda"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://github.com", target: "_blank", rel: "noreferrer", className: "text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Github, { className: "h-5 w-5" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-7xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: `fixed inset-y-0 left-0 z-30 w-64 border-r border-border bg-background pt-14 md:sticky md:block shrink-0 overflow-y-auto ${mobileMenuOpen ? "block" : "hidden"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-6 md:px-2 md:py-8 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-3 text-sm px-2", children: "Getting Started" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#cara-kerja", className: "block px-2 py-1.5 text-sm rounded-md bg-primary/10 text-primary font-medium", children: "Cara Kerja" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#arsitektur", className: "block px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground", children: "Arsitektur" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#teknologi", className: "block px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground", children: "Teknologi" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-3 text-sm px-2", children: "Features" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#ai-qc", className: "block px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-3.5 w-3.5" }),
              " AI Quality Control"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#kyc", className: "block px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-3.5 w-3.5" }),
              " Sistem KYC"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#api", className: "block px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-3.5 w-3.5" }),
              " API Reference"
            ] }) })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 py-8 md:pl-10 lg:pl-12 w-full max-w-4xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "cara-kerja", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-primary font-semibold text-sm mb-2", children: "Getting Started" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold tracking-tight mb-4", children: "Cara Kerja Oziktag" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-lg mb-6 leading-relaxed", children: "Oziktag adalah Digital Trust Seal berbasis QR Code yang didesain untuk UMKM. Sistem ini membantu memvalidasi kualitas produk (QC) secara transparan agar pembeli merasa aman dan percaya." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold mb-3 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary", children: "1" }),
                "Registrasi & Verifikasi KYC"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: "Pengguna melakukan login menggunakan **Google OAuth (Supabase)**. Setelah itu, mereka diwajibkan mengisi form KYC (Know Your Customer) berupa Nama Brand, NIK, dan NPWP. Data ini disimpan dengan aman di database dan digunakan untuk menjamin identitas valid toko." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold mb-3 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary", children: "2" }),
                "Input Data Produk & QC"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed mb-4", children: "Pemilik toko memasukkan detail produk (Nama, Kategori, Batch), mengisi checklist QC, dan **mengunggah foto produk riil**. Foto tersebut dikirim ke layanan cloud (ImageKit) dan URL-nya diteruskan ke sistem AI." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted p-4 rounded-md overflow-x-auto text-sm border border-border/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: `// Contoh Payload Submit QC
{
  "nama_produk": "Kopi Arabika Gayo",
  "kategori": "Makanan & Minuman",
  "checklist": ["Segel utuh", "Expired date jelas"],
  "images": [File1, File2]
}` }) }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold mb-3 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary", children: "3" }),
                "Analisis AI (Gemini 2.5 Flash)"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: "Data yang dikirim akan dianalisis secara real-time oleh **Google Gemini AI**. AI akan memberikan *Insight* (sudut pandang kualitas) dan *Solution* (cara menyimpan atau mengkonsumsi) yang nantinya ditampilkan kepada pembeli." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold mb-3 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary", children: "4" }),
                "Scan oleh Pembeli"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: "Sistem menghasilkan UUID unik dan dirender menjadi QR Code. Saat pembeli melakukan pemindaian (Scan), mereka diarahkan ke halaman publik yang menampilkan:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Status Verifikasi Toko (Centang Biru KYC)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Detail Checklist QC yang lulus" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Review dari AI tentang produk" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Foto riil kondisi barang sebelum dikirim" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border pt-8 mt-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "arsitektur", className: "text-2xl font-bold tracking-tight mb-4", children: "Arsitektur End-to-End" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-lg border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm text-left text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-xs uppercase bg-muted text-foreground border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3", children: "Layer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3", children: "Teknologi" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3", children: "Fungsi Utama" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 font-medium text-foreground", children: "Frontend" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: "Vite, React, TanStack Start" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: "UI interaktif, Routing, Form Handling" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 font-medium text-foreground", children: "Backend" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: "Python, FastAPI" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: "API Endpoints, Rate Limiting, AI Orchestration" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 font-medium text-foreground", children: "Database" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: "Supabase (PostgreSQL), Prisma" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: "Penyimpanan Relasional, ORM kuat dan statik" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 font-medium text-foreground", children: "Storage" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: "ImageKit" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: "Kompresi dinamis dan CDN untuk foto produk" })
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mt-12 pt-6 border-t border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "Oziktag Documentation v1.0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#cara-kerja", className: "text-sm font-medium text-primary hover:underline flex items-center gap-1", children: [
            "Kembali ke atas ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3 -rotate-45" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "hidden xl:block w-48 shrink-0 pt-14 pl-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-semibold text-sm mb-3", children: "On this page" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#cara-kerja", className: "hover:text-foreground", children: "Cara Kerja" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#arsitektur", className: "hover:text-foreground", children: "Arsitektur" }) })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  DocsPage as component
};
