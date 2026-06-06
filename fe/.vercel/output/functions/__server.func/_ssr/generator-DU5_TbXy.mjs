import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { l as libExports } from "../_libs/qrcode.mjs";
import { A as AppShell } from "./AppShell-CyXwpKPM.mjs";
import { a as getCredits } from "./oziktag-store-CeL0dM1Q.mjs";
import { a as apiFetch } from "./api-C3EYwLtX.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as Sparkles, c as CircleCheck, X, P as Plus, I as ImagePlus, Q as QrCode, D as Download } from "../_libs/lucide-react.mjs";
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
import "fs";
import "../_libs/dijkstrajs.mjs";
import "../_libs/pngjs.mjs";
import "zlib";
import "assert";
import "buffer";
import "./supabase-CicGwi1Y.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const DEFAULT_QC_OPTIONS = ["Kondisi fisik baik", "Sesuai standar kualitas", "Kemasan tersegel", "Lulus uji kebersihan"];
const CATEGORIES = ["Makanan & Minuman", "Fashion", "Kerajinan", "Kecantikan", "Lainnya"];
function Generator() {
  const [productName, setProductName] = reactExports.useState("");
  const [category, setCategory] = reactExports.useState(CATEGORIES[0]);
  const [batch, setBatch] = reactExports.useState("");
  const [qcOptions, setQcOptions] = reactExports.useState(DEFAULT_QC_OPTIONS);
  const [qc, setQc] = reactExports.useState([DEFAULT_QC_OPTIONS[0], DEFAULT_QC_OPTIONS[1]]);
  const [customQc, setCustomQc] = reactExports.useState("");
  const [notes, setNotes] = reactExports.useState("");
  const [photos, setPhotos] = reactExports.useState([]);
  const [imageFiles, setImageFiles] = reactExports.useState([]);
  const [qrUrl, setQrUrl] = reactExports.useState(null);
  const [savedTag, setSavedTag] = reactExports.useState(null);
  const [credits, setCreditsState] = reactExports.useState(() => typeof window === "undefined" ? 0 : getCredits());
  const toggleQc = (item) => setQc((arr) => arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  const addCustomQc = () => {
    const v = customQc.trim();
    if (!v) return;
    if (qcOptions.includes(v)) {
      toast.error("Item QC sudah ada");
      return;
    }
    setQcOptions((arr) => [...arr, v]);
    setQc((arr) => [...arr, v]);
    setCustomQc("");
    toast.success("Item QC custom ditambahkan");
  };
  const removeQcOption = (item) => {
    setQcOptions((arr) => arr.filter((x) => x !== item));
    setQc((arr) => arr.filter((x) => x !== item));
  };
  const DUMMY_PRODUCTS = [{
    name: "Kopi Arabika Gayo Premium 250g",
    cat: "Makanan & Minuman",
    notes: "Ada sedikit goresan di kemasan, isi aman 100%."
  }, {
    name: "Batik Tulis Lengan Panjang M",
    cat: "Fashion",
    notes: "Jahitan rapi, warna sesuai standar, tidak luntur."
  }, {
    name: "Sambal Bawang Ekstra Pedas",
    cat: "Makanan & Minuman",
    notes: "Segel botol utuh, expired date jelas."
  }, {
    name: "Serum Vitamin C Wajah 15ml",
    cat: "Kecantikan",
    notes: "Botol tidak bocor, tekstur gel sesuai QC."
  }, {
    name: "Kerajinan Tas Rotan Bali",
    cat: "Kerajinan",
    notes: "Anyaman kuat, tali sedikit kaku wajar karena baru."
  }];
  const createDummyFile = async (idx) => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 40%, 60%)`;
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = "white";
      ctx.font = "24px sans-serif";
      ctx.fillText(`Product Foto ${idx}`, 100, 200);
    }
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(new File([b], `dummy-${idx}.jpg`, {
        type: "image/jpeg"
      })));
    });
  };
  const autoFill = async () => {
    const d = DUMMY_PRODUCTS[Math.floor(Math.random() * DUMMY_PRODUCTS.length)];
    setProductName(d.name);
    setCategory(d.cat);
    setBatch(`B-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(Math.random() * 12 + 1)}-${Math.floor(Math.random() * 28 + 1)}`);
    setQc([DEFAULT_QC_OPTIONS[0], DEFAULT_QC_OPTIONS[1], DEFAULT_QC_OPTIONS[2]]);
    setNotes(d.notes);
    const f1 = await createDummyFile(1);
    const f2 = await createDummyFile(2);
    setImageFiles([f1, f2]);
    setPhotos([URL.createObjectURL(f1), URL.createObjectURL(f2)]);
    toast.success("Dummy data berhasil diisi otomatis!");
  };
  const onPickFiles = async (files) => {
    if (!files) return;
    const remaining = 5 - photos.length;
    if (remaining <= 0) {
      toast.error("Maksimal 5 foto");
      return;
    }
    const picked = Array.from(files).slice(0, remaining);
    const dataUrls = picked.map((f) => URL.createObjectURL(f));
    setPhotos((p) => [...p, ...dataUrls].slice(0, 5));
    setImageFiles((p) => [...p, ...picked].slice(0, 5));
  };
  const removePhoto = (i) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setImageFiles((p) => p.filter((_, idx) => idx !== i));
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) return toast.error("Nama produk wajib diisi");
    if (qc.length === 0) return toast.error("Pilih minimal 1 item QC");
    if (imageFiles.length < 1) return toast.error("Upload minimal 1 foto produk");
    if (!notes.trim()) return toast.error("Catatan QC wajib diisi");
    const formData = new FormData();
    formData.append("nama_produk", productName.trim());
    formData.append("kategori", category);
    if (batch) formData.append("batch", batch.trim());
    formData.append("checklist", JSON.stringify(qc));
    formData.append("catatan_penjual", notes.trim());
    imageFiles.forEach((f) => formData.append("images", f));
    try {
      toast.loading("Generating Trusted Label (AI Analysis)...", {
        id: "qc-submit"
      });
      const res = await apiFetch("/qc/submit", {
        method: "POST",
        body: formData
      });
      const url = `${window.location.origin}/scan/${res.product_id}`;
      const dataUrl = await libExports.toDataURL(url, {
        width: 512,
        margin: 2,
        color: {
          dark: "#0b1220",
          light: "#ffffff"
        }
      });
      setSavedTag({
        productName,
        batch: batch || "—",
        id: res.product_id
      });
      setQrUrl(dataUrl);
      toast.success("Trusted Label berhasil dibuat", {
        id: "qc-submit"
      });
    } catch (err) {
      toast.error(err.message || "Gagal membuat label", {
        id: "qc-submit"
      });
    }
  };
  const download = (format) => {
    if (!qrUrl || !savedTag) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `oziktag-${savedTag.productName.replace(/\s+/g, "-")}.${format}`;
    a.click();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-end justify-between gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Generate Trusted Label" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Isi form, klik generate, lalu cetak QR untuk ditempel di produk." })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-[1fr_400px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-4 rounded-xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: autoFill, className: "inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
          " Auto-Fill Dummy Data"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Nama Produk", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, value: productName, onChange: (e) => setProductName(e.target.value), className: inputCls, placeholder: "Contoh: Kopi Arabika Gayo 250g" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Kategori", children: /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), className: inputCls, children: CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c, children: c }, c)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "Kode Batch ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "(opsional)" })
        ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: batch, onChange: (e) => setBatch(e.target.value), className: inputCls, placeholder: "Contoh: B-2026-05-31" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-sm font-medium", children: "Checklist Quality Control" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: qcOptions.map((opt) => {
            const active = qc.includes(opt);
            const isCustom = !DEFAULT_QC_OPTIONS.includes(opt);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `group flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${active ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-input/30 text-muted-foreground hover:text-foreground"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => toggleQc(opt), className: "flex flex-1 items-center gap-2 text-left", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: `h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground/60"}` }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: opt })
              ] }),
              isCustom && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => removeQcOption(opt), className: "opacity-60 hover:opacity-100", "aria-label": "Hapus item", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }) })
            ] }, opt);
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: customQc, onChange: (e) => setCustomQc(e.target.value), onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomQc();
              }
            }, placeholder: "Tambah item QC custom (mis. Sudah dicek warna)", className: inputCls }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: addCustomQc, className: "inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20", "aria-label": "Tambah QC", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "Catatan QC / Hal yang Perlu Diperbaiki ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: "*" })
        ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { required: true, value: notes, onChange: (e) => setNotes(e.target.value), rows: 3, className: inputCls, placeholder: "Wajib diisi. Deskripsikan kondisi barang secara jujur, catatan ini akan diolah oleh AI untuk pembeli." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2 text-sm font-medium", children: [
            "Foto Produk ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: "*" }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-normal text-muted-foreground", children: [
              "(min 1, maks 5 — ",
              photos.length,
              "/5)"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 sm:grid-cols-5", children: [
            photos.map((src, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative aspect-square overflow-hidden rounded-md border border-border bg-input/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: `Foto ${i + 1}`, className: "h-full w-full object-cover" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => removePhoto(i), className: "absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground opacity-90 hover:bg-destructive hover:text-destructive-foreground", "aria-label": "Hapus foto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
            ] }, i)),
            photos.length < 5 && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-input/20 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "h-5 w-5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Upload" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: (e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              } })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "mt-2 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90", children: "Simpan QC & Generate QR (Biaya: 1 Kredit)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "rounded-xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Preview QR" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-background/40", children: qrUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: qrUrl, alt: "QR Code", className: "h-full w-full rounded-md object-contain p-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { className: "mx-auto mb-2 h-8 w-8 opacity-50" }),
          "Preview akan muncul di sini"
        ] }) }),
        savedTag && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground", children: savedTag.productName }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              "Batch: ",
              savedTag.batch || "—"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/scan/$id", params: {
              id: savedTag.id
            }, className: "mt-1 inline-block text-primary hover:underline", children: "Buka halaman scan →" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => download("png"), className: "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-sm font-medium hover:bg-secondary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
            " Download PNG"
          ] })
        ] })
      ] })
    ] })
  ] });
}
const inputCls = "w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-sm font-medium", children: label }),
    children
  ] });
}
export {
  Generator as component
};
