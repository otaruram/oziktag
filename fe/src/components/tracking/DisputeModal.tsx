import { useState } from "react";
import { AlertCircle, X, ShieldAlert, Video } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface DisputeModalProps {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisputeModal({ productId, onClose, onSuccess }: DisputeModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    buyer_email: "",
    buyer_phone: "",
    reason: "",
    video_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.video_url.includes("http")) {
      return toast.error("Link video harus berupa URL valid (http/https)");
    }

    setLoading(true);
    try {
      await apiFetch(`/tracking/${productId}/dispute`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Sengketa berhasil diajukan! Tim kami akan segera meninjau.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengajukan sengketa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        
        <h2 className="text-xl font-bold text-center mb-2">Ajukan Sengketa</h2>
        <p className="text-sm text-center text-muted-foreground mb-6">
          Pesanan tidak sesuai atau berisi barang lain? Ajukan pengembalian sebelum dana dicairkan ke penjual.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Email Anda <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              required
              value={form.buyer_email}
              onChange={(e) => setForm({ ...form, buyer_email: e.target.value })}
              className="w-full rounded-xl border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" 
              placeholder="email@anda.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Nomor WhatsApp</label>
            <input 
              type="tel" 
              value={form.buyer_phone}
              onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })}
              className="w-full rounded-xl border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" 
              placeholder="0812xxxxxx"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Alasan Sengketa <span className="text-red-500">*</span></label>
            <textarea 
              required
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full rounded-xl border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none" 
              placeholder="Contoh: Barang yang datang isinya batu..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground flex items-center gap-1">
              <Video className="h-4 w-4" /> Link Video Unboxing <span className="text-red-500">*</span>
            </label>
            <input 
              type="url" 
              required
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              className="w-full rounded-xl border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" 
              placeholder="https://youtube.com/... atau GDrive"
            />
            <p className="text-xs text-muted-foreground mt-1">Upload video ke YouTube / Google Drive dan paste linknya di sini.</p>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full rounded-xl bg-red-600 py-3 font-bold text-white shadow-lg shadow-red-500/25 hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Memproses..." : "Kirim Pengajuan Sengketa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
