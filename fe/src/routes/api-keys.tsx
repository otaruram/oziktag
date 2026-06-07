import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Lock, Code2, Copy, RefreshCw, KeyRound, Server, Webhook, Coins, Play, X, Check, Trash2, Sparkles } from "lucide-react";
import { apiFetch, API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase";
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
  const [showHistory, setShowHistory] = useState(false);
  const [credits, setCreditsState] = useState(0);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);


  const fetchData = async () => {
    try {
      const [me, keys] = await Promise.all([
        apiFetch("/auth/me"),
        apiFetch("/apikeys")
      ]);
      setIsAdmin(me.is_admin);
      setCreditsState(me.api_kredit); // USE API KREDIT
      setApiKeys(keys);
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
            <a href="/docs#api" className="mt-4 block text-xs font-medium text-primary hover:underline">
              View Full Documentation &rarr;
            </a>
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
    </AppShell>
  );
}



function PlaygroundModal({ onClose, defaultKey, isAdmin, credits }: { onClose: () => void, defaultKey?: string, isAdmin: boolean, credits: number }) {
  const [running, setRunning] = useState(false);
  const [resultQr, setResultQr] = useState<string | null>(null);
  const [qrUrlString, setQrUrlString] = useState("");

  const [namaProduk, setNamaProduk] = useState("Produk Test API");
  const [kategori, setKategori] = useState("Makanan & Minuman");
  const [batch, setBatch] = useState("B-TEST-API");
  const [checklist, setChecklist] = useState<string[]>(["Kondisi fisik baik", "Sesuai standar"]);
  const [customCheck, setCustomCheck] = useState("");
  const [catatanPenjual, setCatatanPenjual] = useState("Dibuat via API");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const addCheck = () => {
    if (customCheck.trim() && !checklist.includes(customCheck.trim())) {
      setChecklist([...checklist, customCheck.trim()]);
      setCustomCheck("");
    }
  };

  const removeCheck = (i: number) => setChecklist(c => c.filter((_, idx) => idx !== i));

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - imageUrls.length;
    if (remaining <= 0) return toast.error("Maksimal 5 foto");
    const picked = Array.from(files).slice(0, remaining);
    
    const formData = new FormData();
    picked.forEach(f => formData.append("images", f));
    
    setUploading(true);
    toast.loading("Mengunggah gambar...", { id: "upload-api" });
    try {
      const res = await apiFetch("/qc/upload", { method: "POST", body: formData });
      setImageUrls(prev => [...prev, ...res.urls]);
      toast.success("Gambar berhasil diunggah", { id: "upload-api" });
    } catch (e) {
      toast.error("Gagal unggah gambar", { id: "upload-api" });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (i: number) => setImageUrls(p => p.filter((_, idx) => idx !== i));

  const autoFill = () => {
    setNamaProduk("Produk Auto Fill (Dummy API)");
    setKategori("Kerajinan");
    setBatch(`B-${new Date().getFullYear()}-${Math.floor(Math.random()*100)}`);
    setChecklist(["Kemasan utuh", "Warna sesuai", "Tidak ada cacat"]);
    setCatatanPenjual("Diinput via fitur AutoFill Playground");
    toast.success("Form berhasil diisi otomatis!");
  };

  const jsonPayload = {
    nama_produk: namaProduk,
    kategori,
    batch,
    checklist,
    catatan_penjual: catatanPenjual,
    image_urls: imageUrls.length > 0 ? imageUrls : ["https://ik.imagekit.io/nc7w3hotd/oziktag/products/dummy_api.jpg"]
  };

  const handleRun = async () => {
    if (!isAdmin && credits <= 0) {
      toast.error("Kredit Anda habis!");
      return;
    }
    if (!defaultKey) return toast.error("Generate API Key dulu.");
    
    setRunning(true);
    setResultQr(null);
    try {
      const res = await fetch(`${API_BASE}/v1/qc`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${defaultKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "API Request Failed");

      const url = await QRCode.toDataURL(data.qr_url, { width: 200 });
      setResultQr(url);
      setQrUrlString(data.qr_url);
      toast.success("Berhasil! 1 Kredit terpotong.");
    } catch (e: any) {
      toast.error(e.message || "Gagal menjalankan request API.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-[var(--shadow-elegant)] overflow-y-auto max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Left Side: Form Builder */}
        <div className="flex-1 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Form Builder</p>
              <h3 className="mt-1 text-lg font-semibold flex items-center gap-2">API Playground</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={autoFill} className="hidden md:inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10">
                <Sparkles className="h-3 w-3" /> AutoFill
              </button>
              <button onClick={onClose} className="md:hidden rounded-md p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <button onClick={autoFill} className="md:hidden w-full inline-flex justify-center items-center gap-1 rounded-md border border-primary/40 bg-primary/5 px-2 py-2 text-xs font-medium text-primary hover:bg-primary/10 mb-2">
            <Sparkles className="h-3 w-3" /> AutoFill Dummy Data
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium mb-1 block">Nama Produk</label>
              <input value={namaProduk} onChange={e => setNamaProduk(e.target.value)} className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Kategori</label>
              <input value={kategori} onChange={e => setKategori(e.target.value)} className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Batch</label>
              <input value={batch} onChange={e => setBatch(e.target.value)} className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Checklist QC</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {checklist.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs">
                  {c} <button onClick={() => removeCheck(i)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3"/></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={customCheck} onChange={e => setCustomCheck(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCheck()} placeholder="Tambah checklist..." className="flex-1 rounded-md border border-border bg-input/40 px-3 py-2 text-sm focus:outline-none" />
              <button onClick={addCheck} className="rounded-md bg-secondary px-3 py-2 text-sm">Add</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Catatan QC</label>
            <textarea value={catatanPenjual} onChange={e => setCatatanPenjual(e.target.value)} rows={2} className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm focus:outline-none" />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 flex justify-between">
              <span className="block">Foto Produk ({imageUrls.length}/5)</span>
              {imageUrls.length < 5 && (
                <label className="text-primary cursor-pointer hover:underline">
                  + Unggah
                  <input type="file" multiple accept="image/*" className="hidden" onChange={e => onPickFiles(e.target.files)} disabled={uploading} />
                </label>
              )}
            </label>
            <div className="flex flex-wrap gap-3 mt-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative group h-16 w-16 rounded-md border border-border overflow-hidden">
                  <img src={url} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-1">
                    <button onClick={() => removePhoto(i)} className="text-white p-1" title="Hapus"><X className="h-4 w-4" /></button>
                    <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Link disalin!"); }} className="text-white p-1" title="Copy Link"><Copy className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              {imageUrls.length === 0 && <div className="h-16 w-full rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">Belum ada foto</div>}
            </div>
          </div>
        </div>

        {/* Right Side: Payload Preview & Result */}
        <div className="flex-1 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6 flex flex-col">
          <div className="hidden md:flex items-start justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Live Preview</p>
              <h3 className="mt-1 text-lg font-semibold">JSON Payload</h3>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Endpoint URL</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full rounded-md border border-border overflow-hidden">
                <span className="bg-secondary px-3 py-2 text-sm font-mono border-b sm:border-b-0 sm:border-r border-border text-center sm:text-left">POST</span>
                <input type="text" readOnly value={`${API_BASE}/v1/qc`} className="min-w-0 flex-1 bg-input/40 px-3 py-2 text-xs sm:text-sm font-mono focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 flex justify-between">
                <span className="block">Request Body (JSON)</span>
                <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(jsonPayload, null, 2)); toast.success("JSON tersalin"); }} className="text-primary hover:underline">Copy JSON</button>
              </label>
              <textarea readOnly rows={10} className="w-full rounded-md border border-border bg-black/5 p-3 text-xs font-mono focus:outline-none dark:bg-black/40" value={JSON.stringify(jsonPayload, null, 2)} />
            </div>

            {resultQr && (
              <div className="p-4 rounded-lg border border-primary/40 bg-primary/5 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <p className="text-sm font-semibold mb-3 text-primary flex items-center gap-2"><Check className="h-4 w-4" /> Response (201 Created)</p>
                <img src={resultQr} alt="Result QR" className="h-32 w-32 rounded-md bg-white p-2 shadow-sm" />
                <p className="text-xs text-muted-foreground mt-3 font-mono bg-background px-3 py-1 rounded border border-border">{qrUrlString}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mr-auto">
              <Coins className="h-5 w-5 text-primary/70" />
              <span className="text-sm font-medium">Saldo: {isAdmin ? "∞" : credits}</span>
            </div>
            <button onClick={handleRun} disabled={running || uploading || !defaultKey} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors shadow-[var(--shadow-elegant)] disabled:opacity-60">
              {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} 
              {running ? "Memproses..." : "Run Request"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function PricingModal({ onClose }: { onClose: () => void }) {
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  if (selectedPkg) {
    return <RealCheckoutModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-[var(--shadow-elegant)] overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
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
            <h5 className="text-sm font-semibold">Pilih Paket Kredit API</h5>
            <ul className="space-y-2">
              <button onClick={() => setSelectedPkg({ id: "api_starter", name: "Starter API", price: 20000, credits: 50 })} className="w-full flex items-center justify-between text-sm rounded-md border border-border bg-card p-3 hover:bg-secondary transition-colors text-left">
                <span><span className="font-medium">Starter</span> (50 kredit API)</span>
                <span className="font-mono text-muted-foreground">Rp 400 / req</span>
              </button>
              <button onClick={() => setSelectedPkg({ id: "api_growth", name: "Growth API", price: 50000, credits: 150 })} className="w-full flex items-center justify-between text-sm rounded-md border border-primary/40 bg-primary/5 p-3 hover:bg-primary/10 transition-colors text-left">
                <span><span className="font-medium text-primary">Growth</span> (150 kredit API)</span>
                <span className="font-mono text-muted-foreground">Rp 333 / req</span>
              </button>
              <button onClick={() => setSelectedPkg({ id: "api_pro", name: "Pro API", price: 100000, credits: 400 })} className="w-full flex items-center justify-between text-sm rounded-md border border-border bg-card p-3 hover:bg-secondary transition-colors text-left">
                <span><span className="font-medium">Pro</span> (400 kredit API)</span>
                <span className="font-mono text-muted-foreground">Rp 250 / req</span>
              </button>
            </ul>
          </div>
          
          <div className="rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Catatan:</span> Klik salah satu paket di atas untuk memulai transaksi riil menggunakan Louvin Payment.
          </div>
        </div>
      </div>
    </div>
  );
}

function RealCheckoutModal({ pkg, onClose }: { pkg: any, onClose: () => void }) {
  const [method, setMethod] = useState<"QRIS" | "GoPay">("QRIS");
  const [processing, setProcessing] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [deeplink, setDeeplink] = useState<string | null>(null);

  const createTransaction = async () => {
    setProcessing(true);
    try {
      const paymentType = method === "QRIS" ? "qris" : "gopay";
      const res = await apiFetch("/topup/create", {
        method: "POST",
        body: JSON.stringify({ 
          paket: "starter", // Fallback to starter price for prototype
          payment_type: paymentType,
          tipe_kredit: "API"
        })
      });
      if (res.qr_string) {
        const url = await QRCode.toDataURL(res.qr_string, { width: 300 });
        setQrImage(url);
        toast.success("Tagihan berhasil dibuat!");
      } else if (res.deeplink_url) {
        setDeeplink(res.deeplink_url);
        toast.success("Tagihan berhasil dibuat!");
      } else {
        toast.error("Tidak ada data QR/Deeplink dari server");
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat transaksi");
    } finally {
      setProcessing(false);
    }
  };

  const idr = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-[var(--shadow-elegant)] overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Checkout</p>
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

        {qrImage || deeplink ? (
          <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-border bg-background/40 p-4 text-center">
            {qrImage && (
              <>
                <img src={qrImage} alt="QRIS" className="h-48 w-48 rounded-md bg-white p-2 shadow-sm" />
                <p className="mt-3 text-xs font-semibold text-primary">Scan dengan e-Wallet atau m-Banking</p>
              </>
            )}
            {deeplink && (
              <a href={deeplink} target="_blank" rel="noreferrer" className="mt-4 rounded-md bg-[#00AED6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90">
                Buka Aplikasi Gojek
              </a>
            )}
            <div className="mt-6 flex flex-col items-center gap-1.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
              </span>
              <p className="text-sm font-medium">Menunggu Pembayaran...</p>
              <p className="text-[11px] text-muted-foreground">Saldo Anda akan otomatis bertambah jika pembayaran berhasil.</p>
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
              {processing ? "Memproses..." : "Buat Tagihan (Bayar Asli)"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ApiHistoryModal({ onClose }: { onClose: () => void }) {
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
