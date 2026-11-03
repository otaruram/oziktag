import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  QrCode, 
  User, 
  ShieldCheck, 
  LogOut, 
  Coins, 
  Code2, 
  Settings, 
  Crown, 
  MapPin, 
  Wallet, 
  Ticket,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/events", label: "Tiket Event", icon: Ticket, badge: "Summarecon" },
  { to: "/generator", label: "Generate QR", icon: QrCode },
  { to: "/tracking", label: "Tracking", icon: MapPin },
  { to: "/wallet", label: "Dompet Escrow", icon: Wallet },
  { to: "/elite-hub", label: "Elite Hub", icon: Crown },
  { to: "/api-keys", label: "API", icon: Code2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navRouter = useNavigate();
  const [credits, setCreditsState] = useState(0);
  const [apiCredits, setApiCreditsState] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const isApiRoute = path.startsWith("/api-keys");

  useEffect(() => {
    let sub: any;

    const checkAuthAndFetch = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setHasSession(false);
        if (path === "/events" || path.startsWith("/events")) {
          return;
        }
        navRouter({ to: "/" });
        return;
      }
      setHasSession(true);
      setAvatar(data.session.user.user_metadata?.avatar_url || "");
      
      try {
        const me = await apiFetch("/auth/me");
        setCreditsState(me.sisa_kredit);
        setApiCreditsState(me.api_kredit);
        setIsAdmin(me.is_admin);
        
        if (!me.kyc_status && path !== "/register" && !path.startsWith("/events")) {
          navRouter({ to: "/register" });
          return;
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }

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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Hallmark Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-foreground">Oziktag</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest hidden sm:block">
                  Trust & Ticketing
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-border/60">
              {nav.map((item) => {
                const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                      active
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? "text-orange-400" : "text-muted-foreground"}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${
                        active ? "bg-orange-500/20 text-orange-300" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Area: Credits & User */}
          <div className="flex items-center gap-3">
            {hasSession === false && (path === "/events" || path.startsWith("/events")) ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition shadow-xs"
                >
                  Masuk / Daftar
                </Link>
              </div>
            ) : (
              <>
                {/* Credits Pill */}
                <Link
                  to="/pricing"
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-orange-500/40 hover:bg-orange-50/30 transition shadow-xs"
                  title={isApiRoute ? "Top-Up Kredit API" : "Top-Up Kredit QR"}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-500/10 text-orange-600">
                    {isApiRoute ? <Code2 className="h-3 w-3" /> : <Coins className="h-3 w-3" />}
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="font-bold text-foreground">
                      {isApiRoute ? (isAdmin ? "∞" : apiCredits) : (isAdmin ? "∞" : credits)}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">{isApiRoute ? "API" : "QR"}</span>
                  </div>
                </Link>

                {/* Profile Avatar / Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 rounded-lg p-1 hover:bg-secondary transition"
                  >
                    <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-muted ring-1 ring-border">
                      {avatar ? (
                        <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      {isAdmin && (
                        <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-orange-500 ring-1 ring-white" />
                      )}
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-card p-1.5 shadow-[var(--shadow-hallmark-lg)] animate-in fade-in-50 zoom-in-95">
                        <div className="px-3 py-2 border-b border-border/60 mb-1">
                          <p className="text-xs font-bold text-foreground">Akun Oziktag</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {isAdmin ? "Status: Administrator" : "Status: Verified UMKM"}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <User className="h-3.5 w-3.5" />
                          Profil Bisnis
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Admin Console
                          </Link>
                        )}
                        <Link
                          to="/settings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          Pengaturan
                        </Link>
                        <div className="my-1 h-px bg-border/60" />
                        <button
                          onClick={(e) => {
                            setIsDropdownOpen(false);
                            handleLogout(e);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Keluar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Scroll Strip */}
        <div className="flex gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 lg:hidden scrollbar-none">
          {nav.map((item) => {
            const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-orange-400" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Hallmark Subtle Status Footer */}
      <footer className="border-t border-border/60 bg-card py-6 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px]">Oziktag Protocol • Sistem Escrow & Gate Aktif</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Bandung Build Challenge 2026</span>
            <span>•</span>
            <span>Summarecon Mall Bandung</span>
            <span>•</span>
            <Link to="/docs" className="hover:text-foreground transition underline underline-offset-2">Dokumentasi API</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
