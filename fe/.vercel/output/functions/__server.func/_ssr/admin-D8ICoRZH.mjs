import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CyXwpKPM.mjs";
import { a as apiFetch } from "./api-C3EYwLtX.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { U as Users, k as Activity, h as Package, l as Ban, d as Search, m as CircleMinus, n as CirclePlus, c as CircleCheck, o as ShieldAlert } from "../_libs/lucide-react.mjs";
import { f as format } from "../_libs/date-fns.mjs";
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
import "./supabase-CicGwi1Y.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function AdminPage() {
  const [stats, setStats] = reactExports.useState(null);
  const [users, setUsers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [search, setSearch] = reactExports.useState("");
  const nav = useNavigate();
  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([apiFetch("/admin/stats"), apiFetch("/admin/users")]);
      setStats(statsRes);
      setUsers(usersRes);
    } catch (e) {
      if (e.message?.includes("403")) {
        toast.error("Akses ditolak. Hanya admin yang bisa mengakses halaman ini.");
        nav({
          to: "/dashboard"
        });
      } else {
        toast.error("Gagal memuat data admin");
      }
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3e4);
    return () => clearInterval(interval);
  }, []);
  const handleAddCredit = async (user) => {
    const amountStr = prompt(`Berapa kredit yang ingin ditambahkan untuk ${user.email}?`);
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) return toast.error("Nominal tidak valid");
    try {
      await apiFetch(`/admin/credits/add`, {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          amount
        })
      });
      toast.success(`Berhasil menambahkan ${amount} kredit ke ${user.email}`);
      fetchData();
    } catch (e) {
      toast.error("Gagal menambahkan kredit");
    }
  };
  const handleReduceCredit = async (user) => {
    const amountStr = prompt(`Berapa kredit yang ingin dikurangi dari ${user.email}? (Sisa: ${user.sisa_kredit})`);
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) return toast.error("Nominal tidak valid");
    try {
      await apiFetch(`/admin/credits/add`, {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          amount: -amount
        })
      });
      toast.success(`Berhasil mengurangi ${amount} kredit dari ${user.email}`);
      fetchData();
    } catch (e) {
      toast.error("Gagal mengurangi kredit");
    }
  };
  const handleToggleBan = async (user) => {
    if (user.is_admin) return toast.error("Tidak bisa mem-ban admin");
    const action = user.is_banned ? "membuka blokir" : "memblokir";
    if (!confirm(`Yakin ingin ${action} user ${user.email}?`)) return;
    try {
      await apiFetch(`/admin/users/ban`, {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          banned: !user.is_banned
        })
      });
      toast.success(`Berhasil ${action} user`);
      fetchData();
    } catch (e) {
      toast.error(`Gagal ${action} user`);
    }
  };
  const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()) || u.nama.toLowerCase().includes(search.toLowerCase()));
  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 15 * 60 * 1e3;
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-64 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Admin Dashboard" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Kelola pengguna, kredit, dan sistem." })
    ] }),
    stats && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Total Pengguna", value: stats.total_users, icon: Users }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Pengguna Aktif (15m)", value: stats.online_users, icon: Activity, highlight: true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Total Produk Di-scan", value: stats.total_products, icon: Package }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Pengguna Diblokir", value: stats.banned_users, icon: Ban })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 rounded-xl border border-border bg-card shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "Daftar Pengguna" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full sm:w-72", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", placeholder: "Cari email atau nama...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-secondary/50 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 font-medium", children: "Pengguna" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 font-medium", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 font-medium", children: "Kredit" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 font-medium", children: "Bergabung" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-right font-medium", children: "Aksi" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: filteredUsers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "p-8 text-center text-muted-foreground", children: "Tidak ada pengguna ditemukan." }) }) : filteredUsers.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "transition-colors hover:bg-muted/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-foreground", children: u.nama || "Tanpa Nama" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: u.email }),
            u.is_admin && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 inline-block rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary", children: "ADMIN" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: u.is_banned ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "h-3 w-3" }),
            " Banned"
          ] }) : isOnline(u.last_seen_at) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400" }),
            " Online"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground", children: "Offline" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold", children: [
            u.sisa_kredit,
            " 🪙"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-xs text-muted-foreground", children: format(new Date(u.created_at), "dd MMM yyyy") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleReduceCredit(u), title: "Kurangi Kredit", className: "rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleMinus, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleAddCredit(u), title: "Tambah Kredit", className: "rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleToggleBan(u), title: u.is_banned ? "Unban User" : "Ban User", className: `rounded-md p-1.5 ${u.is_banned ? "text-green-600 hover:bg-green-50" : "text-destructive hover:bg-destructive/10"} ${u.is_admin ? "cursor-not-allowed opacity-50" : ""}`, disabled: u.is_admin, children: u.is_banned ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-4 w-4" }) })
          ] }) })
        ] }, u.id)) })
      ] }) })
    ] })
  ] });
}
function StatCard({
  title,
  value,
  icon: Icon,
  highlight = false
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-xl border bg-card p-6 shadow-sm transition-all ${highlight ? "border-primary/50 shadow-[var(--shadow-elegant)]" : "border-border"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-medium text-muted-foreground", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `h-5 w-5 ${highlight ? "text-primary" : "text-muted-foreground/50"}` })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-3xl font-semibold tracking-tight", children: value })
  ] });
}
export {
  AdminPage as component
};
