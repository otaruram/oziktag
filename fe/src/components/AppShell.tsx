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
  Flame,
  Hammer
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

const nav = [
  { to: "/dashboard", label: "Studio Dashboard", icon: LayoutDashboard },
  { to: "/events", label: "Tiket & Seat Map", icon: Ticket, badge: "Summarecon" },
  { to: "/generator", label: "Cetak Segel QR", icon: QrCode },
  { to: "/tracking", label: "Tracking Logistik", icon: MapPin },
  { to: "/wallet", label: "Dompet Escrow", icon: Wallet },
  { to: "/elite-hub", label: "Master Artisan", icon: Crown },
  { to: "/api-keys", label: "Developer API", icon: Code2 },
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-[#cc4a1e] selection:text-white">
      {/* 80% Werkstatt Architectural Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/90 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Brand Lockup: Werkstatt Font + Kiln Terracotta Seal */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1f1b18] text-white shadow-xs group-hover:bg-[#cc4a1e] transition-colors duration-200">
                <ShieldCheck className="h-5 w-5 text-orange-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-foreground font-mono">OZIKTAG</span>
                  {/* 20% Kiln Pottery Stamp */}
                  <span className="kiln-stamp px-1.5 py-0.5 rounded bg-[#cc4a1e]/10 text-[#cc4a1e] border border-[#cc4a1e]/20 text-[9px]">
                    WERKSTATT // KILN
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest hidden sm:block">
                  Artisan Quality & Event Protocol
                </span>
              </div>
            </Link>

            {/* Desktop Navigation: Bauhaus Werkstatt Precision Tabs */}
            <nav className="hidden lg:flex items-center gap-1 pl-6 border-l border-border/80">
              {nav.map((item) => {
                const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold tracking-tight transition-all duration-150 ${
                      active
                        ? "bg-[#1f1b18] text-white shadow-xs"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? "text-[#ea580c]" : "text-muted-foreground"}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        active ? "bg-[#ea580c] text-white" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Cluster: Kiln Kilowatt Credit Counter & Artisan Profile */}
          <div className="flex items-center gap-3">
            {hasSession === false && (path === "/events" || path.startsWith("/events")) ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="rounded-md bg-[#cc4a1e] px-4 py-2 text-xs font-bold text-white hover:bg-[#b83f15] transition shadow-xs"
                >
                  Masuk / Daftar
                </Link>
              </div>
            ) : (
              <>
                {/* Kiln Credit Tracker Pill */}
                <Link
                  to="/pricing"
                  className="flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-mono hover:border-[#cc4a1e]/40 hover:bg-[#cc4a1e]/5 transition shadow-xs"
                  title={isApiRoute ? "Top-Up Kredit API Studio" : "Top-Up Kredit Segel QR"}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#cc4a1e]/15 text-[#cc4a1e]">
                    {isApiRoute ? <Code2 className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
                  </div>
                  <div className="flex items-center gap-1 font-semibold">
                    <span className="text-foreground">
                      {isApiRoute ? (isAdmin ? "∞" : apiCredits) : (isAdmin ? "∞" : credits)}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">{isApiRoute ? "API" : "CREDIT"}</span>
                  </div>
                </Link>

                {/* Profile Dropdown with Werkstatt Border */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 rounded-md p-1 hover:bg-secondary transition border border-border"
                  >
                    <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded bg-muted">
                      {avatar ? (
                        <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      {isAdmin && (
                        <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#cc4a1e]" />
                      )}
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-border bg-card p-1.5 shadow-[var(--shadow-werkstatt-lg)] animate-in fade-in-50 zoom-in-95">
                        <div className="px-3 py-2 border-b border-border/80 mb-1">
                          <p className="text-xs font-bold text-foreground">Akun Studio</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            {isAdmin ? "Status: Studio Director" : "Status: Certified Artisan"}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <User className="h-3.5 w-3.5" />
                          Profil Bengkel / UMKM
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold text-[#cc4a1e] hover:bg-[#cc4a1e]/10 transition-colors"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Admin Workshop
                          </Link>
                        )}
                        <Link
                          to="/settings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          Konfigurasi
                        </Link>
                        <div className="my-1 h-px bg-border/80" />
                        <button
                          onClick={(e) => {
                            setIsDropdownOpen(false);
                            handleLogout(e);
                          }}
                          className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Keluar Studio
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Strip (Werkstatt functional tabs) */}
        <div className="flex gap-1 overflow-x-auto border-t border-border/80 px-4 py-2 lg:hidden scrollbar-none">
          {nav.map((item) => {
            const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition ${
                  active 
                    ? "bg-[#1f1b18] text-white shadow-xs" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`h-3 w-3 ${active ? "text-[#ea580c]" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Studio Content Canvas */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* 80% Werkstatt Architectural Technical Footer */}
      <footer className="border-t border-border/80 bg-card py-5 text-xs text-muted-foreground font-mono">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex h-2 w-2 rounded-full bg-[#cc4a1e] animate-pulse" />
            <span>OZIKTAG BENGKEL PROTOKOL // KILN SPEC v3.0</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Bandung Build Challenge 2026</span>
            <span>•</span>
            <span>Summarecon Sawarga Courtyard</span>
            <span>•</span>
            <Link to="/docs" className="hover:text-foreground underline underline-offset-2">Studio Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
