import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck, Package, Truck, CheckCircle2, AlertCircle,
  MapPin, Clock, Sparkles, Eye, EyeOff, Loader2, KeyRound, Copy, Download,
  Maximize2, X, Receipt
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { DisputeModal } from "@/components/tracking/DisputeModal";
import TrackingMap from "@/components/tracking/TrackingMap";

export const Route = createFileRoute("/tracking/$id")({
  head: () => ({
    meta: [
      { title: "Lacak Produk — Oziktag" },
      { name: "description", content: "Lacak perjalanan produk UMKM secara transparan." },
    ],
  }),
  component: TrackingScan,
});

const STATUS_MAP: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", color: "text-orange-600", icon: Clock, bgColor: "bg-orange-500/15" },
  PACKED: { label: "Dikemas", color: "text-yellow-600", icon: Package, bgColor: "bg-yellow-500/15" },
  IN_TRANSIT: { label: "Dalam Perjalanan", color: "text-blue-600", icon: Truck, bgColor: "bg-blue-500/15" },
  DELIVERED: { label: "Diterima", color: "text-green-600", icon: CheckCircle2, bgColor: "bg-green-500/15" },
};

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {}
  return null;
}

function TrackingScan() {
  const { id } = Route.useParams();
  const [data, setData] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [role, setRole] = useState<"buyer" | "courier">("courier");
  const [pin, setPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Check if user just came back from payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      setShowInvoice(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const loadData = (viewRole: string, attemptPin?: string) => {
    setLoaded(false);
    const url = attemptPin 
      ? `/tracking/${id}?role=${viewRole}&pin=${attemptPin}`
      : `/tracking/${id}?role=${viewRole}`;

    apiFetch(url)
      .then((res) => { 
        setData(res); 
        setRole(viewRole as any);
        if (viewRole === "buyer") {
          setShowPinModal(false);
          if (attemptPin) {
            localStorage.setItem(`tracking_pin_${id}`, attemptPin);
          }
          toast.success("Akses pembeli berhasil dibuka!");
        }
        setLoaded(true); 
      })
      .catch((err) => { 
        if (viewRole === "buyer") {
          localStorage.removeItem(`tracking_pin_${id}`);
          toast.error("PIN yang Anda masukkan salah.");
          setLoaded(true);
        } else {
          setData(null); 
          setLoaded(true); 
        }
      });
  };

  useEffect(() => {
    const savedPin = localStorage.getItem(`tracking_pin_${id}`);
    if (savedPin) {
      setPin(savedPin);
      loadData("buyer", savedPin);
    } else {
      loadData("courier");
    }
  }, [id]);

  const handleCourierConfirm = async () => {
    setConfirming(true);
    try {
      toast.loading("Menangkap lokasi GPS...", { id: "courier-scan" });
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      await apiFetch("/tracking/scan", {
        method: "POST",
        body: JSON.stringify({ product_id: id, role: "courier", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      });
      toast.success("Lokasi kurir berhasil direkam!", { id: "courier-scan" });
      loadData(role, pin);
    } catch (err: any) {
      toast.error(err.message || "Gagal merekam lokasi", { id: "courier-scan" });
    } finally {
      setConfirming(false);
    }
  };

  const handleBuyerConfirm = async () => {
    setConfirming(true);
    try {
      toast.loading("Mengkonfirmasi penerimaan...", { id: "buyer-scan" });
      let lat: number | undefined, lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch {}
      await apiFetch("/tracking/scan", {
        method: "POST",
        body: JSON.stringify({ product_id: id, role: "buyer", pin, lat, lng }),
      });
      toast.success("Produk dikonfirmasi diterima!", { id: "buyer-scan" });
      loadData("buyer", pin);
    } catch (err: any) {
      toast.error(err.message || "Gagal konfirmasi", { id: "buyer-scan" });
    } finally {
      setConfirming(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) return toast.error("PIN terlalu pendek");
    loadData("buyer", pin.toUpperCase());
  };

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-lg font-semibold">Tracking Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">Produk ini belum terdaftar atau sudah dihapus.</p>
        </div>
      </div>
    );
  }

  // ─── MODE 2: INVOICE LUNAS (Baru selesai bayar) ───
  if (showInvoice && data.is_escrow) {
    const now = new Date();
    return (
      <div className="min-h-screen bg-zinc-50 text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-72 bg-black rounded-b-[50px] -z-10" />
        <div id="invoice-card" className="w-full max-w-sm rounded-3xl bg-[#ffffff] shadow-2xl p-8 relative text-center border border-[#e4e4e7]">
          <div className="absolute top-6 right-6 -rotate-12">
            <div className="border-4 border-[#000000] rounded-xl px-3 py-1">
              <span className="text-[#000000] font-black text-lg tracking-widest">LUNAS</span>
            </div>
          </div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4f4f5] mb-6 border border-[#e4e4e7]">
            <CheckCircle2 className="h-8 w-8 text-[#000000]" />
          </div>
          <h2 className="text-xl font-bold mb-1 text-[#000000]">Pembayaran Berhasil!</h2>
          <p className="text-sm text-[#71717a] mb-6">Terima kasih. Pesanan Anda sudah tercatat.</p>
          <div className="bg-[#fafafa] rounded-2xl p-5 mb-6 text-left border border-[#e4e4e7]">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#71717a]">Total Bayar</span>
                <span className="font-bold text-[#000000] text-lg">Rp {data.price?.toLocaleString("id-ID") || 0}</span>
              </div>
              <div className="border-t border-[#e4e4e7] pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#71717a]">Barang</span>
                  <span className="font-medium text-[#000000] text-right line-clamp-1 max-w-[180px]">{data.name}</span>
                </div>
                {data.brand && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#71717a]">Toko</span>
                    <span className="font-medium text-[#000000]">{data.brand}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#71717a]">Tanggal</span>
                  <span className="font-medium text-[#000000]">{now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#71717a]">Metode</span>
                  <span className="font-medium text-[#000000]">Escrow Oziktag</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-[#71717a] mb-6 leading-relaxed px-2" data-html2canvas-ignore>
            <ShieldCheck className="h-4 w-4 inline-block mr-1 -mt-0.5 text-[#000000]" />
            Dana ditahan oleh Oziktag dan akan dicairkan ke penjual setelah barang sampai ke tangan Anda.
          </div>
          <div className="flex gap-2" data-html2canvas-ignore>
            <button 
              onClick={async (e) => {
                const btn = e.currentTarget;
                const originalText = btn.innerHTML;
                btn.innerHTML = "Memproses PDF...";
                btn.disabled = true;
                try {
                  const html2canvas = (await import("html2canvas")).default;
                  const { jsPDF } = await import("jspdf");
                  const element = document.getElementById("invoice-card");
                  if (!element) return;
                  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
                  const imgData = canvas.toDataURL("image/png");
                  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                  const pdfWidth = pdf.internal.pageSize.getWidth();
                  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
                  pdf.save(`Invoice-Oziktag-${data.id}.pdf`);
                } catch (err) {
                  console.error(err);
                } finally {
                  btn.innerHTML = originalText;
                  btn.disabled = false;
                }
              }} 
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#000000] py-4 font-bold text-[#ffffff] shadow-lg shadow-black/20 hover:shadow-black/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-5 w-5" /> Download PDF
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-white/70 mt-8 font-medium">Invoice by Oziktag Escrow</p>
      </div>
    );
  }

  // ─── MODE 1: CHECKOUT (Belum Bayar) ───
  if (data.current_status === "PENDING_PAYMENT" && data.is_escrow) {
    return (
      <div className="min-h-screen bg-zinc-50 text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-72 bg-black rounded-b-[50px] -z-10" />
        <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-8 relative text-center border border-zinc-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 mb-6 border border-zinc-200">
            <Receipt className="h-8 w-8 text-black" />
          </div>
          <h2 className="text-xl font-bold mb-1">Tagihan Pembayaran</h2>
          <p className="text-sm text-muted-foreground mb-6">Silakan selesaikan pembayaran untuk pesanan Anda.</p>
          <div className="bg-zinc-50 rounded-2xl p-5 mb-6 text-left border border-zinc-200">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Tagihan</p>
            <p className="text-3xl font-bold text-black mb-4">Rp {data.price?.toLocaleString("id-ID") || 0}</p>
            <div className="border-t border-zinc-200 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Barang</span>
                <span className="font-medium text-right line-clamp-1 max-w-[180px]">{data.name}</span>
              </div>
              {data.brand && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Toko</span>
                  <span className="font-medium">{data.brand}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground mb-6 leading-relaxed px-2">
            <ShieldCheck className="h-4 w-4 inline-block mr-1 -mt-0.5 text-black" />
            Pembayaran dijamin aman oleh sistem Escrow Oziktag. Uang diteruskan ke penjual setelah barang diterima.
          </div>
          {data.payment_url ? (
            <a href={data.payment_url} className="block w-full rounded-2xl bg-black py-4 font-bold text-white shadow-lg shadow-black/20 hover:shadow-black/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Bayar Sekarang
            </a>
          ) : (
            <button disabled className="w-full rounded-2xl bg-muted py-4 font-bold text-muted-foreground cursor-not-allowed">
              Menunggu Link Pembayaran...
            </button>
          )}
        </div>
        <p className="text-center text-xs text-white/70 mt-8 font-medium">Secure Payment by Oziktag</p>
      </div>
    );
  }

  // ─── MODE 3: TRACKING (Normal) ───
  const statusInfo = STATUS_MAP[data.current_status] || STATUS_MAP.PACKED;
  const StatusIcon = statusInfo.icon;
  const ytId = data.youtube_url ? getYouTubeId(data.youtube_url) : null;

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 mb-4">
              <KeyRound className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Akses Pembeli</h2>
            <p className="text-sm text-center text-muted-foreground mb-6">Masukkan PIN rahasia yang Anda terima dari penjual untuk menyelesaikan pesanan.</p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input type="text" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.toUpperCase())} placeholder="XXXXYYYY" className="w-full text-center text-3xl font-mono tracking-[0.2em] rounded-xl border border-border bg-input/40 py-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none uppercase" required />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPinModal(false)} className="flex-1 rounded-xl border border-border py-2.5 font-medium hover:bg-muted">Batal</button>
                <button type="submit" className="flex-1 rounded-xl bg-orange-600 py-2.5 font-medium text-white hover:bg-orange-700">Buka Kunci</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Fullscreen */}
      {videoFullscreen && ytId && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button onClick={() => setVideoFullscreen(false)} className="absolute top-4 right-4 z-50 rounded-full bg-white/20 p-2 text-white hover:bg-white/40">
            <X className="h-6 w-6" />
          </button>
          <iframe src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`} className="w-full h-full max-w-4xl max-h-[80vh] rounded-xl" allow="autoplay; fullscreen; encrypted-media" allowFullScreen />
        </div>
      )}

      {/* Header */}
      <div className="bg-primary pt-12 pb-24 px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-md text-white font-medium text-sm mb-4">
          <ShieldCheck className="h-4 w-4" /> Oziktag Digital Tracking
        </div>
        <h1 className="text-2xl font-bold text-white max-w-md mx-auto leading-tight">{data.name}</h1>
        {data.brand && <p className="text-white/80 mt-2 text-sm">{data.brand}</p>}
      </div>

      <main className="mx-auto max-w-xl px-4 -mt-16 pb-12 space-y-5">
        {/* Status Card */}
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${statusInfo.bgColor} ring-8 ring-background`}>
            <StatusIcon className={`h-10 w-10 ${statusInfo.color}`} />
          </div>
          <span className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}>
            <StatusIcon className="h-4 w-4" /> {statusInfo.label}
          </span>
          {data.is_escrow && data.current_status !== "PENDING_PAYMENT" && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-4 py-1.5 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Escrow — Rp {data.price?.toLocaleString("id-ID")} (Lunas)
            </div>
          )}
        </div>

        {/* YouTube Video */}
        {role === "buyer" && ytId && (
          <div className="rounded-2xl border border-border overflow-hidden shadow-sm relative group">
            <div className="relative bg-black aspect-video">
              <iframe src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`} className="w-full h-full" allow="fullscreen; encrypted-media" allowFullScreen />
            </div>
            <button onClick={() => setVideoFullscreen(true)} className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" title="Perbesar Video">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Product Image */}
        {role === "buyer" && data.image_url && (
          <div className="rounded-2xl border border-border overflow-hidden shadow-sm relative group">
            <img src={data.image_url} alt={data.name} className="w-full h-56 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
              <button onClick={async () => { try { const res = await fetch(data.image_url); const blob = await res.blob(); await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]); toast.success("Foto berhasil disalin!"); } catch { toast.error("Gagal menyalin foto"); } }} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/40 backdrop-blur-md" title="Salin Foto">
                <Copy className="h-5 w-5" />
              </button>
              <button onClick={async () => { try { const res = await fetch(data.image_url); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Oziktag-QC-${data.name}.jpg`; a.click(); URL.revokeObjectURL(url); toast.success("Foto berhasil diunduh!"); } catch { toast.error("Gagal mengunduh foto"); } }} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/40 backdrop-blur-md" title="Unduh Foto">
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {role === "buyer" && data.ai_summary && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
            <button onClick={() => setShowAI(!showAI)} className="flex w-full items-center justify-between text-left">
              <span className="text-sm font-semibold text-primary flex items-center gap-2"><Sparkles className="h-4 w-4" /> Ringkasan Kualitas AI</span>
              {showAI ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-primary" />}
            </button>
            {showAI && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{data.ai_summary}</p>}
          </div>
        )}

        {/* Checklist */}
        {role === "buyer" && data.checklist_qc && data.checklist_qc.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Checklist QC Penjual</h3>
            <div className="space-y-2">
              {data.checklist_qc.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold mb-5 flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> Riwayat Perjalanan</h3>
          {data.history && data.history.length > 0 ? (
            <div className="space-y-0">
              {data.history.map((h: any, i: number) => (
                <div key={h.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 z-10 ${i === data.history.length - 1 ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground/30"}`} />
                    {i < data.history.length - 1 && <div className="w-0.5 flex-1 bg-border -my-1" />}
                  </div>
                  <div className="pb-6 min-w-0">
                    <p className={`text-sm font-medium ${i === data.history.length - 1 ? "text-foreground" : "text-muted-foreground"}`}>{h.status_update}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        {new Date(h.timestamp).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {h.latitude && h.longitude && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat perjalanan.</p>
          )}

          {/* Interactive Map */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-500" /> Peta Lokasi</h3>
            <TrackingMap history={data.history || []} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 pb-8 space-y-3">
          {role === "courier" && data.current_status !== "DELIVERED" && (
            <>
              <button onClick={handleCourierConfirm} disabled={confirming} className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <MapPin className="h-5 w-5" />{confirming ? "Merekam lokasi..." : "Konfirmasi Checkpoint Kurir"}
              </button>
              <button onClick={() => setShowPinModal(true)} className="w-full rounded-2xl border border-border bg-card py-4 text-sm font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2">
                <KeyRound className="h-4 w-4 text-orange-500" />Selesaikan Pesanan? (Masukkan PIN)
              </button>
            </>
          )}
          {role === "buyer" && data.current_status === "IN_TRANSIT" && (
            <button onClick={handleBuyerConfirm} disabled={confirming} className="w-full rounded-2xl bg-green-600 py-4 text-sm font-bold text-white shadow-lg shadow-green-500/25 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />{confirming ? "Memproses..." : "Konfirmasi Produk Diterima"}
            </button>
          )}
          
          {/* Dispute Section */}
          {role === "buyer" && data.current_status === "DELIVERED" && data.is_escrow && (
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              {data.escrow_status === "HELD" && data.delivered_at && (
                (() => {
                  const deliveredDate = new Date(data.delivered_at);
                  const expiryDate = new Date(deliveredDate.getTime() + 24 * 60 * 60 * 1000);
                  const now = new Date();
                  const diffHours = Math.max(0, (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));
                  
                  if (diffHours > 0) {
                    return (
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                        <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" /> Perlindungan Pembeli
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                          Dana Anda tertahan dengan aman di Oziktag Escrow selama 1x24 jam sejak diterima. 
                          Tersisa <strong>{Math.floor(diffHours)} jam {Math.floor((diffHours % 1) * 60)} menit</strong>. 
                          Jika pesanan tidak sesuai (misal isi batu), segera ajukan sengketa.
                        </p>
                        <button 
                          onClick={() => setShowDisputeModal(true)} 
                          className="w-full rounded-xl bg-red-500 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                          Ajukan Sengketa
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
              
              {data.escrow_status === "DISPUTED" && (
                <div className="rounded-2xl border border-red-500 bg-red-50 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Pesanan Dalam Sengketa</p>
                    <p className="text-xs text-red-600/80 mt-1">Anda telah mengajukan sengketa untuk pesanan ini. Dana dibekukan sementara, mohon tunggu email dari Admin Oziktag.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <DisputeModal
          productId={id as string}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={() => {
            setShowDisputeModal(false);
            loadData("buyer", pin);
          }}
        />
      )}
    </div>
  );
}
