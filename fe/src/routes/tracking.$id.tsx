import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck, Package, Truck, CheckCircle2, AlertCircle,
  MapPin, Clock, Sparkles, Eye, EyeOff, Loader2, KeyRound
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

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
  PACKED: { label: "Dikemas", color: "text-yellow-600", icon: Package, bgColor: "bg-yellow-500/15" },
  IN_TRANSIT: { label: "Dalam Perjalanan", color: "text-blue-600", icon: Truck, bgColor: "bg-blue-500/15" },
  DELIVERED: { label: "Diterima", color: "text-green-600", icon: CheckCircle2, bgColor: "bg-green-500/15" },
};

function TrackingScan() {
  const { id } = Route.useParams();
  const [data, setData] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [role, setRole] = useState<"buyer" | "courier">("courier");
  const [pin, setPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  
  const [showAI, setShowAI] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
    // Check if we have a saved PIN in localStorage
    const savedPin = localStorage.getItem(`tracking_pin_${id}`);
    if (savedPin) {
      setPin(savedPin);
      loadData("buyer", savedPin);
    } else {
      // Default load as courier (public view)
      loadData("courier");
    }
  }, [id]);

  const handleCourierConfirm = async () => {
    setConfirming(true);
    try {
      toast.loading("Menangkap lokasi GPS...", { id: "courier-scan" });

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await apiFetch("/tracking/scan", {
        method: "POST",
        body: JSON.stringify({
          product_id: id,
          role: "courier",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
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
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch { /* geolocation optional for buyer */ }

      await apiFetch("/tracking/scan", {
        method: "POST",
        body: JSON.stringify({
          product_id: id,
          role: "buyer",
          pin: pin,
          lat,
          lng,
        }),
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
          <p className="mt-2 text-sm text-muted-foreground">
            Produk ini belum terdaftar atau sudah dihapus.
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[data.current_status] || STATUS_MAP.PACKED;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* PIN Modal Overlay */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 mb-4">
              <KeyRound className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Akses Pembeli</h2>
            <p className="text-sm text-center text-muted-foreground mb-6">
              Masukkan PIN rahasia yang Anda terima dari penjual untuk menyelesaikan pesanan.
            </p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="text"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="XXXXYYYY"
                className="w-full text-center text-3xl font-mono tracking-[0.2em] rounded-xl border border-border bg-input/40 py-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none uppercase"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 font-medium hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-orange-600 py-2.5 font-medium text-white hover:bg-orange-700"
                >
                  Buka Kunci
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Label Style */}
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
        </div>

        {/* Product Image (buyer only) */}
        {role === "buyer" && data.image_url && (
          <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
            <img src={data.image_url} alt={data.name} className="w-full h-56 object-cover" />
          </div>
        )}

        {/* AI Summary (buyer only) */}
        {role === "buyer" && data.ai_summary && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
            <button
              onClick={() => setShowAI(!showAI)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Ringkasan Kualitas AI
              </span>
              {showAI ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-primary" />}
            </button>
            {showAI && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {data.ai_summary}
              </p>
            )}
          </div>
        )}

        {/* Checklist (buyer only) */}
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
          <h3 className="text-sm font-semibold mb-5 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" /> Riwayat Perjalanan
          </h3>
          {data.history && data.history.length > 0 ? (
            <div className="space-y-0">
              {data.history.map((h: any, i: number) => (
                <div key={h.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 z-10 ${i === data.history.length - 1 ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground/30"}`} />
                    {i < data.history.length - 1 && <div className="w-0.5 flex-1 bg-border -my-1" />}
                  </div>
                  <div className="pb-6 min-w-0">
                    <p className={`text-sm font-medium ${i === data.history.length - 1 ? "text-foreground" : "text-muted-foreground"}`}>
                      {h.status_update}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        {new Date(h.timestamp).toLocaleString("id-ID", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      {h.latitude && h.longitude && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada riwayat perjalanan.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 pb-8 space-y-3">
          {role === "courier" && data.current_status !== "DELIVERED" && (
            <>
              <button
                onClick={handleCourierConfirm}
                disabled={confirming}
                className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MapPin className="h-5 w-5" />
                {confirming ? "Merekam lokasi..." : "Konfirmasi Checkpoint Kurir"}
              </button>
              
              <button
                onClick={() => setShowPinModal(true)}
                className="w-full rounded-2xl border border-border bg-card py-4 text-sm font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="h-4 w-4 text-orange-500" />
                Selesaikan Pesanan? (Masukkan PIN)
              </button>
            </>
          )}

          {role === "buyer" && data.current_status === "IN_TRANSIT" && (
            <button
              onClick={handleBuyerConfirm}
              disabled={confirming}
              className="w-full rounded-2xl bg-green-600 py-4 text-sm font-bold text-white shadow-lg shadow-green-500/25 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              {confirming ? "Memproses..." : "Konfirmasi Produk Diterima"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
