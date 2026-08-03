import { useState } from "react";
import { X, Copy, Trash2, Loader2, ArrowRight, Download } from "lucide-react";
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
  paymentQrDataUrl?: string | null;
  onClose: () => void;
}

export function TrackingProductModal({ product, qrDataUrl, paymentQrDataUrl, onClose }: ProductModalProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"payment" | "tracking">("payment");
  const scanUrl = `${window.location.origin}/tracking/${product.id}`;
  const slug = product.name ? product.name.replace(/\s+/g, "-").toLowerCase() : "tracking";

  const currentQr = paymentQrDataUrl && activeTab === "payment" ? paymentQrDataUrl : qrDataUrl;

  const downloadPng = () => {
    if (!currentQr) return;
    const a = document.createElement("a");
    a.href = currentQr;
    a.download = `qr-${activeTab}-${slug}.png`;
    a.click();
    toast.success("QR Code diunduh sebagai PNG");
  };

  const downloadPdf = async () => {
    if (!currentQr) return;
    setPdfLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 100] });
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 80, 100, "F");
      pdf.addImage(currentQr, "PNG", 0, 0, 80, 100);
      pdf.save(`qr-${activeTab}-${slug}.pdf`);
      toast.success("QR Code diunduh sebagai PDF (HD)");
    } catch {
      toast.error("Gagal membuat PDF");
    } finally {
      setPdfLoading(false);
    }
  };

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
          {paymentQrDataUrl && (
            <div className="flex bg-muted p-1 rounded-lg max-w-sm mx-auto mb-4">
              <button
                onClick={() => setActiveTab("payment")}
                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "payment" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Link Pembayaran
              </button>
              <button
                onClick={() => setActiveTab("tracking")}
                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "tracking" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Label Kardus
              </button>
            </div>
          )}

          {currentQr ? (
            <div className="flex flex-col items-center">
              {paymentQrDataUrl && activeTab === "payment" && (
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed max-w-xs">
                  Kirimkan gambar/link ini ke pembeli. Pembeli akan melihat <strong>Halaman Tagihan</strong> saat membuka QR ini.
                </p>
              )}
              {paymentQrDataUrl && activeTab === "tracking" && (
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed max-w-xs">
                  Cetak QR ini dan tempel di paket. Pembeli akan butuh ini untuk konfirmasi penerimaan (memasukkan PIN).
                </p>
              )}
              <img src={currentQr} alt="QR Code" className="mx-auto w-48 h-48 rounded-lg border border-border" />
              <div className="mt-4 flex gap-2 w-full justify-center">
                <button
                  onClick={downloadPng}
                  title="Unduh PNG"
                  className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Download className="h-3.5 w-3.5" /> PNG
                </button>
                <button
                  onClick={downloadPdf}
                  disabled={pdfLoading}
                  title="Unduh PDF"
                  className="flex items-center justify-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PDF
                </button>
              </div>
            </div>
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
          
          <div className="flex items-center justify-center gap-2 text-sm bg-muted p-3 rounded-lg flex-col">
            <span className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider self-start mb-1">
              {activeTab === "payment" && paymentQrDataUrl ? "Link Pembayaran" : "Link Tracking"}
            </span>
            <div className="flex w-full items-center gap-2">
              <span className="text-muted-foreground truncate flex-1 text-left text-xs">
                {activeTab === "payment" && paymentQrDataUrl ? product.payment_url : scanUrl}
              </span>
              <button
                onClick={() => { 
                  const textToCopy = activeTab === "payment" && paymentQrDataUrl ? product.payment_url : scanUrl;
                  navigator.clipboard.writeText(textToCopy); 
                  toast.success("URL disalin!"); 
                }}
                className="text-primary hover:opacity-80 flex-shrink-0"
                title="Salin URL"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/tracking/$id"
              params={{ id: product.id }}
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
