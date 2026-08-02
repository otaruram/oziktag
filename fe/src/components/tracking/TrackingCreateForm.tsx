import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { generateHDTrackingLabel } from "@/lib/qr";
import { EscrowRequestForm } from "@/components/escrow/EscrowRequestForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TrackingCreateFormProps {
  onSuccess: (qrResult: any) => void;
  onCancel: () => void;
}

const DEFAULT_CHECKS = [
  "Produk sudah diperiksa kondisinya",
  "Kemasan rapi dan aman",
  "Label dan segel utuh",
  "Jumlah sesuai pesanan",
  "Foto kondisi produk sudah diambil",
];

export function TrackingCreateForm({ onSuccess, onCancel }: TrackingCreateFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [customCheck, setCustomCheck] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [isEscrow, setIsEscrow] = useState(false);
  const [price, setPrice] = useState<number | "">("");

  const { data: user } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const data = await apiFetch('/auth/me');
      return data;
    },
  });

  const [showEscrowForm, setShowEscrowForm] = useState(false);

  const toggleCheck = (item: string) => {
    setChecklist((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const addCustomCheck = () => {
    if (customCheck.trim() && !checklist.includes(customCheck.trim())) {
      setChecklist((prev) => [...prev, customCheck.trim()]);
      setCustomCheck("");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nama produk wajib diisi");
    if (checklist.length === 0) return toast.error("Pilih minimal 1 checklist");
    if (!imageFile) return toast.error("Foto produk wajib di-upload");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("checklist_qc", JSON.stringify(checklist));
      formData.append("seller_notes", notes.trim());
      if (imageFile) formData.append("image", imageFile);
      
      if (isEscrow && price) {
        formData.append("is_escrow", "true");
        formData.append("price", price.toString());
      }

      const res = await apiFetch("/tracking/init", {
        method: "POST",
        body: formData,
      });

      const trackingUrl = `${window.location.origin}/tracking/${res.product_id}`;
      const qrDataUrl = await generateHDTrackingLabel(trackingUrl, res.product.name, res.product.id);

      onSuccess({
        url: trackingUrl,
        qrDataUrl,
        summary: res.ai_summary || "",
        buyerPin: res.buyer_pin || "000000",
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat tracking");
    } finally {
      setSubmitting(false);
    }
  };

  const autoFill = async () => {
    setName("Kopi Gayo Premium 250gr (Tracking)");
    setChecklist([DEFAULT_CHECKS[0], DEFAULT_CHECKS[1], DEFAULT_CHECKS[2]]);
    setNotes("Tolong jangan dibanting ya mas kurir, kemasan rentan bocor. Pastikan disimpan di tempat kering.");
    
    // Create dummy image file
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = "white";
      ctx.font = "24px sans-serif";
      ctx.fillText("Foto Kopi Gayo", 110, 200);
    }
    const file = await new Promise<File>((resolve) => {
      canvas.toBlob((b) => resolve(new File([b!], `kopi-gayo.jpg`, { type: "image/jpeg" })));
    });

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    toast.success("Dummy data tracking diisi otomatis!");
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
          toast.success("Gambar berhasil dipaste!");
          e.preventDefault();
          break;
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Buat Tracking Produk Baru</h2>
        <button
          type="button"
          onClick={autoFill}
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
        >
          <Sparkles className="h-3.5 w-3.5" /> Auto-Fill Dummy Data
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Nama Produk</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Contoh: Kopi Arabika Gayo 250gr"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Checklist QC</label>
        <div className="space-y-2">
          {DEFAULT_CHECKS.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.includes(item)}
                onChange={() => toggleCheck(item)}
                className="accent-primary"
              />
              {item}
            </label>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={customCheck}
            onChange={(e) => setCustomCheck(e.target.value)}
            className="flex-1 rounded-md border border-border bg-input/40 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            placeholder="Tambah checklist kustom..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCheck())}
          />
          <button type="button" onClick={addCustomCheck} className="text-xs text-primary font-medium px-3">
            Tambah
          </button>
        </div>
      </div>
      
      {(user?.is_admin || user?.can_use_escrow) ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isEscrow}
              onChange={(e) => setIsEscrow(e.target.checked)}
              className="h-5 w-5 rounded border-primary accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-primary">Aktifkan Pembayaran Aman (Escrow) [BETA]</p>
              <p className="text-xs text-muted-foreground">Pembeli bayar via link, dana cair setelah barang diterima.</p>
            </div>
          </label>
          
          {isEscrow && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Harga Barang (Rp)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Contoh: 150000"
                required={isEscrow}
                min={10000}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Biaya transaksi 1.5% + Rp 1.000 akan dipotong otomatis.
              </p>
            </div>
          )}
        </div>
      ) : user?.escrow_request_status === "pending" ? (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-start gap-3">
          <div className="mt-0.5"><Sparkles className="h-5 w-5 text-yellow-600" /></div>
          <div>
            <p className="text-sm font-semibold text-yellow-600">Pengajuan Escrow Sedang Direview</p>
            <p className="text-xs text-muted-foreground mt-1">Kami sedang meninjau akun Anda untuk mendapatkan akses pembayaran Escrow. Harap tunggu.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Aktifkan Pembayaran Aman (Escrow) [BETA]</p>
            <p className="text-xs text-muted-foreground mt-1">Gunakan link Tracking ini sebagai payment link yang aman untuk pembeli.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowEscrowForm(true)}
            className="shrink-0 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20"
          >
            Ajukan Akses
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Catatan Penjual</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Kondisi barang, tips penyimpanan, dll..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Foto Produk <span className="text-destructive">*</span></label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required={!imageFile}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          <p className="text-xs text-muted-foreground mt-1">Atau cukup paste (Ctrl+V) gambar di mana saja di area form ini.</p>
        </div>
        {imagePreview && (
          <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 rounded-lg object-cover border border-border" />
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Membuat..." : "Buat & Generate QR"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2.5 text-sm hover:bg-muted">
          Batal
        </button>
      </div>

      <Dialog open={showEscrowForm} onOpenChange={setShowEscrowForm}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Akses Pembayaran Aman (Escrow)</DialogTitle>
            <DialogDescription>
              Silakan lengkapi form berikut untuk mengajukan akses fitur pembayaran aman Escrow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <EscrowRequestForm onSuccess={() => setShowEscrowForm(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
