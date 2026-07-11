import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Lock, Code2, Copy, RefreshCw, KeyRound, Server, Webhook, Coins, Play, X, Trash2 } from "lucide-react";
import { apiFetch, API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PlaygroundModal } from "@/components/api/ApiPlaygroundModal";
import { PricingModal } from "@/components/api/ApiPricingModal";
import { ApiHistoryModal } from "@/components/api/ApiHistoryModal";
import { ApiDocsModal } from "@/components/api/ApiDocsModal";

export const Route = createFileRoute("/api-keys")({
  head: () => ({ meta: [{ title: "Developer API — Oziktag" }] }),
  component: ApiKeys,
});

function ApiKeys() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasApiAccess, setHasApiAccess] = useState(false);
  const [reqStatus, setReqStatus] = useState<string>("none");
  const [loading, setLoading] = useState(true);

  const [showPlayground, setShowPlayground] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [credits, setCreditsState] = useState(0);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showApiDocs, setShowApiDocs] = useState(false);


  const fetchData = async () => {
    try {
      const [me, keys, statusReq] = await Promise.all([
        apiFetch("/auth/me"),
        apiFetch("/apikeys").catch(() => []), // Might fail if no access
        apiFetch("/apikeys/request-status").catch(() => ({ status: "none" }))
      ]);
      setIsAdmin(me.is_admin);
      setHasApiAccess(me.has_api_access);
      setReqStatus(statusReq.status);
      setCreditsState(me.api_kredit); // USE API KREDIT
      if (Array.isArray(keys)) setApiKeys(keys);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    let sub: any;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const channelName = `apikeys-user-${uid}-${Date.now()}`;
      sub = supabase
        .channel(channelName)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, (payload) => {
          if (payload.new && payload.new.api_kredit !== undefined) {
            setCreditsState(payload.new.api_kredit);
          }
        })
        .subscribe();
    });

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, []);

  const generateKey = async () => {
    try {
      const newKey = await apiFetch("/apikeys", { method: "POST" });
      setApiKeys([...apiKeys, newKey]);
      toast.success("API Key berhasil dibuat!");
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat key");
    }
  };

  const revokeKey = async (id: string) => {
    try {
      await apiFetch(`/apikeys/${id}`, { method: "DELETE" });
      setApiKeys(apiKeys.filter(k => k.id !== id));
      toast.success("Key berhasil dihapus");
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus key");
    } finally {
      setConfirmDelete(null);
    }
  };
  const handleRequestAccess = async () => {
    try {
      await apiFetch("/apikeys/request-access", { method: "POST" });
      setReqStatus("pending");
      toast.success("Permintaan akses berhasil dikirim. Menunggu persetujuan admin.");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengirim permintaan.");
    }
  };

  if (loading) return <AppShell><div className="animate-pulse h-32 bg-card rounded-xl"></div></AppShell>;

  if (!isAdmin && !hasApiAccess) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">API Access Locked</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground mb-8">
            Fitur Developer API saat ini sedang dalam masa pengujian (Beta) dan hanya tersedia untuk administrator sistem atau pengguna yang telah disetujui.
          </p>
          
          {reqStatus === "pending" ? (
            <button disabled className="px-4 py-2 bg-secondary text-muted-foreground rounded-md text-sm font-medium border border-border cursor-not-allowed">
              Menunggu Persetujuan Admin...
            </button>
          ) : reqStatus === "rejected" ? (
            <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md border border-destructive/20">
              Maaf, permintaan akses API Anda ditolak.
            </div>
          ) : (
            <button onClick={handleRequestAccess} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors">
              Request API Access
            </button>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Developer API</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Integrasikan sistem POS atau ERP Anda langsung dengan Oziktag menggunakan REST API.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto">
          <button onClick={() => setShowPlayground(true)} className="justify-center inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
            <Play className="h-4 w-4" /> Playground
          </button>
          <button onClick={() => setShowPricing(true)} className="justify-center inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
            <Coins className="h-4 w-4" /> Beli Kredit
          </button>
          <button onClick={() => setShowHistory(true)} className="col-span-2 md:col-auto justify-center inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
            <RefreshCw className="h-4 w-4" /> Riwayat
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6 min-w-0">
          {/* API Key Management */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">API Keys</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Gunakan API key ini untuk mengautentikasi request dari server Anda. Jangan bagikan key ini ke publik.
            </p>

            <div className="space-y-4">
              {apiKeys.map((k) => (
                <div key={k.id}>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    {k.name}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={k.key}
                      readOnly
                      className="min-w-0 flex-1 rounded-md border border-border bg-input/40 px-3 py-2 text-sm font-mono text-foreground focus:outline-none"
                    />
                    <button onClick={() => { navigator.clipboard.writeText(k.key); toast.success("Copied to clipboard"); }} className="p-2 rounded-md border border-border hover:bg-secondary">
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => setConfirmDelete(k.id)} className="p-2 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {apiKeys.length < 3 && (
                <button onClick={generateKey} className="text-sm text-primary font-medium hover:underline">
                  + Generate New Key
                </button>
              )}
            </div>
          </section>

          {/* Use Cases */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Kegunaan API Oziktag</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-md bg-primary/10 text-primary mt-1">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Automasi dari Sistem POS/Kasir</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Saat transaksi terjadi di aplikasi kasir, sistem Anda dapat otomatis menembak API Oziktag untuk men-generate QR QC Label tanpa harus membuka web Oziktag secara manual.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-md bg-primary/10 text-primary mt-1">
                  <Webhook className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Sinkronisasi Inventaris</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tarik data semua label QC yang sudah terbuat ke dalam dashboard internal perusahaan (ERP) Anda untuk pelacakan batch barang.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Documentation Sidebar */}
        <aside className="space-y-6 min-w-0">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Quick Start</h3>
            </div>
            <pre className="text-[10px] bg-background border border-border p-3 rounded-md overflow-x-auto">
{`curl -X POST ${API_BASE}/v1/qc \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nama_produk": "Kopi Gayo",
    "kategori": "Makanan & Minuman",
    "batch": "B-2026-06",
    "checklist": ["Segel utuh", "Warna sesuai standar"],
    "catatan_penjual": "Diinput via API Oziktag",
    "image_url": "https://example.com/kopi.jpg"
  }'`}
            </pre>
            <button onClick={() => setShowApiDocs(true)} className="mt-4 block text-xs font-medium text-primary hover:underline">
              View Full Documentation &rarr;
            </button>
          </div>
        </aside>
      </div>

      {showPlayground && <PlaygroundModal onClose={() => setShowPlayground(false)} defaultKey={apiKeys[0]?.key} isAdmin={isAdmin} credits={credits} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      {showHistory && <ApiHistoryModal onClose={() => setShowHistory(false)} />}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Hapus API Key?</h3>
            <p className="text-sm text-muted-foreground mb-6">Tindakan ini tidak dapat dibatalkan. Key ini tidak akan bisa digunakan lagi.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-medium hover:bg-secondary transition-colors">Batal</button>
              <button onClick={() => revokeKey(confirmDelete)} className="flex-1 rounded-md bg-destructive py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
      {showApiDocs && <ApiDocsModal onClose={() => setShowApiDocs(false)} />}
    </AppShell>
  );
}
