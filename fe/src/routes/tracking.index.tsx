import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

import { useTrackingProducts } from "@/hooks/useTrackingProducts";
import { TrackingCreateForm } from "@/components/tracking/TrackingCreateForm";
import { TrackingResult } from "@/components/tracking/TrackingResult";
import { TrackingList } from "@/components/tracking/TrackingList";
import { TrackingDeleteModal, TrackingProductModal } from "@/components/tracking/TrackingModals";

export const Route = createFileRoute("/tracking/")({
  head: () => ({ meta: [{ title: "Tracking — Oziktag" }] }),
  component: TrackingPage,
});

function TrackingPage() {
  const { products, page, setPage, hasMore, loading, refreshProducts } = useTrackingProducts();

  const [showForm, setShowForm] = useState(false);
  const [qrResult, setQrResult] = useState<any | null>(null);
  
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedProductQr, setSelectedProductQr] = useState<string | null>(null);
  const [selectedProductPaymentQr, setSelectedProductPaymentQr] = useState<string | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setQrResult(null);
  };

  const handleFormSuccess = (result: any) => {
    setQrResult(result);
    toast.success("Tracking product berhasil dibuat!");
    refreshProducts();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/tracking/seller/my-products/${id}`, { method: "DELETE" });
      toast.success("Riwayat berhasil dihapus!");
      setConfirmDelete(null);
      refreshProducts();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus riwayat");
    }
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

      {showForm && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          {qrResult ? (
            <TrackingResult qrResult={qrResult} onClose={resetForm} />
          ) : (
            <TrackingCreateForm onSuccess={handleFormSuccess} onCancel={resetForm} />
          )}
        </div>
      )}

      <TrackingList 
        products={products}
        loading={loading}
        page={page}
        hasMore={hasMore}
        onPageChange={setPage}
        onRefresh={refreshProducts}
        onCreateNewClick={() => setShowForm(true)}
        onDeleteRequest={setConfirmDelete}
        onProductClick={(p, qr, paymentQr) => {
          setSelectedProduct(p);
          setSelectedProductQr(qr);
          setSelectedProductPaymentQr(paymentQr || null);
        }}
      />

      {selectedProduct && (
        <TrackingProductModal 
          product={selectedProduct}
          qrDataUrl={selectedProductQr}
          paymentQrDataUrl={selectedProductPaymentQr}
          onClose={() => {
            setSelectedProduct(null);
            setSelectedProductQr(null);
            setSelectedProductPaymentQr(null);
          }}
        />
      )}

      {confirmDelete && (
        <TrackingDeleteModal 
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </AppShell>
  );
}
