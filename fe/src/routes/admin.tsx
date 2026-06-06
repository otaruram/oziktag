import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Users, Activity, Ban, Package, Search, PlusCircle, MinusCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — Oziktag" }] }),
  component: AdminPage,
});

type AdminStats = {
  total_users: number;
  total_products: number;
  total_transactions: number;
  online_users: number;
  banned_users: number;
};

type UserItem = {
  id: string;
  nama: string;
  email: string;
  sisa_kredit: number;
  is_banned: boolean;
  is_admin: boolean;
  last_seen_at: string | null;
  created_at: string;
};

function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const nav = useNavigate();

  const fetchData = async () => {
    try {
      // Parallel fetch
      const [statsRes, usersRes] = await Promise.all([
        apiFetch("/admin/stats"),
        apiFetch("/admin/users"),
      ]);
      setStats(statsRes);
      setUsers(usersRes);
    } catch (e: any) {
      if (e.message?.includes("403")) {
        toast.error("Akses ditolak. Hanya admin yang bisa mengakses halaman ini.");
        nav({ to: "/dashboard" });
      } else {
        toast.error("Gagal memuat data admin");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Optional: Refresh every 30s for online status
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCredit = async (user: UserItem) => {
    const amountStr = prompt(`Berapa kredit yang ingin ditambahkan untuk ${user.email}?`);
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) return toast.error("Nominal tidak valid");

    try {
      await apiFetch(`/admin/credits/add`, {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, amount }),
      });
      toast.success(`Berhasil menambahkan ${amount} kredit ke ${user.email}`);
      fetchData();
    } catch (e) {
      toast.error("Gagal menambahkan kredit");
    }
  };

  const handleReduceCredit = async (user: UserItem) => {
    const amountStr = prompt(`Berapa kredit yang ingin dikurangi dari ${user.email}? (Sisa: ${user.sisa_kredit})`);
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) return toast.error("Nominal tidak valid");

    try {
      // Use negative amount in our system if you implemented a reduce endpoint,
      // but if we only have /credits/add, we can send negative amount.
      // Wait, let's check what the backend supports. The backend /admin/credits/add accepts amount.
      await apiFetch(`/admin/credits/add`, {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, amount: -amount }),
      });
      toast.success(`Berhasil mengurangi ${amount} kredit dari ${user.email}`);
      fetchData();
    } catch (e) {
      toast.error("Gagal mengurangi kredit");
    }
  };

  const handleToggleBan = async (user: UserItem) => {
    if (user.is_admin) return toast.error("Tidak bisa mem-ban admin");
    const action = user.is_banned ? "membuka blokir" : "memblokir";
    if (!confirm(`Yakin ingin ${action} user ${user.email}?`)) return;

    try {
      await apiFetch(`/admin/users/ban`, {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, banned: !user.is_banned }),
      });
      toast.success(`Berhasil ${action} user`);
      fetchData();
    } catch (e) {
      toast.error(`Gagal ${action} user`);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.nama.toLowerCase().includes(search.toLowerCase())
  );

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 15 * 60 * 1000; // 15 minutes threshold as defined in backend
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kelola pengguna, kredit, dan sistem.</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Pengguna" value={stats.total_users} icon={Users} />
          <StatCard title="Pengguna Aktif (15m)" value={stats.online_users} icon={Activity} highlight />
          <StatCard title="Total Produk Di-scan" value={stats.total_products} icon={Package} />
          <StatCard title="Pengguna Diblokir" value={stats.banned_users} icon={Ban} />
        </div>
      )}

      <div className="mt-10 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Daftar Pengguna</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari email atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Pengguna</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Kredit</th>
                <th className="px-6 py-3 font-medium">Bergabung</th>
                <th className="px-6 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{u.nama || "Tanpa Nama"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      {u.is_admin && (
                        <span className="mt-1 inline-block rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          ADMIN
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_banned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                          <Ban className="h-3 w-3" /> Banned
                        </span>
                      ) : isOnline(u.last_seen_at) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400" /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{u.sisa_kredit} 🪙</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {format(new Date(u.created_at), "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReduceCredit(u)}
                          title="Kurangi Kredit"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAddCredit(u)}
                          title="Tambah Kredit"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleBan(u)}
                          title={u.is_banned ? "Unban User" : "Ban User"}
                          className={`rounded-md p-1.5 ${
                            u.is_banned
                              ? "text-green-600 hover:bg-green-50"
                              : "text-destructive hover:bg-destructive/10"
                          } ${u.is_admin ? "cursor-not-allowed opacity-50" : ""}`}
                          disabled={u.is_admin}
                        >
                          {u.is_banned ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ title, value, icon: Icon, highlight = false }: any) {
  return (
    <div
      className={`rounded-xl border bg-card p-6 shadow-sm transition-all ${
        highlight ? "border-primary/50 shadow-[var(--shadow-elegant)]" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className={`h-5 w-5 ${highlight ? "text-primary" : "text-muted-foreground/50"}`} />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
