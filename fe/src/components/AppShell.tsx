import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  QrCode,
  User,
  ShieldCheck,
  Shield,
  LogOut,
  Coins,
  Code2,
  Settings,
  Crown,
  Wallet,
  ChevronDown,
  Flame,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generator", label: "QR Seal", icon: QrCode },
  { to: "/tracking", label: "QR Shield", icon: Shield, badge: "GPS+PIN" },
  { to: "/wallet", label: "Escrow", icon: Wallet },
  { to: "/elite-hub", label: "Master Artisan", icon: Crown },
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

  const isApiRoute = path.startsWith("/api-keys");

  useEffect(() => {
    let sub: any;

    const checkAuthAndFetch = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navRouter({ to: "/" });
        return;
      }
      setAvatar(data.session.user.user_metadata?.avatar_url || "");

      try {
        const me = await apiFetch("/auth/me");
        setCreditsState(me.sisa_kredit);
        setApiCreditsState(me.api_kredit);
        setIsAdmin(me.is_admin);

        if (!me.kyc_status && path !== "/register") {
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
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${uid}` }, (payload) => {
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
    <div className="min-h-screen bg-[#121212] text-[#f4ecdd] flex flex-col font-sans selection:bg-orange-600 selection:text-white">
      {/* Budaya GO! × Werkstatt Obsidian Header */}
      <header className="sticky top-0 z-40 border-b border-[#383838] bg-[#121212]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Brand Lockup */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white shadow-xs group-hover:bg-orange-500 transition-colors">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-[#f4ecdd]">OZIKTAG</span>
                  <span className="kiln-stamp px-1.5 py-0.5 bg-[#fac603]/15 text-[#fac603] border border-[#fac603]/30 text-[9px]">
                    KARYA NUSANTARA
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#bdbdbd] uppercase tracking-widest hidden sm:block">
                  QR Seal • QR Shield • Escrow 24H
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 pl-6 border-l border-[#383838]">
              {nav.map((item) => {
                const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      active
                        ? "bg-orange-600 text-white shadow-xs"
                        : "text-[#bdbdbd] hover:bg-[#1c1c1c] hover:text-[#f4ecdd]"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-[#bdbdbd]"}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          active ? "bg-black/25 text-[#f4ecdd]" : "bg-[#2ea4a9]/15 text-[#2ea4a9] border border-[#2ea4a9]/30"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Cluster: Kiln Credit Pill & Profile */}
          <div className="flex items-center gap-3">
            <Link
              to="/pricing"
              className="flex items-center gap-2.5 rounded-lg border border-[#383838] bg-[#1c1c1c] px-3 py-1.5 text-xs font-mono hover:border-orange-500/50 hover:bg-[#262626] transition"
              title={isApiRoute ? "Top-Up Kredit API" : "Top-Up Kredit QR (1 QR = 1 Kredit)"}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-orange-600/20 text-[#ff792f]">
                {isApiRoute ? <Code2 className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <span className="text-[#f4ecdd]">
                  {isApiRoute ? (isAdmin ? "∞" : apiCredits) : isAdmin ? "∞" : credits}
                </span>
                <span className="text-[10px] text-[#bdbdbd] uppercase">{isApiRoute ? "API" : "KREDIT"}</span>
              </div>
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-[#262626] transition border border-[#383838] bg-[#1c1c1c]"
              >
                <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded bg-[#262626]">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-[#bdbdbd]" />
                  )}
                  {isAdmin && <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#fac603]" />}
                </div>
                <ChevronDown className="h-3 w-3 text-[#bdbdbd] hidden sm:block" />
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[#383838] bg-[#1c1c1c] p-1.5 shadow-[var(--shadow-werkstatt-lg)] animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-2 border-b border-[#383838] mb-1">
                      <p className="text-xs font-bold text-[#f4ecdd]">Akun Pelaku Budaya</p>
                      <p className="text-[10px] text-[#2ea4a9] font-mono truncate">
                        {isAdmin ? "Role: Kurator & Admin" : "Status: Pengrajin Terverifikasi"}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#bdbdbd] hover:bg-[#262626] hover:text-[#f4ecdd] transition-colors"
                    >
                      <User className="h-3.5 w-3.5" />
                      Profil Usaha & Kriya
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#fac603] hover:bg-[#fac603]/10 transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/pricing"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#bdbdbd] hover:bg-[#262626] hover:text-[#f4ecdd] transition-colors"
                    >
                      <Coins className="h-3.5 w-3.5" />
                      Top-Up Kredit QR
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#bdbdbd] hover:bg-[#262626] hover:text-[#f4ecdd] transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Pengaturan
                    </Link>
                    <div className="my-1 h-px bg-[#383838]" />
                    <button
                      onClick={(e) => {
                        setIsDropdownOpen(false);
                        handleLogout(e);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex gap-1.5 overflow-x-auto border-t border-[#383838] px-4 py-2 lg:hidden scrollbar-none">
          {nav.map((item) => {
            const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-orange-600 text-white" : "text-[#bdbdbd] hover:bg-[#1c1c1c] hover:text-[#f4ecdd]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8">{children}</main>

      {/* Footer matching budayago.id + Werkstatt technical signature */}
      <footer className="border-t border-[#383838] bg-[#1c1c1c] py-6 text-xs text-[#bdbdbd] font-mono">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex h-2 w-2 rounded-full bg-[#2ea4a9] animate-pulse" />
            <span className="text-[#f4ecdd]">OZIKTAG // EKOSISTEM KEPERCAYAAN BUDAYA DIGITAL</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>QR Seal AI</span>
            <span className="text-[#383838]">•</span>
            <span>QR Shield GPS+PIN</span>
            <span className="text-[#383838]">•</span>
            <span>Escrow 24 Jam (Patuh OJK/BI)</span>
            <span className="text-[#383838]">•</span>
            <Link to="/docs" className="text-[#fac603] hover:underline underline-offset-2">
              Dokumentasi API
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
