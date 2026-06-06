import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { b as getTag } from "./oziktag-store-CeL0dM1Q.mjs";
import { R as Route } from "./router-Dda3suq_.mjs";
import "../_libs/sonner.mjs";
import { w as CircleAlert, S as ShieldCheck, c as CircleCheck, a as Sparkles, L as LoaderCircle } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
function Scan() {
  const {
    id
  } = Route.useParams();
  const [tag, setTag] = reactExports.useState(null);
  const [loaded, setLoaded] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setTag(getTag(id) || null);
    setLoaded(true);
  }, [id]);
  if (!loaded) return null;
  if (!tag) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-sm rounded-2xl border border-border bg-card p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto h-10 w-10 text-destructive" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 text-lg font-semibold", children: "QR Tidak Ditemukan" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Label ini belum terdaftar atau sudah dinonaktifkan." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background px-4 py-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4 text-primary" }),
      " Oziktag · Trusted Seal"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-[var(--shadow-elegant)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center bg-gradient-to-b from-primary/15 to-transparent px-6 py-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-20 w-20 items-center justify-center rounded-full bg-primary/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-12 w-12 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 text-2xl font-semibold tracking-tight", children: "Verified & Trusted" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Produk ini telah melewati Quality Control oleh" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-base font-medium text-primary", children: tag.brand })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 border-t border-border px-6 py-5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Nama Produk", value: tag.productName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Kategori", value: tag.category }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Kode Batch", value: tag.batch || "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Tanggal QC", value: new Date(tag.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border px-6 py-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Checklist QC" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: tag.qc.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-primary" }),
          q
        ] }, q)) })
      ] })
    ] }),
    tag.photos && tag.photos.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(PhotoGallery, { photos: tag.photos }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AiSummary, { tag }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-6 text-center text-xs text-muted-foreground", children: [
      "Validasi dilakukan oleh sistem Oziktag.",
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      "ID Label: ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: tag.id })
    ] })
  ] }) });
}
function AiSummary({
  tag
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AiSummaryInner, { tag });
}
function PhotoGallery({
  photos
}) {
  const [active, setActive] = reactExports.useState(0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-elegant)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground", children: [
      "Foto Produk (",
      photos.length,
      ")"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "snap-x snap-mandatory overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: photos.map((src, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: `Foto produk ${i + 1}`, onClick: () => setActive(i), className: `aspect-square w-full max-w-[280px] shrink-0 snap-center cursor-pointer rounded-lg border object-cover transition-all ${active === i ? "border-primary" : "border-border"}` }, i)) }) }),
    photos.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex justify-center gap-1.5", children: photos.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-1.5 rounded-full transition-all ${active === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40"}` }, i)) })
  ] });
}
function AiSummaryInner({
  tag
}) {
  const [status, setStatus] = reactExports.useState("idle");
  const hasNotes = !!tag.notes && tag.notes.trim().length > 0;
  const insight = hasNotes ? `Produk ini dalam kondisi sangat baik dan original. Berdasarkan catatan QC dari ${tag.brand}: "${tag.notes}" — hal ini tidak mempengaruhi kualitas isi produk.` : `Produk ini telah lolos seluruh checklist Quality Control oleh ${tag.brand} dan berada dalam kondisi prima serta original.`;
  const careTips = {
    "Makanan & Minuman": "Simpan di tempat sejuk dan kering, hindari sinar matahari langsung untuk menjaga rasa & aroma.",
    Fashion: "Cuci dengan air dingin dan jemur di tempat teduh agar warna & serat tetap awet.",
    Kerajinan: "Bersihkan dengan kain kering, hindari kelembapan tinggi agar tidak berjamur.",
    Kecantikan: "Tutup rapat setelah dipakai dan simpan di suhu ruang, hindari paparan matahari.",
    Lainnya: "Simpan di tempat aman, kering, dan jauh dari jangkauan anak-anak."
  };
  const tip = careTips[tag.category] ?? careTips.Lainnya;
  const generate = () => {
    setStatus("loading");
    setTimeout(() => setStatus("ready"), 1600);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-6 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-[var(--shadow-elegant)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-7 w-7 items-center justify-center rounded-full bg-primary/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold tracking-tight", children: "Insight AI" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary", children: "Oziktag AI" })
      ] }),
      status === "idle" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: "Dapatkan insight & tips perawatan produk ini dari AI Oziktag." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: generate, className: "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }),
          " Generate Insight AI"
        ] })
      ] }),
      status === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-col items-center justify-center gap-2 py-6 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "AI sedang menganalisis produk…" })
      ] }),
      status === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm leading-relaxed text-foreground/90", children: insight }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-lg border border-border bg-background/40 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground", children: "Solusi & Tips Perawatan" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-foreground/90", children: tip })
        ] })
      ] })
    ] })
  ] });
}
function Row({
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: value })
  ] });
}
export {
  Scan as component
};
