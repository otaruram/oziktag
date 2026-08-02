import { Package, MapPin, Truck, CheckCircle2, QrCode, ArrowRight, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { generateHDTrackingLabel } from "@/lib/qr";

interface TrackingListProps {
  products: any[];
  loading: boolean;
  page: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onCreateNewClick: () => void;
  onDeleteRequest: (id: string) => void;
  onProductClick: (product: any, qrDataUrl: string) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PACKED: { label: "Dikemas", color: "bg-yellow-500/15 text-yellow-600", icon: Package },
  IN_TRANSIT: { label: "Dalam Perjalanan", color: "bg-blue-500/15 text-blue-600", icon: Truck },
  DELIVERED: { label: "Diterima", color: "bg-green-500/15 text-green-600", icon: CheckCircle2 },
};

export function TrackingList({
  products,
  loading,
  page,
  hasMore,
  onPageChange,
  onRefresh,
  onCreateNewClick,
  onDeleteRequest,
  onProductClick,
}: TrackingListProps) {

  const handleHandover = async (productId: string) => {
    try {
      toast.loading("Menangkap lokasi GPS...", { id: "handover" });

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await apiFetch("/tracking/scan", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          role: "seller",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      });

      toast.success("Produk berhasil diserahkan ke kurir!", { id: "handover" });
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal melakukan handover", { id: "handover" });
    }
  };

  const handleProductClick = async (p: any) => {
    const url = `${window.location.origin}/tracking/${p.id}`;
    const qr = await generateHDTrackingLabel(url, p.name, p.id);
    onProductClick(p, qr);
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Memuat data...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl border border-dashed border-border">
        <Package className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">Belum ada tracking produk.</p>
        <button
          onClick={onCreateNewClick}
          className="mt-3 text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          Buat sekarang <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((p: any) => {
        const statusInfo = STATUS_MAP[p.current_status] || STATUS_MAP.PACKED;
        const StatusIcon = statusInfo.icon;
        return (
          <div 
            key={p.id} 
            className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleProductClick(p)}
          >
            <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                <QrCode className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.last_update}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t border-border sm:border-0">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}>
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </span>
              {p.escrow_status === "RELEASED" && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                  💰 Dana Cair
                </span>
              )}
              {p.current_status === "PACKED" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleHandover(p.id); }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 ml-auto sm:ml-0"
                >
                  <MapPin className="h-3 w-3" /> Serahkan ke Kurir
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteRequest(p.id); }}
                className={`p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ${p.current_status !== "PACKED" ? "ml-auto sm:ml-0" : ""}`}
                title="Hapus riwayat (Sembunyikan)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50"
        >
          Kembali
        </button>
        <span className="text-sm font-medium">Halaman {page}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasMore}
          className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
