import { useState } from "react";
import { CheckCircle2, Copy, Sparkles, Download, Loader2, Receipt, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface TrackingResultProps {
  qrResult: { url: string; qrDataUrl: string; qrDataUrlPayment?: string; summary: string; buyerPin: string; isEscrow?: boolean };
  onClose: () => void;
}

export function TrackingResult({ qrResult, onClose }: TrackingResultProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"payment" | "tracking">(qrResult.isEscrow ? "payment" : "tracking");
  const slug = "tracking";

  const currentQr = activeTab === "payment" && qrResult.qrDataUrlPayment ? qrResult.qrDataUrlPayment : qrResult.qrDataUrl;
  
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
    <div className="text-center space-y-4">
      <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
      <h2 className="text-xl font-semibold">Berhasil Dibuat!</h2>
      
      {qrResult.isEscrow && (
        <div className="flex bg-muted p-1 rounded-lg max-w-sm mx-auto">
          <button
            onClick={() => setActiveTab("payment")}
            className={cn("flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors", activeTab === "payment" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Receipt className="h-4 w-4" /> Link Pembayaran
          </button>
          <button
            onClick={() => setActiveTab("tracking")}
            className={cn("flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors", activeTab === "tracking" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <MapPin className="h-4 w-4" /> Label Kardus
          </button>
        </div>
      )}

      <div className="mx-auto max-w-xs flex flex-col items-center">
        {qrResult.isEscrow && activeTab === "payment" && (
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Kirimkan gambar/link ini ke pembeli. Pembeli akan melihat <strong>Halaman Tagihan</strong> saat membuka QR ini.
          </p>
        )}
        {qrResult.isEscrow && activeTab === "tracking" && (
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Cetak QR ini dan tempel di paket. Pembeli akan butuh ini untuk konfirmasi penerimaan (memasukkan PIN).
          </p>
        )}

        <img src={currentQr} alt="QR Code" className="w-48 h-48 rounded-lg border border-border shadow-sm" />
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
      
      <div className="mx-auto max-w-xs rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
        <p className="text-sm text-orange-600 font-medium mb-1">PIN Rahasia Pembeli</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl font-bold tracking-[0.2em]">{qrResult.buyerPin}</span>
          <button 
            onClick={() => { navigator.clipboard.writeText(qrResult.buyerPin); toast.success("PIN disalin!"); }}
            className="text-orange-600 hover:text-orange-700 p-1"
            title="Salin PIN"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-orange-600/80 mt-2">Berikan PIN ini kepada pembeli agar mereka bisa mengkonfirmasi pesanan.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 text-sm bg-muted/50 py-3 rounded-lg max-w-sm mx-auto border border-border/50">
        <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Link Resmi</span>
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium truncate max-w-[200px]">{qrResult.url}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(qrResult.url); toast.success("URL disalin!"); }}
            className="text-primary hover:opacity-80 p-1 bg-white rounded shadow-sm border border-border"
            title="Salin URL"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {qrResult.summary && (
        <div className="mx-auto max-w-md rounded-lg bg-primary/5 border border-primary/20 p-4 text-left">
          <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI Summary
          </p>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                h1: ({node, ...props}) => <h3 className="font-bold text-foreground mb-2 mt-4 text-base" {...props} />,
                h2: ({node, ...props}) => <h4 className="font-semibold text-foreground mb-1 mt-3" {...props} />
              }}
            >
              {(() => {
                let text = qrResult.summary;
                text = text.replace(/\\n/g, '\n');
                text = text.replace(/([^\n])\n(#{1,3}\s)/g, '$1\n\n$2');
                text = text.replace(/([^\n])\n(-{3,})/g, '$1\n\n$2');
                text = text.replace(/([^\n])\n(- )/g, '$1\n\n$2');
                text = text.replace(/([^\n])(#{1,3}\s)/g, '$1\n\n$2');
                text = text.replace(/([^\n])(-{3,})/g, '$1\n\n$2');
                text = text.replace(/([^\n])(- [✅⚠️❌🚚📦☕🌡️⏰🏠📋🔍💡📌🛡️📞🔒✉️📸🎥💰🔧📝🏷️📊🎯💬📢🔔💊🧴🧊🍳🧈])/g, '$1\n\n$2');
                text = text.replace(/([^\n])(- \*\*)/g, '$1\n\n$2');
                return text;
              })()}
            </ReactMarkdown>
          </div>
        </div>
      )}
      
      <button onClick={onClose} className="mx-auto block rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors mt-6">
        Tutup
      </button>
    </div>
  );
}
