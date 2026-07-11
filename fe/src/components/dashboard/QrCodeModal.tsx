import { useState, useEffect } from "react";
import { QrCode, X, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateQrWithLogo } from "@/lib/qr";

export function QrCodeModal({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const scanUrl = `${window.location.origin}/scan/${id}`;
  const slug = name.replace(/\s+/g, "-").toLowerCase();

  useEffect(() => {
    generateQrWithLogo(scanUrl, 400).then(setDataUrl);
  }, [scanUrl]);

  const downloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${slug}.png`;
    a.click();
    toast.success("QR Code diunduh sebagai PNG");
  };

  const downloadPdf = async () => {
    if (!dataUrl) return;
    setPdfLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 100] });
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 80, 100, "F");
      pdf.addImage(dataUrl, "PNG", 10, 8, 60, 60);
      pdf.setFontSize(9);
      pdf.setTextColor(40, 40, 40);
      const lines = pdf.splitTextToSize(name, 60) as string[];
      pdf.text(lines, 40, 74, { align: "center" });
      pdf.setFontSize(6.5);
      pdf.setTextColor(120, 120, 120);
      pdf.text("Verified by Oziktag", 40, 82, { align: "center" });
      pdf.text(scanUrl, 40, 86, { align: "center" });
      pdf.save(`qr-${slug}.pdf`);
      toast.success("QR Code diunduh sebagai PDF");
    } catch {
      toast.error("Gagal membuat PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <QrCode className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">QR Code</p>
              <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* QR Image */}
        <div className="flex flex-col items-center">
          {dataUrl ? (
            <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
              <img src={dataUrl} alt="QR Code" className="w-56 h-56 object-contain" />
            </div>
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-border bg-secondary/30">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <p className="mt-3 text-[10px] text-muted-foreground font-mono text-center break-all px-2">{scanUrl}</p>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          {/* Unduh PNG */}
          <button
            onClick={downloadPng}
            disabled={!dataUrl}
            title="Unduh PNG"
            className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Download className="h-4 w-4" />
            PNG
          </button>

          {/* Unduh PDF */}
          <button
            onClick={downloadPdf}
            disabled={!dataUrl || pdfLoading}
            title="Unduh PDF"
            className="flex items-center justify-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </button>

          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-border bg-background py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
