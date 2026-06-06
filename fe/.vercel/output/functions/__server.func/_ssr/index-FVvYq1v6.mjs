import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./supabase-CicGwi1Y.mjs";
import { S as ShieldCheck, c as CircleCheck, A as ArrowRight, s as Store, Q as QrCode, t as Camera, u as Bot, v as Database } from "../_libs/lucide-react.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function Landing() {
  const handleLogin = async () => {
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/register`
        }
      });
      if (error) {
        toast.error(`Login gagal: ${error.message}`);
      }
    } catch (err) {
      toast.error(`Sistem error: ${err.message}`);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background overflow-hidden relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 z-0 opacity-[0.03] pointer-events-none", style: {
      backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
      backgroundSize: "32px 32px"
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 border-b border-border/40 backdrop-blur-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-bold text-lg tracking-tight", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-6 w-6 text-foreground" }),
        "Oziktag"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/docs", className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors", children: "Cara Kerja" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleLogin, className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors", children: "Log In" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "relative z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-4xl px-6 pt-24 pb-20 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground uppercase", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
          "Digital Trust Seal untuk UMKM"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-8 text-balance text-5xl font-extrabold tracking-tight md:text-7xl leading-tight", children: [
          "Bangun kepercayaan pembeli, ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", { className: "hidden md:block" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "satu QR sekali tempel." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed", children: "Oziktag membantu UMKM memvalidasi Quality Control produk lewat QR Code yang dianalisis oleh AI. Simpel, cepat, dan 100% kredibel di mata pelanggan Anda." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 flex flex-col sm:flex-row justify-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleLogin, className: "inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-8 py-3.5 text-sm font-bold text-background transition-transform active:scale-95 hover:bg-foreground/90", children: [
            "Mulai gratis sekarang ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/docs", className: "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-border bg-background px-8 py-3.5 text-sm font-bold transition-colors hover:bg-muted", children: "Lihat dokumentasi API" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-16 pt-8 border-t border-border/50 flex flex-wrap justify-center gap-8 text-muted-foreground opacity-70 grayscale", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "h-5 w-5" }),
            " 1.000+ Toko"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { className: "h-5 w-5" }),
            " 50k+ QR Terbuat"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5" }),
            " 99.9% Uptime"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-y border-border bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-24", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold tracking-tight md:text-4xl", children: "Cara Kerja yang Transparan" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-muted-foreground", children: "Dari gudang Anda langsung ke tangan pembeli dengan jaminan AI." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-3 gap-8 relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block absolute top-8 left-1/6 right-1/6 h-[2px] bg-border z-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 bg-card border border-border p-8 rounded-2xl shadow-sm text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-6 w-6 text-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold mb-2", children: "1. Upload Produk" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Isi form QC ringkas dan upload foto riil produk sebelum dikemas." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 bg-card border border-border p-8 rounded-2xl shadow-sm text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-16 h-16 bg-foreground text-background border border-foreground rounded-full flex items-center justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-6 w-6" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold mb-2", children: "2. Analisis AI" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Gemini AI memvalidasi foto dan memberikan insight jaminan kualitas secara objektif." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 bg-card border border-border p-8 rounded-2xl shadow-sm text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { className: "h-6 w-6 text-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold mb-2", children: "3. Cetak & Tempel QR" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Sistem mencetak QR Code unik. Pembeli scan untuk melihat sertifikat digital." })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-6xl px-6 py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 gap-12 items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-3xl font-bold tracking-tight md:text-4xl leading-tight", children: [
            "Teknologi Enterprise",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "untuk Skala UMKM"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-muted-foreground text-lg mb-8", children: "Kami membangun sistem dengan arsitektur mutakhir untuk memastikan data tidak bisa dimanipulasi oleh pihak manapun." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 bg-muted p-2 rounded-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "block text-foreground", children: "Relational Storage" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "Data disimpan secara presisi menggunakan PostgreSQL & Prisma." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 bg-muted p-2 rounded-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "block text-foreground", children: "Verifikasi KYC Terpusat" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "Setiap toko divalidasi keasliannya mencegah pemalsuan produk." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-2xl border border-border bg-card p-2 overflow-hidden shadow-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-muted/50 to-background z-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 bg-background border border-border rounded-xl p-6 h-full flex flex-col justify-center text-center py-16", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { className: "h-24 w-24 mx-auto text-foreground mb-6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex mx-auto items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
              " Terverifikasi Aman"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mt-4 font-bold text-xl", children: "Kopi Gayo Premium" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Batch: B-2026-06" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-t border-border bg-foreground text-background py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-6 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold tracking-tight md:text-5xl", children: "Siap Meningkatkan Penjualan?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-background/80 text-lg", children: "Bergabung dengan ribuan UMKM lain yang sudah membuktikan peningkatan kepercayaan pelanggan mereka bersama Oziktag." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleLogin, className: "inline-flex items-center justify-center gap-2 rounded-lg bg-background px-8 py-4 text-base font-bold text-foreground transition-transform active:scale-95 hover:bg-background/90", children: "Mulai Uji Coba Gratis" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t border-border bg-background py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-bold text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5" }),
        "Oziktag"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " Oziktag. All rights reserved."
      ] })
    ] }) })
  ] });
}
export {
  Landing as component
};
