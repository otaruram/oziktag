import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Plus, Package, ScanLine, ArrowRight, CalendarDays, Loader2, Trash2, QrCode, Eye, X, Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getBrand } from "@/lib/oziktag-store";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import QRCode from "qrcode";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Oziktag" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [tags, setTags] = useState<any[]>([]);
  const [brand, setBrandName] = useState("Brand UMKM");
  const [totalScans, setTotalScans] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Modal states
  const [qrModal, setQrModal] = useState<{ id: string; name: string } | null>(null);
  const [previewModal, setPreviewModal] = useState<{ id: string; name: string } | null>(null);

  const fetchAll = async () => {
    try {
      const [prodData, statsData, logsData] = await Promise.all([
        apiFetch("/qc/products"),
        apiFetch("/qc/stats"),
        apiFetch("/auth/credit-logs"),
      ]);
      setTags(prodData);
      setTotalProducts(statsData.total_products);
      setTotalScans(statsData.total_scans);
      setLogs(logsData.slice(0, 5));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    setBrandName(getBrand());
    fetchAll();

    let sub1: any;
    let sub2: any;
    let sub3: any;

    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;

      sub1 = supabase
        .channel("dashboard-products")
        .on("postgres_changes", { event: "*", schema: "public", table: "qc_products", filter: `user_id=eq.${uid}` }, () => {
          fetchAll();
        })
        .subscribe();

      sub2 = supabase
        .channel("dashboard-scans")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "product_scans", filter: `user_id=eq.${uid}` }, () => {
          fetchAll();
        })
        .subscribe();

      sub3 = supabase
        .channel("dashboard-credits")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "credit_logs", filter: `user_id=eq.${uid}` }, () => {
          fetchAll();
        })
        .subscribe();
    });

    return () => {
      if (sub1) supabase.removeChannel(sub1);
      if (sub2) supabase.removeChannel(sub2);
      if (sub3) supabase.removeChannel(sub3);
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/qc/${id}`, { method: "DELETE" });
      toast.success("Produk berhasil dihapus");
      setTags(tags.filter((t) => t.id !== id));
      setTotalProducts((prev) => prev - 1);
    } catch (e) {
      toast.error("Gagal menghapus produk");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Selamat datang,</p>
          <h1 className="text-3xl font-semibold tracking-tight">{brand}</h1>
        </div>
        <Link
          to="/generator"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Buat QR Code Kualitas
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <StatCard icon={Package} label="Produk Terverifikasi" value={totalProducts.toString()} hint="Total label QC aktif" />
        <StatCard icon={ScanLine} label="Scan oleh Pembeli (bulan ini)" value={totalScans.toString()} hint="Diperbarui realtime" />
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Aktivitas QR Hari Ini</h2>
          <p className="text-xs text-muted-foreground hidden sm:block">Geser ←/→ untuk lihat lainnya</p>
        </div>
        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : tags.length === 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">Belum ada QR Code. Mulai dengan membuat label kualitas pertama Anda.</p>
              <Link
                to="/generator"
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
              >
                <Plus className="h-4 w-4" /> Buat QR pertama
              </Link>
            </div>
          </div>
        ) : (
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:thin]">
              {tags.map((t) => (
                <div
                  key={t.id}
                  className="snap-start shrink-0 w-[80%] sm:w-[280px] rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-elegant)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Package className="h-3 w-3" /> {t.kategori || t.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(t.createdAt || t.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-semibold">{t.nama_produk}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Batch: {t.batch || "—"}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.checklist.slice(0, 2).map((q: string) => (
                      <span key={q} className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        ✓ {q}
                      </span>
                    ))}
                    {t.checklist.length > 2 && (
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        +{t.checklist.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Two separate action buttons */}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Button 1: Lihat QR Code */}
                      <button
                        onClick={() => setQrModal({ id: t.id, name: t.nama_produk })}
                        className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
                        title="Lihat QR Code"
                      >
                        <QrCode className="h-3 w-3" /> Lihat QR
                      </button>

                      {/* Button 2: Preview halaman scan */}
                      <button
                        onClick={() => setPreviewModal({ id: t.id, name: t.nama_produk })}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/60 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Preview tampilan scan"
                      >
                        <Eye className="h-3 w-3" /> Preview
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => setConfirmDelete(t.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-10 mb-10 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">Riwayat Penggunaan Kredit</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-secondary/50 rounded-lg"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada aktivitas kredit</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <div className="flex flex-col gap-1 overflow-hidden pr-2">
                  <span className="text-xs font-medium truncate" title={log.description}>
                    {log.description}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span
                      className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase ${
                        log.tipe_kredit === "API" ? "bg-primary/20 text-primary" : "bg-orange-500/20 text-orange-600"
                      }`}
                    >
                      {log.tipe_kredit}
                    </span>
                    {new Date(log.created_at).toLocaleString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className={`font-mono font-bold text-xs shrink-0 ${log.amount > 0 ? "text-green-500" : "text-destructive"}`}>
                  {log.amount > 0 ? "+" : ""}
                  {log.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal: Konfirmasi hapus */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Hapus QR Code?</h3>
            <p className="text-sm text-muted-foreground mb-6">Tindakan ini tidak dapat dibatalkan. Label ini tidak akan bisa dipindai lagi.</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 rounded-md bg-destructive py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lihat QR Code */}
      {qrModal && (
        <QrCodeModal
          id={qrModal.id}
          name={qrModal.name}
          onClose={() => setQrModal(null)}
        />
      )}

      {/* Modal: Preview halaman scan */}
      {previewModal && (
        <PreviewModal
          id={previewModal.id}
          name={previewModal.name}
          onClose={() => setPreviewModal(null)}
        />
      )}
    </AppShell>
  );
}

/* ─── Modal: Lihat QR Code ──────────────────────────────── */
function QrCodeModal({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const scanUrl = `${window.location.origin}/scan/${id}`;
  const slug = name.replace(/\s+/g, "-").toLowerCase();

  useEffect(() => {
    const SIZE = 400;
    // 1. Generate raw QR as data URL
    QRCode.toDataURL(scanUrl, {
      width: SIZE,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then((qrUrl) => {
      // 2. Draw QR onto canvas, then overlay Oziktag logo in center
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;

      const qrImg = new Image();
      qrImg.onload = () => {
        // Draw the QR code
        ctx.drawImage(qrImg, 0, 0, SIZE, SIZE);

        const cx = SIZE / 2;
        const cy = SIZE / 2;
        const logoR = SIZE * 0.11; // ~44px — safely within 30% error correction zone

        // ── Outer white ring (clean separation from QR modules) ──
        ctx.beginPath();
        ctx.arc(cx, cy, logoR + 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // ── Subtle grey border ──
        ctx.beginPath();
        ctx.arc(cx, cy, logoR + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 1;
        ctx.stroke();

        // ── Black badge circle ──
        ctx.beginPath();
        ctx.arc(cx, cy, logoR, 0, Math.PI * 2);
        ctx.fillStyle = "#0f172a";
        ctx.fill();

        // ── ShieldCheck icon (lucide, viewBox 24×24) ──
        // Shield path from lucide ShieldCheck
        const iconPx = logoR * 1.28; // rendered pixel size of the 24×24 icon
        const sc = iconPx / 24;
        ctx.save();
        ctx.translate(cx - iconPx / 2, cy - iconPx / 2);
        ctx.scale(sc, sc);

        // Shield body — white fill
        const shieldPath = new Path2D(
          "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        );
        ctx.fillStyle = "#ffffff";
        ctx.fill(shieldPath);

        // Checkmark — dark stroke
        const checkPath = new Path2D("M9 12l2 2 4-4");
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.2 / sc;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke(checkPath);

        ctx.restore();

        setDataUrl(canvas.toDataURL("image/png"));
      };
      qrImg.src = qrUrl;
    });
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

/* ─── Modal: Preview halaman scan ───────────────────────── */
function PreviewModal({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const scanUrl = `/scan/${id}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl animate-in zoom-in-95 duration-200 flex flex-col"
        style={{ height: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
              <Eye className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Preview Scan</p>
              <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/scan/$id"
              params={{ id }}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
            >
              Buka <ArrowRight className="h-3 w-3" />
            </Link>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Browser chrome mockup */}
        <div className="px-4 py-2 bg-secondary/30 border-b border-border shrink-0 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 rounded-md bg-background/70 border border-border px-3 py-1 text-[10px] font-mono text-muted-foreground">
            {window.location.origin}{scanUrl}
          </div>
        </div>

        {/* iframe */}
        <div className="flex-1 overflow-hidden rounded-b-2xl">
          <iframe
            src={scanUrl}
            title={`Preview: ${name}`}
            className="w-full h-full border-0"
            style={{ background: "white" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}