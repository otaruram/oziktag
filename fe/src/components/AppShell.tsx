import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, QrCode, User, ShieldCheck, LogOut, Coins, Code2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { getCredits } from "@/lib/oziktag-store";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generator", label: "Generate QR", icon: QrCode },
  { to: "/api-keys", label: "API (Beta)", icon: Code2 },
  { to: "/pricing", label: "Top-Up", icon: Coins },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navRouter = useNavigate();
  const [credits, setCreditsState] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Auth Guard
    let sub: any;

    const checkAuthAndFetch = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navRouter({ to: "/" });
        return;
      }
      setAvatar(data.session.user.user_metadata?.avatar_url || "");
      // Fetch user data from backend
      try {
        const me = await apiFetch("/auth/me");
        setCreditsState(me.sisa_kredit);
        setIsAdmin(me.is_admin);
        
        // Use real backend status instead of localStorage
        if (!me.kyc_status && path !== "/register") {
          navRouter({ to: "/register" });
          return;
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }

      // Subscribe to user changes
      const uid = data.session.user.id;
      const channelName = `appshell-user-${uid}-${Date.now()}`;
      sub = supabase
        .channel(channelName)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, (payload) => {
          if (payload.new && payload.new.sisa_kredit !== undefined) {
            setCreditsState(payload.new.sisa_kredit);
          }
        })
        .subscribe();
    };

    checkAuthAndFetch();

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [path, navRouter]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    navRouter({ to: "/" });
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary hover:ring-2 hover:ring-primary/50 transition-all"
              >
                {avatar ? (
                  <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-md border border-border bg-card p-1 shadow-[var(--shadow-elegant)]">
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profil
                    </Link>
                    <button
                      onClick={(e) => {
                        setIsDropdownOpen(false);
                        handleLogout(e);
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>

            <Link to="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="hidden sm:inline">Oziktag</span>
            </Link>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = path === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  path === "/admin"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/pricing"
              className="hidden items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs sm:inline-flex"
              title="Top-Up Kredit"
            >
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold text-primary">{credits}</span>
            </Link>
          </div>
        </div>
        <div className="flex gap-1 border-t border-border px-4 py-2 md:hidden">
          {nav.map((item) => {
            const active = path === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs ${
                  active ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}