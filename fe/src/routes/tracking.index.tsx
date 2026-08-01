import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Package, MapPin, Truck, CheckCircle2, Plus, QrCode, Sparkles, Copy, ArrowRight, X, Loader2, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { generateQrWithLogo } from "@/lib/qr";
import { toast } from "sonner";

export const Route = createFileRoute("/tracking/")({
  head: () => ({ meta: [{ title: "Tracking — Oziktag" }] }),
  component: TrackingPage,
});

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PACKED: { label: "Dikemas", color: "bg-yellow-500/15 text-yellow-600", icon: Package },
  IN_TRANSIT: { label: "Dalam Perjalanan", color: "bg-blue-500/15 text-blue-600", icon: Truck },
  DELIVERED: { label: "Diterima", color: "bg-green-500/15 text-green-600", icon: CheckCircle2 },
};

function TrackingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [customCheck, setCustomCheck] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // QR result
  const [qrResult, setQrResult] = useState<{ url: string; qrDataUrl: string; summary: string; buyerPin: string } | null>(null);

  // Selected product for modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedProductQr, setSelectedProductQr] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const DEFAULT_CHECKS = [
    "Produk sudah diperiksa kondisinya",
    "Kemasan rapi dan aman",
    "Label dan segel utuh",
    "Jumlah sesuai pesanan",
    "Foto kondisi produk sudah diambil",
  ];

  const fetchProducts = async (currentPage = 1) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/tracking/seller/my-products?page=${currentPage}`);
      setProducts(data);
      setHasMore(data.length === 10);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page);

    let sub: any;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const channelName = `tracking-escrow-${uid}-${Date.now()}`;
      sub = supabase
        .channel(channelName)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tracking_products', filter: `user_id=eq.${uid}` }, (payload) => {
          if (payload.old && payload.new) {
            if (payload.old.escrow_status === "HELD" && payload.new.escrow_status === "RELEASED") {
              toast.success(`Dana Escrow Berhasil Dicairkan! Produk: ${payload.new.name}`, {
                duration: 6000,
                icon: "💰"
              });
              // Refresh the list to reflect any changes if needed
              fetchProducts(page);
            }
          }
        })
        .subscribe();
    });

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [page]);

  const toggleCheck = (item: string) => {
    setChecklist((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const addCustomCheck = () => {
    if (customCheck.trim() && !checklist.includes(customCheck.trim())) {
      setChecklist((prev) => [...prev, customCheck.trim()]);
      setCustomCheck("");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nama produk wajib diisi");
    if (checklist.length === 0) return toast.error("Pilih minimal 1 checklist");
    if (!imageFile) return toast.error("Foto produk wajib di-upload");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("checklist_qc", JSON.stringify(checklist));
      formData.append("seller_notes", notes.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await apiFetch("/tracking/init", {
        method: "POST",
        body: formData,
      });

      const trackingUrl = `${window.location.origin}/tracking/${res.product_id}`;
      const qrDataUrl = await generateQrWithLogo(trackingUrl);

      setQrResult({
        url: trackingUrl,
        qrDataUrl,
        summary: res.ai_summary || "",
        buyerPin: res.buyer_pin || "000000",
      });

      toast.success("Tracking product berhasil dibuat!");
      fetchProducts(1);
      setPage(1);
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat tracking");
    } finally {
      setSubmitting(false);
    }
  };

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
      fetchProducts(page);
    } catch (err: any) {
      toast.error(err.message || "Gagal melakukan handover", { id: "handover" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/tracking/seller/my-products/${id}`, { method: "DELETE" });
      toast.success("Riwayat berhasil dihapus!");
      setConfirmDelete(null);
      fetchProducts(page);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus riwayat");
    }
  };

  const autoFill = async () => {
    setName("Kopi Gayo Premium 250gr (Tracking)");
    setChecklist([DEFAULT_CHECKS[0], DEFAULT_CHECKS[1], DEFAULT_CHECKS[2]]);
    setNotes("Tolong jangan dibanting ya mas kurir, kemasan rentan bocor. Pastikan disimpan di tempat kering.");
    
    // Create dummy image file
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = "white";
      ctx.font = "24px sans-serif";
      ctx.fillText("Foto Kopi Gayo", 110, 200);
    }
    const file = await new Promise<File>((resolve) => {
      canvas.toBlob((b) => resolve(new File([b!], `kopi-gayo.jpg`, { type: "image/jpeg" })));
    });

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    toast.success("Dummy data tracking diisi otomatis!");
  };

  const resetForm = () => {
    setShowForm(false);
    setQrResult(null);
    setName("");
    setChecklist([]);
    setNotes("");
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tracking Lite</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lacak perjalanan produk dari gudang Anda ke tangan pembeli.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Buat Tracking Baru
        </button>
      </div>

      {/* CREATE FORM / QR RESULT */}
      {showForm && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          {qrResult ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
              <h2 className="text-xl font-semibold">Tracking Berhasil Dibuat!</h2>
              <div className="mx-auto max-w-xs">
                <img src={qrResult.qrDataUrl} alt="QR Code" className="mx-auto w-48 h-48 rounded-lg border border-border" />
              </div>
              
              <div className="mx-auto max-w-xs rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
                <p className="text-sm text-orange-600 font-medium mb-1">PIN Rahasia Pembeli</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold tracking-[0.2em]">{qrResult.buyerPin}</span>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(qrResult.buyerPin); toast.success("PIN disalin!"); }}
                    className="text-orange-600 hover:text-orange-700 p-1"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-orange-600/80 mt-2">Berikan PIN ini kepada pembeli agar mereka bisa mengkonfirmasi pesanan.</p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground truncate max-w-xs">{qrResult.url}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(qrResult.url); toast.success("URL disalin!"); }}
                  className="text-primary hover:opacity-80"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {qrResult.summary && (
                <div className="mx-auto max-w-md rounded-lg bg-primary/5 border border-primary/20 p-4 text-left">
                  <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI Summary
                  </p>
                  <p className="text-sm text-muted-foreground">{qrResult.summary}</p>
                </div>
              )}
              <button onClick={resetForm} className="text-sm text-primary hover:underline">
                Tutup
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Buat Tracking Produk Baru</h2>
                <button
                  type="button"
                  onClick={autoFill}
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Auto-Fill Dummy Data
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Produk</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Contoh: Kopi Arabika Gayo 250gr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Checklist QC</label>
                <div className="space-y-2">
                  {DEFAULT_CHECKS.map((item) => (
                    <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.includes(item)}
                        onChange={() => toggleCheck(item)}
                        className="accent-primary"
                      />
                      {item}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    value={customCheck}
                    onChange={(e) => setCustomCheck(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-input/40 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="Tambah checklist kustom..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCheck())}
                  />
                  <button type="button" onClick={addCustomCheck} className="text-xs text-primary font-medium px-3">
                    Tambah
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Catatan Penjual</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Kondisi barang, tips penyimpanan, dll..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Foto Produk <span className="text-destructive">*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 rounded-lg object-cover border border-border" />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Membuat..." : "Buat & Generate QR"}
                </button>
                <button type="button" onClick={resetForm} className="rounded-md border border-border px-4 py-2.5 text-sm hover:bg-muted">
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* PRODUCTS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-border">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Belum ada tracking produk.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Buat sekarang <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          products.map((p: any) => {
            const statusInfo = STATUS_MAP[p.current_status] || STATUS_MAP.PACKED;
            const StatusIcon = statusInfo.icon;
            return (
              <div 
                key={p.id} 
                className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={async () => {
                  setSelectedProduct(p);
                  const url = `${window.location.origin}/tracking/${p.id}`;
                  const qr = await generateQrWithLogo(url);
                  setSelectedProductQr(qr);
                }}
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
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id); }}
                    className={`p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ${p.current_status !== "PACKED" ? "ml-auto sm:ml-0" : ""}`}
                    title="Hapus riwayat (Sembunyikan)"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {products.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50"
          >
            Kembali
          </button>
          <span className="text-sm font-medium">Halaman {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setSelectedProduct(null); setSelectedProductQr(null); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-bold mb-6 text-center">{selectedProduct.name}</h3>
            
            <div className="space-y-6 text-center">
              {selectedProductQr ? (
                <img src={selectedProductQr} alt="QR Code" className="mx-auto w-48 h-48 rounded-lg border border-border" />
              ) : (
                <div className="w-48 h-48 mx-auto flex items-center justify-center bg-muted rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              
              <div className="mx-auto max-w-xs rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
                <p className="text-sm text-orange-600 font-medium mb-1">PIN Rahasia Pembeli</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold tracking-[0.2em]">{selectedProduct.buyer_pin || "000000"}</span>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(selectedProduct.buyer_pin || "000000"); toast.success("PIN disalin!"); }}
                    className="text-orange-600 hover:text-orange-700 p-1"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm bg-muted p-3 rounded-lg">
                <span className="text-muted-foreground truncate flex-1 text-left text-xs">
                  {`${window.location.origin}/tracking/${selectedProduct.id}`}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tracking/${selectedProduct.id}`); toast.success("URL disalin!"); }}
                  className="text-primary hover:opacity-80 flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="pt-2">
                <Link
                  to={`/tracking/${selectedProduct.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  Buka Halaman Tracking <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Hapus Riwayat?</h3>
            <p className="text-sm text-muted-foreground mb-6">Tautan Tracking untuk pembeli akan tetap aktif selamanya. Ini hanya menyembunyikan produk dari dashboard Anda.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-medium hover:bg-secondary transition-colors">Batal</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 rounded-md bg-destructive py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
