import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, QrCode, User, ShieldCheck, LogOut, Coins } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { getCredits } from "@/lib/oziktag-store";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generator", label: "Generate QR", icon: QrCode },
  { to: "/pricing", label: "Top-Up", icon: Coins },
  { to: "/profile", label: "Profil", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navRouter = useNavigate();
  const [credits, setCreditsState] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Auth Guard
    let sub: any;

    const checkAuthAndFetch = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navRouter({ to: "/" });
        return;
      }
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
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>Oziktag</span>
          </Link>
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
          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="hidden items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs sm:inline-flex"
              title="Top-Up Kredit"
            >
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold text-primary">{credits}</span>
            </Link>
            <a
              href="#"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </a>
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