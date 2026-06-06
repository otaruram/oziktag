import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Lock, Code2, Copy, RefreshCw, KeyRound, Server, Webhook, Coins, Play, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/api-keys")({
  head: () => ({ meta: [{ title: "Developer API — Oziktag" }] }),
  component: ApiKeys,
});

function ApiKeys() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showPlayground, setShowPlayground] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [credits, setCreditsState] = useState(0);

  useEffect(() => {
    apiFetch("/auth/me")
      .then((me) => {
        setIsAdmin(me.is_admin);
        setCreditsState(me.sisa_kredit);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <AppShell><div className="animate-pulse h-32 bg-card rounded-xl"></div></AppShell>;

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">API Access Locked</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Fitur Developer API saat ini sedang dalam masa pengujian (Beta) dan hanya tersedia untuk administrator sistem.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Developer API</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Integrasikan sistem POS atau ERP Anda langsung dengan Oziktag menggunakan REST API.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPlayground(true)} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary">
            <Play className="h-4 w-4" /> Playground
          </button>
          <button onClick={() => setShowPricing(true)} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary">
            <Coins className="h-4 w-4" /> Pricing API
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* API Key Management */}
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">API Keys</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Gunakan API key ini untuk mengautentikasi request dari server Anda. Jangan bagikan key ini ke publik.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  Production Key
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value="ozk_live_98x723498nx12n30x8n12x3"
                    readOnly
                    className="flex-1 rounded-md border border-border bg-input/40 px-3 py-2 text-sm font-mono text-foreground focus:outline-none"
                  />
                  <button onClick={() => toast.success("Copied to clipboard")} className="p-2 rounded-md border border-border hover:bg-secondary">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => toast.info("Revoking key...")} className="p-2 rounded-md border border-border hover:bg-secondary">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <button className="text-sm text-primary font-medium hover:underline">
                + Generate New Key
              </button>
            </div>
          </section>

          {/* Use Cases */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Kegunaan API Oziktag</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-md bg-primary/10 text-primary mt-1">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Automasi dari Sistem POS/Kasir</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Saat transaksi terjadi di aplikasi kasir (seperti Moka atau majoo), sistem Anda dapat otomatis menembak API Oziktag untuk men-generate QR QC Label tanpa harus membuka web Oziktag secara manual.
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
        <aside className="space-y-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Quick Start</h3>
            </div>
            <pre className="text-[10px] bg-background border border-border p-3 rounded-md overflow-x-auto">
{`curl -X POST https://api.oziktag.com/v1/qc \\
  -H "Authorization: Bearer ozk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "nama_produk": "Kopi Susu",
    "batch": "B-01"
  }'`}
            </pre>
            <a href="/docs#api" className="mt-4 block text-xs font-medium text-primary hover:underline">
              View Full Documentation &rarr;
            </a>
          </div>
        </aside>
      </div>

      {showPlayground && <PlaygroundModal credits={credits} onClose={() => setShowPlayground(false)} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </AppShell>
  );
}

function PlaygroundModal({ onClose, credits }: { onClose: () => void; credits: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Test API</p>
            <h3 className="mt-1 text-lg font-semibold flex items-center gap-2">API Playground</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-gradient-to-br from-card to-secondary/40 p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Saldo Anda</p>
            <p className="text-2xl font-bold tracking-tight">{credits} <span className="text-sm font-normal text-muted-foreground">kredit</span></p>
          </div>
          <Coins className="h-8 w-8 text-primary/70" />
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Endpoint</label>
            <div className="flex items-center gap-0">
              <span className="bg-secondary px-3 py-2 text-sm font-mono rounded-l-md border border-border border-r-0">POST</span>
              <input type="text" readOnly value="https://api.oziktag.com/v1/qc" className="flex-1 w-full rounded-r-md border border-border bg-input/40 px-3 py-2 text-sm font-mono focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Request Body (JSON)</label>
            <textarea readOnly rows={5} className="w-full rounded-md border border-border bg-black/5 p-3 text-sm font-mono focus:outline-none dark:bg-black/40" defaultValue={'{\n  "nama_produk": "Produk Test",\n  "kategori": "Makanan",\n  "batch": "B-TEST-01"\n}'} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-secondary transition-colors">Batal</button>
          <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors shadow-[var(--shadow-elegant)]"><Play className="h-4 w-4" /> Run Request</button>
        </div>
      </div>
    </div>
  );
}

function PricingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Biaya Pemakaian</p>
            <h3 className="mt-1 text-lg font-semibold">Pricing API (Pay-as-you-go)</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-secondary/30 p-5 text-center">
            <Coins className="h-10 w-10 text-primary mx-auto mb-3" />
            <h4 className="text-xl font-bold">1 Request = 1 Kredit</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Setiap kali Anda menembak API untuk membuat QR Code QC, sistem akan otomatis memotong 1 kredit dari saldo akun Anda.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-sm font-semibold">Harga Kredit (Top-up Reguler)</h5>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-sm rounded-md border border-border bg-card p-3">
                <span><span className="font-medium">Starter</span> (50 kredit)</span>
                <span className="font-mono text-muted-foreground">Rp 400 / req</span>
              </li>
              <li className="flex items-center justify-between text-sm rounded-md border border-primary/40 bg-primary/5 p-3">
                <span><span className="font-medium text-primary">Growth</span> (150 kredit)</span>
                <span className="font-mono text-muted-foreground">Rp 333 / req</span>
              </li>
              <li className="flex items-center justify-between text-sm rounded-md border border-border bg-card p-3">
                <span><span className="font-medium">Pro</span> (400 kredit)</span>
                <span className="font-mono text-muted-foreground">Rp 250 / req</span>
              </li>
            </ul>
          </div>
          
          <div className="rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Catatan:</span> Tidak ada biaya bulanan. Anda hanya membayar sesuai jumlah request (QR) yang berhasil di-generate.
          </div>
        </div>
      </div>
    </div>
  );
}
