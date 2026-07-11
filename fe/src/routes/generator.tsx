import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { generateQrWithLogo } from "@/lib/qr";
import { toast } from "sonner";
import { CATEGORIES, DEFAULT_QC_OPTIONS, DUMMY_PRODUCTS } from "@/components/generator/GeneratorConstants";
import { QcChecklist } from "@/components/generator/QcChecklist";
import { ImageUploader } from "@/components/generator/ImageUploader";
import { GeneratorSidebar } from "@/components/generator/GeneratorSidebar";

export const Route = createFileRoute("/generator")({
  head: () => ({ meta: [{ title: "Generate QR — Oziktag" }] }),
  component: Generator,
});

function Generator() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [batch, setBatch] = useState("");
  const [qcOptions, setQcOptions] = useState<string[]>(DEFAULT_QC_OPTIONS);
  const [qc, setQc] = useState<string[]>([DEFAULT_QC_OPTIONS[0], DEFAULT_QC_OPTIONS[1]]);
  const [notes, setNotes] = useState("");
  const [hargaProduksi, setHargaProduksi] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [savedTag, setSavedTag] = useState<any>(null);

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

          {/* Data Finansial */}
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

          <QcChecklist
            qc={qc}
            setQc={setQc}
            qcOptions={qcOptions}
            setQcOptions={setQcOptions}
          />

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

          <ImageUploader
            photos={photos}
            setPhotos={setPhotos}
            imageFiles={imageFiles}
            setImageFiles={setImageFiles}
          />

          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90"
          >
            Simpan QC & Generate QR (Biaya: 1 Kredit)
          </button>
        </form>

        <GeneratorSidebar qrUrl={qrUrl} savedTag={savedTag} />
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