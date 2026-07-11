import { QrCode as QrIcon, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export function GeneratorSidebar({
  qrUrl,
  savedTag,
}: {
  qrUrl: string | null;
  savedTag: any;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);

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
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" /> PNG
            </button>
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            >
              {pdfLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}{" "}
              PDF
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
