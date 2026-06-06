import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { A as AppShell } from "./AppShell-CyXwpKPM.mjs";
import { a as apiFetch } from "./api-C3EYwLtX.mjs";
import { s as supabase } from "./supabase-CicGwi1Y.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { Q as QRCode__default } from "../_libs/qrcode.mjs";
import { H as History, C as Coins, b as Check, a as Sparkles, X } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__react-router.mjs";
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
import "fs";
import "../_libs/dijkstrajs.mjs";
import "../_libs/pngjs.mjs";
import "zlib";
import "assert";
import "buffer";
const PACKAGES = [{
  id: "starter",
  name: "Starter",
  price: 2e4,
  credits: 50,
  tagline: "Cocok untuk UMKM pemula"
}, {
  id: "growth",
  name: "Growth",
  price: 5e4,
  credits: 150,
  tagline: "Pilihan paling populer",
  highlight: true
}, {
  id: "pro",
  name: "Pro",
  price: 1e5,
  credits: 400,
  tagline: "Harga per-QR termurah"
}];
const BENEFITS = ["Akses penuh Dashboard QC", "Integrasi AI Scanner", "QR aktif selamanya", "Halaman scan publik tanpa iklan"];
const idr = (n) => "Rp " + n.toLocaleString("id-ID");
function Pricing() {
  const [credits, setCreditsState] = reactExports.useState(0);
  const [history, setHistory] = reactExports.useState([]);
  const [showHistory, setShowHistory] = reactExports.useState(false);
  const [selected, setSelected] = reactExports.useState(null);
  const fetchAll = async () => {
    try {
      const me = await apiFetch("/auth/me");
      setCreditsState(me.sisa_kredit);
      const hist = await apiFetch("/topup/history");
      setHistory(hist);
    } catch (e) {
      console.error(e);
    }
  };
  reactExports.useEffect(() => {
    fetchAll();
    let sub;
    supabase.auth.getUser().then(({
      data
    }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const channelName = `pricing-user-${uid}-${Date.now()}`;
      sub = supabase.channel(channelName).on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "users",
        filter: `id=eq.${uid}`
      }, (payload) => {
        if (payload.new && payload.new.sisa_kredit !== void 0) {
          setCreditsState(payload.new.sisa_kredit);
        }
      }).subscribe();
    });
    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Top-Up Kredit" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "1 Kredit = 1× Generate QR Code QC. Bayar sekali, pakai tanpa langganan." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setShowHistory(true), className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-4 w-4" }),
        " Riwayat"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-between rounded-xl border border-border bg-gradient-to-br from-card to-secondary/40 p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Sisa kredit Anda" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-5xl font-semibold tracking-tight", children: [
          credits,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-base font-normal text-muted-foreground", children: "kredit" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Coins, { className: "h-12 w-12 text-primary/70" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-3", children: PACKAGES.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(PackageCard, { pkg: p, onPick: () => setSelected(p) }, p.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 rounded-xl border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Semua paket termasuk:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 grid gap-2 sm:grid-cols-2", children: BENEFITS.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-primary" }),
        " ",
        b
      ] }, b)) })
    ] }),
    selected && /* @__PURE__ */ jsxRuntimeExports.jsx(CheckoutModal, { pkg: selected, onClose: () => setSelected(null) }),
    showHistory && /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryModal, { history, onClose: () => setShowHistory(false) })
  ] });
}
function PackageCard({
  pkg,
  onPick
}) {
  const perQr = Math.round(pkg.price / pkg.credits);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative flex flex-col rounded-xl border bg-card p-6 transition-colors ${pkg.highlight ? "border-primary/60 shadow-[var(--shadow-elegant)]" : "border-border"}`, children: [
    pkg.highlight && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[11px] font-medium text-primary-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
      " Paling Laris"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-muted-foreground", children: [
      "Paket ",
      pkg.name
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-3xl font-semibold tracking-tight", children: idr(pkg.price) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: pkg.tagline }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-lg border border-border bg-background/40 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-semibold text-primary", children: [
        pkg.credits,
        " Kredit"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
        "Setara ",
        idr(perQr),
        " / QR Code"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onPick, className: `mt-6 w-full rounded-md py-2.5 text-sm font-medium transition-colors ${pkg.highlight ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border bg-background hover:bg-secondary"}`, children: "Pilih Paket" })
  ] });
}
function CheckoutModal({
  pkg,
  onClose
}) {
  const [method, setMethod] = reactExports.useState("QRIS");
  const [processing, setProcessing] = reactExports.useState(false);
  const [qrImage, setQrImage] = reactExports.useState(null);
  const [deeplink, setDeeplink] = reactExports.useState(null);
  const createTransaction = async () => {
    setProcessing(true);
    try {
      const paymentType = method === "QRIS" ? "qris" : "gopay";
      const res = await apiFetch("/topup/create", {
        method: "POST",
        body: JSON.stringify({
          paket: pkg.id,
          payment_type: paymentType
        })
      });
      if (res.qr_string) {
        const url = await QRCode__default.toDataURL(res.qr_string, {
          width: 300
        });
        setQrImage(url);
      } else if (res.deeplink_url) {
        setDeeplink(res.deeplink_url);
      } else {
        toast.error("Tidak ada data QR/Deeplink dari server");
      }
    } catch (e) {
      toast.error(e.message || "Gagal membuat transaksi");
    } finally {
      setProcessing(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Checkout" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "mt-1 text-lg font-semibold", children: [
          "Paket ",
          pkg.name
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Total bayar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-semibold", children: idr(pkg.price) })
    ] }),
    qrImage || deeplink ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-col items-center rounded-lg border border-dashed border-border bg-background/40 p-4 text-center", children: [
      qrImage && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: qrImage, alt: "QRIS", className: "h-48 w-48 rounded-md bg-white p-2 shadow-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs font-semibold text-primary", children: "Scan dengan e-Wallet atau m-Banking" })
      ] }),
      deeplink && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: deeplink, target: "_blank", rel: "noreferrer", className: "mt-4 rounded-md bg-[#00AED6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90", children: "Buka Aplikasi Gojek" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-col items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-3 w-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-3 w-3 rounded-full bg-primary" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Menunggu Pembayaran..." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: "Kredit akan otomatis bertambah setelah Anda membayar." })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Metode pembayaran" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid grid-cols-2 gap-2", children: ["QRIS", "GoPay"].map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMethod(m), className: `rounded-md border px-3 py-2 text-sm font-medium transition-colors ${method === m ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"}`, children: m }, m)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: createTransaction, disabled: processing, className: "mt-6 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90 disabled:opacity-60", children: processing ? "Memproses..." : "Buat Tagihan" })
    ] })
  ] }) });
}
function HistoryModal({
  history,
  onClose
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg rounded-2xl border border-border bg-card p-6", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Riwayat" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-1 text-lg font-semibold", children: "Top-Up & Penggunaan" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 max-h-80 overflow-y-auto", children: history.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-10 text-center text-sm text-muted-foreground", children: "Belum ada riwayat top-up." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: history.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between py-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium", children: [
          "Paket ",
          t.paket
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          new Date(t.created_at).toLocaleString("id-ID"),
          " • ",
          t.payment_type
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-primary", children: [
          "+",
          t.credits,
          " kredit"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: idr(t.amount) })
      ] })
    ] }, t.id)) }) })
  ] }) });
}
export {
  Pricing as component
};
