import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, QrCode, User, ShieldCheck, LogOut, Coins, Code2, Settings, Crown, MapPin, Wallet } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { getCredits } from "@/lib/oziktag-store";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generator", label: "Generate QR", icon: QrCode },
  { to: "/tracking", label: "Tracking", icon: MapPin },
  { to: "/api-keys", label: "API (Beta)", icon: Code2 },
  { to: "/elite-hub", label: "Elite Hub", icon: Crown },
  { to: "/pricing", label: "Top-Up", icon: Coins },
  { to: "/wallet", label: "Dompet", icon: Wallet },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navRouter = useNavigate();
  const [credits, setCreditsState] = useState(0);
  const [apiCredits, setApiCreditsState] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isApiRoute = path.startsWith("/api-keys");

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
        setApiCreditsState(me.api_kredit);
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
          if (payload.new) {
            if (payload.new.sisa_kredit !== undefined) setCreditsState(payload.new.sisa_kredit);
            if (payload.new.api_kredit !== undefined) setApiCreditsState(payload.new.api_kredit);
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
            </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/pricing"
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 sm:px-3 py-1.5 text-xs"
              title={isApiRoute ? "Top-Up Kredit API" : "Top-Up Kredit QR"}
            >
              {isApiRoute ? <Code2 className="h-3.5 w-3.5 text-primary" /> : <Coins className="h-3.5 w-3.5 text-primary" />}
              <span className="font-semibold text-primary">{isApiRoute ? (isAdmin ? "∞" : apiCredits) : (isAdmin ? "∞" : credits)}</span>
              <span className="text-[10px] uppercase text-muted-foreground ml-1 hidden sm:inline">{isApiRoute ? "API" : "QR"}</span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary hover:ring-2 hover:ring-primary/50 transition-all"
              >
                {avatar ? (
                  <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {isAdmin && (
                <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-sm ring-2 ring-background z-10 pointer-events-none">
                  <Crown className="h-3 w-3 text-primary-foreground" />
                </div>
              )}

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-border bg-card p-1 shadow-[var(--shadow-elegant)]">
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profil
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Pengaturan
                    </Link>
                    <div className="my-1 h-px bg-border" />
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
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden border-t border-border px-4 py-2 md:hidden scrollbar-none whitespace-nowrap">
          {nav.map((item) => {
            const active = path === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs ${
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