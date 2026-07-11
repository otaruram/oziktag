import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import * as QRCode from "qrcode";
import { Download, CheckCircle2, QrCode as QrIcon, Sparkles, Coins, Plus, X, ImagePlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getBrand, getCredits, type Qrtag } from "@/lib/oziktag-store";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/generator")({
  head: () => ({ meta: [{ title: "Generate QR — Oziktag" }] }),
  component: Generator,
});

const DEFAULT_QC_OPTIONS = [
  "Kondisi fisik baik",
  "Sesuai standar kualitas",
  "Kemasan tersegel",
  "Lulus uji kebersihan",
];

const CATEGORIES = [
  "Makanan & Minuman",
  "Fashion",
  "Kerajinan — Anyaman",
  "Kerajinan — Kayu",
  "Kerajinan — Keramik",
  "Kerajinan — Lainnya",
  "Kecantikan",
  "Lainnya",
];

/** Generate QR Code with Oziktag ShieldCheck logo baked into center */
async function generateQrWithLogo(url: string, size = 512): Promise<string> {
  const qrUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: { dark: "#0b1220", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });

  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const logoR = size * 0.11;

      // White ring
      ctx.beginPath();
      ctx.arc(cx, cy, logoR + 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Grey border
      ctx.beginPath();
      ctx.arc(cx, cy, logoR + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Black badge
      ctx.beginPath();
      ctx.arc(cx, cy, logoR, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();

      // ShieldCheck icon (lucide, viewBox 24×24)
      const iconPx = logoR * 1.28;
      const sc = iconPx / 24;
      ctx.save();
      ctx.translate(cx - iconPx / 2, cy - iconPx / 2);
      ctx.scale(sc, sc);

      const shieldPath = new Path2D(
        "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      );
      ctx.fillStyle = "#ffffff";
      ctx.fill(shieldPath);

      const checkPath = new Path2D("M9 12l2 2 4-4");
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.2 / sc;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(checkPath);

      ctx.restore();
      resolve(canvas.toDataURL("image/png"));
    };
    qrImg.src = qrUrl;
  });
}


function Generator() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [batch, setBatch] = useState("");
  const [qcOptions, setQcOptions] = useState<string[]>(DEFAULT_QC_OPTIONS);
  const [qc, setQc] = useState<string[]>([DEFAULT_QC_OPTIONS[0], DEFAULT_QC_OPTIONS[1]]);
  const [customQc, setCustomQc] = useState("");
  const [notes, setNotes] = useState("");
  const [hargaProduksi, setHargaProduksi] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [savedTag, setSavedTag] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [credits, setCreditsState] = useState<number>(() => (typeof window === "undefined" ? 0 : getCredits()));

  const toggleQc = (item: string) =>
    setQc((arr) => (arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]));

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

  const removeQcOption = (item: string) => {
    setQcOptions((arr) => arr.filter((x) => x !== item));
    setQc((arr) => arr.filter((x) => x !== item));
  };

  const DUMMY_PRODUCTS = [
    { name: "Kopi Arabika Gayo Premium 250g", cat: "Makanan & Minuman", notes: "Ada sedikit goresan di kemasan, isi aman 100%." },
    { name: "Batik Tulis Lengan Panjang M", cat: "Fashion", notes: "Jahitan rapi, warna sesuai standar, tidak luntur." },
    { name: "Sambal Bawang Ekstra Pedas", cat: "Makanan & Minuman", notes: "Segel botol utuh, expired date jelas." },
    { name: "Serum Vitamin C Wajah 15ml", cat: "Kecantikan", notes: "Botol tidak bocor, tekstur gel sesuai QC." },
    { name: "Kerajinan Tas Rotan Bali", cat: "Kerajinan", notes: "Anyaman kuat, tali sedikit kaku wajar karena baru." },
  ];

  const createDummyFile = async (idx: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 40%, 60%)`;
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = "white";
      ctx.font = "24px sans-serif";
      ctx.fillText(`Product Foto ${idx}`, 100, 200);
    }
    return new Promise<File>((resolve) => {
      canvas.toBlob((b) => resolve(new File([b!], `dummy-${idx}.jpg`, { type: "image/jpeg" })));
    });
  };

  const autoFill = async () => {
    const d = DUMMY_PRODUCTS[Math.floor(Math.random() * DUMMY_PRODUCTS.length)];
    setProductName(d.name);
    setCategory(d.cat);
    setBatch(`B-${new Date().getFullYear()}-${Math.floor(Math.random() * 12 + 1)}-${Math.floor(Math.random() * 28 + 1)}`);
    setQc([DEFAULT_QC_OPTIONS[0], DEFAULT_QC_OPTIONS[1], DEFAULT_QC_OPTIONS[2]]);
    setNotes(d.notes);
    
    const f1 = await createDummyFile(1);
    const f2 = await createDummyFile(2);
    setImageFiles([f1, f2]);
    setPhotos([URL.createObjectURL(f1), URL.createObjectURL(f2)]);
    
    toast.success("Dummy data berhasil diisi otomatis!");
  };

  const onPickFiles = async (files: FileList | null) => {
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

  const removePhoto = (i: number) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setImageFiles((p) => p.filter((_, idx) => idx !== i));
  };

  const submit = async (e: React.FormEvent) => {
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
    if (hargaProduksi) formData.append("harga_produksi", hargaProduksi);
    if (hargaJual) formData.append("harga_jual", hargaJual);
    imageFiles.forEach((f) => formData.append("images", f));

    try {
      toast.loading("Generating Trusted Label (AI Analysis)...", { id: "qc-submit" });
      const res = await apiFetch("/qc/submit", {
        method: "POST",
        body: formData,
      });

      const scanUrl = `${window.location.origin}/scan/${res.product_id}`;
      const dataUrl = await generateQrWithLogo(scanUrl, 512);
      setSavedTag({ productName, batch: batch || "—", id: res.product_id, scanUrl });
      setQrUrl(dataUrl);
      toast.success("Trusted Label berhasil dibuat", { id: "qc-submit" });
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat label", { id: "qc-submit" });
    }
  };

  const downloadPng = () => {
    if (!qrUrl || !savedTag) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `oziktag-${savedTag.productName.replace(/\s+/g, "-")}.png`;
    a.click();
    toast.success("QR Code diunduh sebagai PNG");
  };

  const downloadPdf = async () => {
    if (!qrUrl || !savedTag) return;
    setPdfLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const slug = savedTag.productName.replace(/\s+/g, "-").toLowerCase();
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 100] });
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 80, 100, "F");
      pdf.addImage(qrUrl, "PNG", 10, 8, 60, 60);
      pdf.setFontSize(9);
      pdf.setTextColor(40, 40, 40);
      const lines = pdf.splitTextToSize(savedTag.productName, 60) as string[];
      pdf.text(lines, 40, 74, { align: "center" });
      pdf.setFontSize(6.5);
      pdf.setTextColor(120, 120, 120);
      pdf.text("Verified by Oziktag", 40, 82, { align: "center" });
      pdf.text(savedTag.scanUrl || "", 40, 86, { align: "center" });
      pdf.save(`oziktag-${slug}.pdf`);
      toast.success("QR Code diunduh sebagai PDF");
    } catch {
      toast.error("Gagal membuat PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Generate Trusted Label</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Isi form, klik generate, lalu cetak QR untuk ditempel di produk.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={autoFill}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <Sparkles className="h-3.5 w-3.5" /> Auto-Fill Dummy Data
            </button>
          </div>
          <Field label="Nama Produk">
            <input
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className={inputCls}
              placeholder="Contoh: Kopi Arabika Gayo 250g"
            />
          </Field>
          <Field label="Kategori">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label={<>Kode Batch <span className="text-muted-foreground">(opsional)</span></>}>
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className={inputCls}
              placeholder="Contoh: B-2026-05-31"
            />
          </Field>

          {/* Data Finansial (Opsional & Rahasia) */}
          <div className="rounded-lg border border-dashed border-border bg-background/40 p-4">
            <p className="mb-1 text-sm font-medium">Data Finansial <span className="text-muted-foreground font-normal">(Opsional &amp; Rahasia)</span></p>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Opsional. Data ini rahasia dan hanya digunakan untuk menghitung Skor Kesehatan Bisnis Anda.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Harga Produksi (Rp)</span>
                <input
                  type="number"
                  min="0"
                  value={hargaProduksi}
                  onChange={(e) => setHargaProduksi(e.target.value)}
                  className={inputCls}
                  placeholder="Contoh: 25000"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Harga Jual (Rp)</span>
                <input
                  type="number"
                  min="0"
                  value={hargaJual}
                  onChange={(e) => setHargaJual(e.target.value)}
                  className={inputCls}
                  placeholder="Contoh: 50000"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Checklist Quality Control</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {qcOptions.map((opt) => {
                const active = qc.includes(opt);
                const isCustom = !DEFAULT_QC_OPTIONS.includes(opt);
                return (
                  <div
                    key={opt}
                    className={`group flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border bg-input/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleQc(opt)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground/60"}`}
                      />
                      <span>{opt}</span>
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => removeQcOption(opt)}
                        className="opacity-60 hover:opacity-100"
                        aria-label="Hapus item"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={customQc}
                onChange={(e) => setCustomQc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomQc();
                  }
                }}
                placeholder="Tambah item QC custom (mis. Sudah dicek warna)"
                className={inputCls}
              />
              <button
                type="button"
                onClick={addCustomQc}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20"
                aria-label="Tambah QC"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Field label={<>Catatan QC / Hal yang Perlu Diperbaiki <span className="text-destructive">*</span></>}>
            <textarea
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Wajib diisi. Deskripsikan kondisi barang secara jujur, catatan ini akan diolah oleh AI untuk pembeli."
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium">
              Foto Produk <span className="text-destructive">*</span>{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (min 1, maks 5 — {photos.length}/5)
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((src, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-md border border-border bg-input/30"
                >
                  <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground opacity-90 hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="Hapus foto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-input/20 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary">
                  <ImagePlus className="h-5 w-5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      onPickFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90"
          >
            Simpan QC & Generate QR (Biaya: 1 Kredit)
          </button>
        </form>

        <aside className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preview QR
          </p>
          <div className="mt-4 flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-background/40">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="h-full w-full rounded-md object-contain p-4" />
            ) : (
              <div className="text-center text-xs text-muted-foreground">
                <QrIcon className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Preview akan muncul di sini
              </div>
            )}
          </div>
          {savedTag && (
            <>
              <div className="mt-4 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{savedTag.productName}</p>
                <p>Batch: {savedTag.batch || "—"}</p>
                <Link
                  to="/scan/$id"
                  params={{ id: savedTag.id }}
                  className="mt-1 inline-block text-primary hover:underline"
                >
                  Buka halaman scan →
                </Link>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={downloadPng}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Download className="h-4 w-4" /> PNG
                </button>
                <button
                  onClick={downloadPdf}
                  disabled={pdfLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  {pdfLoading
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    : <Download className="h-4 w-4" />} PDF
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}