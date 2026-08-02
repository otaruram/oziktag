import { X, Copy, Trash2, Loader2, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

interface DeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function TrackingDeleteModal({ onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <Trash2 className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Hapus Riwayat?</h3>
        <p className="text-sm text-muted-foreground mb-6">Tautan Tracking untuk pembeli akan tetap aktif selamanya. Ini hanya menyembunyikan produk dari dashboard Anda.</p>
        <div className="flex gap-3 w-full">
          <button onClick={onCancel} className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-medium hover:bg-secondary transition-colors">Batal</button>
          <button onClick={onConfirm} className="flex-1 rounded-md bg-destructive py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm">Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}


interface ProductModalProps {
  product: any;
  qrDataUrl: string | null;
  onClose: () => void;
}

export function TrackingProductModal({ product, qrDataUrl, onClose }: ProductModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h3 className="text-xl font-bold mb-6 text-center">{product.name}</h3>
        
        <div className="space-y-6 text-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="mx-auto w-48 h-48 rounded-lg border border-border" />
          ) : (
            <div className="w-48 h-48 mx-auto flex items-center justify-center bg-muted rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          
          <div className="mx-auto max-w-xs rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
            <p className="text-sm text-orange-600 font-medium mb-1">PIN Rahasia Pembeli</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold tracking-[0.2em]">{product.buyer_pin || "000000"}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(product.buyer_pin || "000000"); toast.success("PIN disalin!"); }}
                className="text-orange-600 hover:text-orange-700 p-1"
                title="Salin PIN"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm bg-muted p-3 rounded-lg">
            <span className="text-muted-foreground truncate flex-1 text-left text-xs">
              {`${window.location.origin}/tracking/${product.id}`}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tracking/${product.id}`); toast.success("URL disalin!"); }}
              className="text-primary hover:opacity-80 flex-shrink-0"
              title="Salin URL"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <div className="pt-2">
            <Link
              to={`/tracking/${product.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              Buka Halaman Tracking <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
