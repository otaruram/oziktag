import { useState } from "react";
import { CheckCircle2, Copy, Sparkles, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TrackingResultProps {
  qrResult: { url: string; qrDataUrl: string; summary: string; buyerPin: string };
  onClose: () => void;
}

export function TrackingResult({ qrResult, onClose }: TrackingResultProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const slug = "tracking"; // Could be more specific if product name was passed

  const downloadPng = () => {
    if (!qrResult.qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrResult.qrDataUrl;
    a.download = `qr-${slug}.png`;
    a.click();
    toast.success("QR Code diunduh sebagai PNG");
  };

  const downloadPdf = async () => {
    if (!qrResult.qrDataUrl) return;
    setPdfLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 100] });
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 80, 100, "F");
      pdf.addImage(qrResult.qrDataUrl, "PNG", 10, 8, 60, 60);
      pdf.setFontSize(9);
      pdf.setTextColor(40, 40, 40);
      pdf.text("Tracking QR", 40, 74, { align: "center" });
      pdf.setFontSize(6.5);
      pdf.setTextColor(120, 120, 120);
      pdf.text("Verified by Oziktag", 40, 82, { align: "center" });
      pdf.text(qrResult.url, 40, 86, { align: "center" });
      pdf.save(`qr-${slug}.pdf`);
      toast.success("QR Code diunduh sebagai PDF");
    } catch {
      toast.error("Gagal membuat PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="text-center space-y-4">
      <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
      <h2 className="text-xl font-semibold">Tracking Berhasil Dibuat!</h2>
      <div className="mx-auto max-w-xs flex flex-col items-center">
        <img src={qrResult.qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-lg border border-border" />
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

      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground truncate max-w-xs">{qrResult.url}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(qrResult.url); toast.success("URL disalin!"); }}
          className="text-primary hover:opacity-80"
          title="Salin URL"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      
      {qrResult.summary && (
        <div className="mx-auto max-w-md rounded-lg bg-primary/5 border border-primary/20 p-4 text-left">
          <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI Summary
          </p>
          <p className="text-sm text-muted-foreground">{qrResult.summary}</p>
        </div>
      )}
      
      <button onClick={onClose} className="text-sm text-primary hover:underline">
        Tutup
      </button>
    </div>
  );
}
