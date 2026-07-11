import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { apiFetch } from "../../lib/api";

export function ApiHistoryModal({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/auth/credit-logs").then(data => {
      setLogs(data.filter((l: any) => l.tipe_kredit === 'API'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-[var(--shadow-elegant)] overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Log Aktivitas</p>
            <h3 className="mt-1 text-lg font-semibold flex items-center gap-2">Riwayat Kredit API</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-secondary/50 rounded-lg"></div>)}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada riwayat pemakaian API.</p>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <div className="flex flex-col gap-1 overflow-hidden pr-2">
                  <span className="text-sm font-medium truncate">{log.description}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className={`font-mono font-bold text-sm shrink-0 ${log.amount > 0 ? "text-green-500" : "text-destructive"}`}>
                  {log.amount > 0 ? "+" : ""}{log.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
