import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Package, ScanLine, ArrowRight, CalendarDays, Loader2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getBrand } from "@/lib/oziktag-store";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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


  const fetchAll = async () => {
    try {
      const [prodData, statsData, logsData] = await Promise.all([
        apiFetch("/qc/products"),
        apiFetch("/qc/stats"),
        apiFetch("/auth/credit-logs")
      ]);
      setTags(prodData);
      setTotalProducts(statsData.total_products);
      setTotalScans(statsData.total_scans);
      setLogs(logsData.slice(0, 5)); // Just top 5 for dashboard
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
        .channel('dashboard-products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'qc_products', filter: `user_id=eq.${uid}` }, () => {
          fetchAll();
        })
        .subscribe();

      sub2 = supabase
        .channel('dashboard-scans')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'product_scans', filter: `user_id=eq.${uid}` }, () => {
          fetchAll();
        })
        .subscribe();

      sub3 = supabase
        .channel('dashboard-credits')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'credit_logs', filter: `user_id=eq.${uid}` }, () => {
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
      setTags(tags.filter(t => t.id !== id));
      setTotalProducts(prev => prev - 1);
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
        <StatCard
          icon={Package}
          label="Produk Terverifikasi"
          value={totalProducts.toString()}
          hint="Total label QC aktif"
        />
        <StatCard
          icon={ScanLine}
          label="Scan oleh Pembeli (bulan ini)"
          value={totalScans.toString()}
          hint="Diperbarui realtime"
        />
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Aktivitas QR Hari Ini
          </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Geser ←/→ untuk lihat lainnya</p>
            </div>
            {loading ? (
              <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : tags.length === 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="px-6 py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    Belum ada QR Code. Mulai dengan membuat label kualitas pertama Anda.
                  </p>
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
                      <div className="mt-4 flex items-center justify-between">
                        <Link
                          to="/scan/$id"
                          params={{ id: t.id }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          Lihat QR <ArrowRight className="h-3 w-3" />
                        </Link>
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
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
          Riwayat Penggunaan Kredit
        </h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-secondary/50 rounded-lg"></div>)}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada aktivitas kredit</p>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <div className="flex flex-col gap-1 overflow-hidden pr-2">
                  <span className="text-xs font-medium truncate" title={log.description}>{log.description}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase ${log.tipe_kredit === 'API' ? 'bg-primary/20 text-primary' : 'bg-orange-500/20 text-orange-600'}`}>{log.tipe_kredit}</span>
                    {new Date(log.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className={`font-mono font-bold text-xs shrink-0 ${log.amount > 0 ? "text-green-500" : "text-destructive"}`}>
                  {log.amount > 0 ? "+" : ""}{log.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Hapus QR Code?</h3>
            <p className="text-sm text-muted-foreground mb-6">Tindakan ini tidak dapat dibatalkan. Label ini tidak akan bisa dipindai lagi.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-medium hover:bg-secondary transition-colors">Batal</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 rounded-md bg-destructive py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

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