import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck, Package, Truck, CheckCircle2, AlertCircle,
  MapPin, Clock, Sparkles, Eye, EyeOff, Loader2,
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
  const [role, setRole] = useState<"buyer" | "courier">("buyer");
  const [showAI, setShowAI] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const loadData = (viewRole: string) => {
    setLoaded(false);
    apiFetch(`/tracking/${id}?role=${viewRole}`)
      .then((res) => { setData(res); setLoaded(true); })
      .catch(() => { setData(null); setLoaded(true); });
  };

  useEffect(() => {
    loadData(role);
  }, [id, role]);

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
      loadData(role);
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
          lat,
          lng,
        }),
      });

      toast.success("Produk dikonfirmasi diterima!", { id: "buyer-scan" });
      loadData(role);
    } catch (err: any) {
      toast.error(err.message || "Gagal konfirmasi", { id: "buyer-scan" });
    } finally {
      setConfirming(false);
    }
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <ShieldCheck className="h-5 w-5" /> Oziktag
          </Link>
          <span className="text-xs text-muted-foreground">Supply Chain Tracking</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        {/* Role Switcher */}
        <div className="flex rounded-lg border border-border bg-card p-1 gap-1">
          <button
            onClick={() => setRole("buyer")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              role === "buyer" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            👤 Saya Pembeli
          </button>
          <button
            onClick={() => setRole("courier")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              role === "courier" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            🚚 Saya Kurir
          </button>
        </div>

        {/* Status Card */}
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${statusInfo.bgColor}`}>
            <StatusIcon className={`h-8 w-8 ${statusInfo.color}`} />
          </div>
          <h1 className="mt-4 text-xl font-bold">{data.name}</h1>
          <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
            <StatusIcon className="h-3.5 w-3.5" /> {statusInfo.label}
          </span>
          {data.brand && (
            <p className="mt-2 text-xs text-muted-foreground">
              oleh <span className="font-medium text-foreground">{data.brand}</span>
            </p>
          )}
        </div>

        {/* Product Image (buyer only) */}
        {role === "buyer" && data.image_url && (
          <div className="rounded-xl border border-border overflow-hidden">
            <img src={data.image_url} alt={data.name} className="w-full h-48 object-cover" />
          </div>
        )}

        {/* AI Summary (buyer only) */}
        {role === "buyer" && data.ai_summary && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <button
              onClick={() => setShowAI(!showAI)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Ringkasan AI
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
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Checklist QC Penjual</h3>
            <div className="space-y-2">
              {data.checklist_qc.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seller Notes (buyer only) */}
        {role === "buyer" && data.seller_notes && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-2">Catatan Penjual</h3>
            <p className="text-sm text-muted-foreground">{data.seller_notes}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Riwayat Perjalanan</h3>
          {data.history && data.history.length > 0 ? (
            <div className="space-y-4">
              {data.history.map((h: any, i: number) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 ${i === data.history.length - 1 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    {i < data.history.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className="text-sm font-medium">{h.status_update}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(h.timestamp).toLocaleString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      {h.latitude && h.longitude && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {h.scanned_by_role === "seller" ? "Penjual" : h.scanned_by_role === "courier" ? "Kurir" : "Pembeli"}
                    </span>
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
        {role === "courier" && data.current_status !== "DELIVERED" && (
          <button
            onClick={handleCourierConfirm}
            disabled={confirming}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            {confirming ? "Merekam lokasi..." : "Konfirmasi Checkpoint Kurir"}
          </button>
        )}

        {role === "buyer" && data.current_status === "IN_TRANSIT" && (
          <button
            onClick={handleBuyerConfirm}
            disabled={confirming}
            className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {confirming ? "Memproses..." : "Konfirmasi Produk Diterima"}
          </button>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4 pb-8">
          Dilindungi oleh <Link to="/" className="font-medium text-foreground hover:underline">Oziktag</Link> — Digital Trust Seal
        </p>
      </main>
    </div>
  );
}
