import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useTrackingProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (currentPage = 1) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/tracking/seller/my-products?page=${currentPage}`);
      setProducts(data);
      setHasMore(data.length === 10); // Assuming 10 is the pagination limit
    } catch (error) {
      console.error("Failed to fetch tracking products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page);

    let sub: any;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      
      const channelName = `tracking-escrow-${uid}-${Date.now()}`;
      sub = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "tracking_products", filter: `user_id=eq.${uid}` },
          (payload) => {
            if (payload.old && payload.new) {
              if (payload.old.escrow_status === "HELD" && payload.new.escrow_status === "RELEASED") {
                toast.success(`Dana Escrow Berhasil Dicairkan! Produk: ${payload.new.name}`, {
                  duration: 6000,
                  icon: "💰",
                });
                fetchProducts(page);
              }
            }
          }
        )
        .subscribe();
    });

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [page, fetchProducts]);

  return {
    products,
    page,
    setPage,
    hasMore,
    loading,
    refreshProducts: () => fetchProducts(page),
  };
}
