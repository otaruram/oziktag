import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useRouterState, d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./supabase-CicGwi1Y.mjs";
import { a as apiFetch } from "./api-C3EYwLtX.mjs";
import { S as ShieldCheck, p as LayoutDashboard, Q as QrCode, C as Coins, q as User, r as LogOut } from "../_libs/lucide-react.mjs";
const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generator", label: "Generate QR", icon: QrCode },
  { to: "/pricing", label: "Top-Up", icon: Coins },
  { to: "/profile", label: "Profil", icon: User }
];
function AppShell({ children }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navRouter = useNavigate();
  const [credits, setCreditsState] = reactExports.useState(0);
  const [isAdmin, setIsAdmin] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let sub;
    const checkAuthAndFetch = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navRouter({ to: "/" });
        return;
      }
      const hasFilledForm = localStorage.getItem("hasFilledForm");
      if (!hasFilledForm && path !== "/register") {
        navRouter({ to: "/register" });
        return;
      }
      try {
        const me = await apiFetch("/auth/me");
        setCreditsState(me.sisa_kredit);
        setIsAdmin(me.is_admin);
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
      const uid = data.session.user.id;
      const channelName = `appshell-user-${uid}-${Date.now()}`;
      sub = supabase.channel(channelName).on("postgres_changes", { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${uid}` }, (payload) => {
        if (payload.new && payload.new.sisa_kredit !== void 0) {
          setCreditsState(payload.new.sisa_kredit);
        }
      }).subscribe();
    };
    checkAuthAndFetch();
    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [path, navRouter]);
  const handleLogout = async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    navRouter({ to: "/" });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-6xl items-center justify-between px-6 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard", className: "flex items-center gap-2 font-semibold tracking-tight", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Oziktag" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "hidden items-center gap-1 md:flex", children: [
          nav.map((item) => {
            const active = path === item.to;
            const Icon = item.icon;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Link,
              {
                to: item.to,
                className: `flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }),
                  item.label
                ]
              },
              item.to
            );
          }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/admin",
              className: `flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${path === "/admin" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4" }),
                "Admin Panel"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/pricing",
              className: "hidden items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs sm:inline-flex",
              title: "Top-Up Kredit",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Coins, { className: "h-3.5 w-3.5 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-primary", children: credits })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: "#",
              onClick: handleLogout,
              className: "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
                " Keluar"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 border-t border-border px-4 py-2 md:hidden", children: nav.map((item) => {
        const active = path === item.to;
        const Icon = item.icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: item.to,
            className: `flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs ${active ? "bg-secondary text-foreground" : "text-muted-foreground"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }),
              item.label
            ]
          },
          item.to
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "mx-auto max-w-6xl px-6 py-10", children })
  ] });
}
export {
  AppShell as A
};
