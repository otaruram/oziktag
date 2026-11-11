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
  head: () => ({ meta: [{ title: "QR Shield & Tracking — Oziktag" }] }),
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
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 mb-6 border-b border-border">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#2ea4a9]">
            02 / Pilar QR Shield Logistik
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#f4ecdd]">
            QR Shield &amp; Tracking Aman
          </h1>
          <p className="mt-1 text-sm text-[#bdbdbd]">
            Segel anti-tukar barang berbasis GPS kurir, PIN 6-digit pembeli, dan jaminan Escrow 24 jam.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 transition"
        >
          <Plus className="h-4 w-4" /> Buat QR Shield Baru
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
