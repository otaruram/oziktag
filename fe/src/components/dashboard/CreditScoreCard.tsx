import { useState } from "react";
import { TrendingUp, FileDown } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export function CreditScoreCard({ score }: { score: number }) {
  const [downloading, setDownloading] = useState(false);
  const maxScore = 850;
  const pct = Math.min((score / maxScore) * 100, 100);

  const getRating = (s: number) => {
    if (s >= 750) return "Sangat Baik";
    if (s >= 600) return "Baik";
    if (s >= 450) return "Sedang";
    return "Perlu Perbaikan";
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const data = await apiFetch("/qc/credit-report");
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Laporan Analis Kredit", 20, 25);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Digenerate oleh Oziktag", 20, 32);
      pdf.text(new Date(data.generated_at).toLocaleString("id-ID"), 20, 37);

      // Separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 42, 190, 42);

      // Brand info
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`UMKM: ${data.brand_name}`, 20, 52);
      pdf.setFontSize(10);
      pdf.text(`Email: ${data.email}`, 20, 58);
      if (data.is_elite) pdf.text("Status: Artisan Elite ★", 20, 64);

      // Credit Score
      pdf.setFontSize(14);
      pdf.text(`Skor Kredit: ${data.credit_score}/850 — ${data.rating}`, 20, 76);

      // Metrics
      pdf.setFontSize(10);
      const metrics = [
        ["Total Produk QC", data.total_products.toString()],
        ["Total Scan Pembeli", data.total_scans.toString()],
        ["Total Revenue", `Rp ${data.total_revenue.toLocaleString("id-ID")}`],
        ["Total Biaya Produksi", `Rp ${data.total_cost.toLocaleString("id-ID")}`],
        ["Profit", `Rp ${data.profit.toLocaleString("id-ID")}`],
        ["Margin Rata-rata", `${data.margin_percent}%`],
      ];

      let y = 88;
      metrics.forEach(([label, value]) => {
        pdf.setTextColor(100, 100, 100);
        pdf.text(label, 20, y);
        pdf.setTextColor(15, 23, 42);
        pdf.text(value, 120, y);
        y += 7;
      });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Laporan ini digenerate otomatis oleh sistem Oziktag. Data finansial bersifat rahasia.", 20, 280);

      pdf.save(`laporan-kredit-${data.brand_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
      toast.success("Laporan berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh laporan");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Skor Kredit</p>
        <TrendingUp className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {score}<span className="text-base font-normal text-muted-foreground">/850</span>
      </p>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{getRating(score)}</span>
        <button
          onClick={downloadReport}
          disabled={downloading}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
        >
          <FileDown className="h-3 w-3" />
          {downloading ? "..." : "Unduh Laporan"}
        </button>
      </div>
    </div>
  );
}
