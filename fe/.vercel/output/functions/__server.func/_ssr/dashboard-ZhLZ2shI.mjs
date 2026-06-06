import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CyXwpKPM.mjs";
import { g as getBrand } from "./oziktag-store-CeL0dM1Q.mjs";
import { a as apiFetch } from "./api-C3EYwLtX.mjs";
import { s as supabase } from "./supabase-CicGwi1Y.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { P as Plus, h as Package, i as ScanLine, L as LoaderCircle, j as CalendarDays, A as ArrowRight, T as Trash2 } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function Dashboard() {
  const [tags, setTags] = reactExports.useState([]);
  const [brand, setBrandName] = reactExports.useState("Brand UMKM");
  const [totalScans, setTotalScans] = reactExports.useState(0);
  const [totalProducts, setTotalProducts] = reactExports.useState(0);
  const [loading, setLoading] = reactExports.useState(true);
  const fetchAll = async () => {
    try {
      const [prodData, statsData] = await Promise.all([apiFetch("/qc/products"), apiFetch("/qc/stats")]);
      setTags(prodData);
      setTotalProducts(statsData.total_products);
      setTotalScans(statsData.total_scans);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    setBrandName(getBrand());
    fetchAll();
    let sub1;
    let sub2;
    supabase.auth.getUser().then(({
      data
    }) => {
      const uid = data.user?.id;
      if (!uid) return;
      sub1 = supabase.channel("dashboard-products").on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "qc_products",
        filter: `user_id=eq.${uid}`
      }, () => {
        fetchAll();
      }).subscribe();
      sub2 = supabase.channel("dashboard-scans").on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "product_scans",
        filter: `user_id=eq.${uid}`
      }, () => {
        fetchAll();
      }).subscribe();
    });
    return () => {
      if (sub1) supabase.removeChannel(sub1);
      if (sub2) supabase.removeChannel(sub2);
    };
  }, []);
  const handleDelete = async (id) => {
    if (!confirm("Hapus QR Code ini?")) return;
    try {
      await apiFetch(`/qc/${id}`, {
        method: "DELETE"
      });
      toast.success("Produk berhasil dihapus");
      setTags(tags.filter((t) => t.id !== id));
      setTotalProducts((prev) => prev - 1);
    } catch (e) {
      toast.error("Gagal menghapus produk");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Selamat datang," }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: brand })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/generator", className: "inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " Buat QR Code Kualitas"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Package, label: "Produk Terverifikasi", value: totalProducts.toString(), hint: "Total label QC aktif" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ScanLine, label: "Scan oleh Pembeli (bulan ini)", value: totalScans.toString(), hint: "Diperbarui realtime" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-medium uppercase tracking-wide text-muted-foreground", children: "Aktivitas Hari Ini" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground hidden sm:block", children: "Geser ←/→ untuk lihat lainnya" })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-40 items-center justify-center rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : tags.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-16 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Belum ada QR Code. Mulai dengan membuat label kualitas pertama Anda." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/generator", className: "mt-4 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " Buat QR pertama"
        ] })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "-mx-4 px-4 sm:mx-0 sm:px-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:thin]", children: tags.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "snap-start shrink-0 w-[80%] sm:w-[300px] rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-elegant)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-3 w-3" }),
            " ",
            t.category
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-muted-foreground inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-3 w-3" }),
            new Date(t.createdAt).toLocaleDateString("id-ID")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 line-clamp-2 text-sm font-semibold", children: t.nama_produk }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
          "Batch: ",
          t.batch || "—"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-1", children: [
          t.checklist.slice(0, 2).map((q) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground", children: [
            "✓ ",
            q
          ] }, q)),
          t.checklist.length > 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground", children: [
            "+",
            t.checklist.length - 2
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/scan/$id", params: {
            id: t.id
          }, className: "inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline", children: [
            "Lihat QR ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDelete(t.id), className: "text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors", title: "Hapus", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }, t.id)) }) })
    ] })
  ] });
}
function StatCard({
  icon: Icon,
  label,
  value,
  hint
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-primary" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-3xl font-semibold tracking-tight", children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: hint })
  ] });
}
export {
  Dashboard as component
};
