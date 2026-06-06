import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Lock, Code2, Copy, RefreshCw, KeyRound, Server, Webhook, Coins, Play, X, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import QRCode from "qrcode";

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

      {showPlayground && <PlaygroundModal credits={credits} onSimulateSuccess={() => setCreditsState(p => Math.max(0, p - 1))} onClose={() => setShowPlayground(false)} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </AppShell>
  );
}

function PlaygroundModal({ onClose, credits, onSimulateSuccess }: { onClose: () => void; credits: number; onSimulateSuccess: () => void }) {
  const [running, setRunning] = useState(false);
  const [resultQr, setResultQr] = useState<string | null>(null);

  const handleRun = async () => {
    if (credits <= 0) {
      toast.error("Kredit Anda habis! Tidak dapat menjalankan simulasi.");
      return;
    }
    setRunning(true);
    setResultQr(null);
    try {
      await new Promise(r => setTimeout(r, 1200));
      const url = await QRCode.toDataURL("https://oziktag.com/scan/simulasi-uuid-1234", { width: 200 });
      setResultQr(url);
      onSimulateSuccess();
      toast.success("Berhasil! 1 Kredit terpotong.");
    } catch (e) {
      toast.error("Gagal menjalankan simulasi.");
    } finally {
      setRunning(false);
    }
  };

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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-gradient-to-br from-card to-secondary/40 p-4 transition-all">
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

        {resultQr && (
          <div className="mt-6 p-4 rounded-lg border border-primary/40 bg-primary/5 flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <p className="text-sm font-semibold mb-3 text-primary flex items-center gap-2"><Check className="h-4 w-4" /> Response (201 Created)</p>
            <img src={resultQr} alt="Result QR" className="h-32 w-32 rounded-md bg-white p-2 shadow-sm" />
            <p className="text-xs text-muted-foreground mt-3 font-mono bg-background px-3 py-1 rounded border border-border">https://oziktag.com/scan/simulasi-uuid-1234</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-secondary transition-colors">Tutup</button>
          <button onClick={handleRun} disabled={running} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors shadow-[var(--shadow-elegant)] disabled:opacity-60">
            {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} 
            {running ? "Memproses..." : "Run Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PricingModal({ onClose }: { onClose: () => void }) {
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  if (selectedPkg) {
    return <SimulationCheckoutModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />;
  }

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
            <h5 className="text-sm font-semibold">Pilih Paket Kredit API (Simulasi)</h5>
            <ul className="space-y-2">
              <button onClick={() => setSelectedPkg({ id: "starter", name: "Starter", price: 20000, credits: 50 })} className="w-full flex items-center justify-between text-sm rounded-md border border-border bg-card p-3 hover:bg-secondary transition-colors text-left">
                <span><span className="font-medium">Starter</span> (50 kredit)</span>
                <span className="font-mono text-muted-foreground">Rp 400 / req</span>
              </button>
              <button onClick={() => setSelectedPkg({ id: "growth", name: "Growth", price: 50000, credits: 150 })} className="w-full flex items-center justify-between text-sm rounded-md border border-primary/40 bg-primary/5 p-3 hover:bg-primary/10 transition-colors text-left">
                <span><span className="font-medium text-primary">Growth</span> (150 kredit)</span>
                <span className="font-mono text-muted-foreground">Rp 333 / req</span>
              </button>
              <button onClick={() => setSelectedPkg({ id: "pro", name: "Pro", price: 100000, credits: 400 })} className="w-full flex items-center justify-between text-sm rounded-md border border-border bg-card p-3 hover:bg-secondary transition-colors text-left">
                <span><span className="font-medium">Pro</span> (400 kredit)</span>
                <span className="font-mono text-muted-foreground">Rp 250 / req</span>
              </button>
            </ul>
          </div>
          
          <div className="rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Catatan:</span> Klik salah satu paket di atas untuk mencoba simulasi pembayaran. Tidak ada biaya bulanan, murni pay-as-you-go.
          </div>
        </div>
      </div>
    </div>
  );
}

function SimulationCheckoutModal({ pkg, onClose }: { pkg: any, onClose: () => void }) {
  const [method, setMethod] = useState<"QRIS" | "GoPay">("QRIS");
  const [processing, setProcessing] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);

  const createTransaction = async () => {
    setProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const dummyQrData = "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214436531182312010303UMI51440014ID.CO.QRIS.WWW0215ID10200212002010303UMI5204549953033605405200005802ID5910Oziktag API6006JAKARTA61051219062330115P20111129528250708021111296304EE88";
      const url = await QRCode.toDataURL(dummyQrData, { width: 300 });
      setQrImage(url);
      toast.success("Tagihan simulasi berhasil dibuat!");
    } catch (e: any) {
      toast.error("Gagal membuat transaksi");
    } finally {
      setProcessing(false);
    }
  };

  const idr = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Checkout (Simulasi)</p>
            <h3 className="mt-1 text-lg font-semibold">Paket {pkg.name} API</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Total bayar</span>
          <span className="text-lg font-semibold">{idr(pkg.price)}</span>
        </div>

        {qrImage ? (
          <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-border bg-background/40 p-4 text-center">
            <img src={qrImage} alt="QRIS" className="h-48 w-48 rounded-md bg-white p-2 shadow-sm" />
            <p className="mt-3 text-xs font-semibold text-primary">Scan dengan e-Wallet atau m-Banking</p>
            <div className="mt-6 flex flex-col items-center gap-1.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
              </span>
              <p className="text-sm font-medium">Menunggu Pembayaran...</p>
              <p className="text-[11px] text-muted-foreground">Ini adalah QR simulasi percobaan.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Metode pembayaran</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["QRIS", "GoPay"] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${method === m ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
                  {m}
                </button>
              ))}
            </div>
            <button onClick={createTransaction} disabled={processing} className="mt-6 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90 disabled:opacity-60">
              {processing ? "Memproses..." : "Buat Tagihan Simulasi"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
