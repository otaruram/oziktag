import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, XCircle, Search, Video, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AdminDisputes() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTickets = () => {
    setLoading(true);
    apiFetch(`/admin/disputes?page=${page}`)
      .then((res) => {
        setTickets(res.data);
        setTotal(res.total);
      })
      .catch((err) => toast.error("Gagal mengambil data sengketa: " + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [page]);

  const handleResolve = async (ticketId: string, action: "RELEASE" | "REFUND") => {
    if (!window.confirm(`Apakah Anda yakin ingin memutus sengketa ini dengan tindakan: ${action}?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/admin/disputes/${ticketId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      toast.success(res.message);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses sengketa");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Manajemen Sengketa</h2>
          <p className="text-sm text-muted-foreground">Kelola tiket komplain pembeli ("kasus isi batu").</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3">ID Tiket / Tanggal</th>
                <th className="px-4 py-3">Produk & Penjual</th>
                <th className="px-4 py-3">Kontak Pembeli</th>
                <th className="px-4 py-3">Alasan & Bukti</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada tiket sengketa.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">
                      {t.id.split("-")[0]}...
                      <div className="mt-1 text-muted-foreground">
                        {new Date(t.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.productName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.sellerEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.buyerEmail}</div>
                      {t.buyerPhone && <div className="text-xs text-muted-foreground mt-0.5">{t.buyerPhone}</div>}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="line-clamp-2 text-xs mb-1" title={t.reason}>{t.reason}</p>
                      {t.videoUrl && (
                        <a href={t.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline">
                          <Video className="h-3 w-3" /> Lihat Video
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          t.status === "OPEN" && "bg-red-500/10 text-red-600 border border-red-500/20",
                          t.status === "RESOLVED_REFUND" && "bg-blue-500/10 text-blue-600",
                          t.status === "RESOLVED_RELEASE" && "bg-green-500/10 text-green-600"
                        )}
                      >
                        {t.status === "OPEN" ? "MENUNGGU" : t.status === "RESOLVED_REFUND" ? "DI-REFUND" : "DITOLAK"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.status === "OPEN" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleResolve(t.id, "REFUND")}
                            className="rounded bg-blue-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-blue-700 transition-colors"
                            title="Pembeli Benar (Refund)"
                          >
                            Refund Buyer
                          </button>
                          <button
                            onClick={() => handleResolve(t.id, "RELEASE")}
                            className="rounded border border-red-500/20 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-colors"
                            title="Penjual Benar (Release Dana)"
                          >
                            Tolak (Release)
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {total > 10 && (
          <div className="flex items-center justify-between border-t border-border p-4 bg-muted/30">
            <span className="text-sm text-muted-foreground">
              Total <strong>{total}</strong> tiket
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * 10 >= total}
                className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
