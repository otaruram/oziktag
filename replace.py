import sys

new_content = """
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
            <button onClick={onClose} className="md:hidden rounded-md p-1 text-muted-foreground hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>

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
"""

with open(r'c:\Users\asus\Downloads\oziktag-main\oziktag-main\fe\src\routes\api-keys.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if line.startswith('function PlaygroundModal({'):
        start_idx = i
    if start_idx != -1 and line.startswith('function PricingModal({'):
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    lines = lines[:start_idx] + [new_content + '\n'] + lines[end_idx:]
    with open(r'c:\Users\asus\Downloads\oziktag-main\oziktag-main\fe\src\routes\api-keys.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('Successfully replaced PlaygroundModal')
else:
    print('Could not find PlaygroundModal boundaries', start_idx, end_idx)
