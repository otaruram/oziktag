import { Q as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { T as Toaster } from "../_libs/sonner.mjs";
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
const appCss = "/assets/styles-x2-DLkr5.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$9 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Oziktag - Digital Trust Seal" },
      { name: "description", content: "Oz-Tag Trust Seal is a QR code-based digital trust platform for MSMEs to validate product quality." },
      { name: "author", content: "Oziktag" },
      { property: "og:title", content: "Oziktag - Digital Trust Seal" },
      { property: "og:description", content: "Oz-Tag Trust Seal is a QR code-based digital trust platform for MSMEs to validate product quality." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Oziktag" },
      { name: "twitter:title", content: "Oziktag - Digital Trust Seal" },
      { name: "twitter:description", content: "Oz-Tag Trust Seal is a QR code-based digital trust platform for MSMEs to validate product quality." },
      { property: "og:image", content: "/logo.png" },
      { name: "twitter:image", content: "/logo.png" }
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg"
      },
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$9.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { theme: "dark", position: "top-right", richColors: true })
  ] });
}
const $$splitComponentImporter$8 = () => import("./register-D5-HQ6zI.mjs");
const Route$8 = createFileRoute("/register")({
  head: () => ({
    meta: [{
      title: "Daftar — Oziktag"
    }, {
      name: "description",
      content: "Daftar akun Oziktag dan lengkapi KYC brand UMKM Anda."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./profile-CigiAR3Y.mjs");
const Route$7 = createFileRoute("/profile")({
  head: () => ({
    meta: [{
      title: "Profil — Oziktag"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./pricing-DGu5V6SL.mjs");
const Route$6 = createFileRoute("/pricing")({
  head: () => ({
    meta: [{
      title: "Top-Up Kredit — Oziktag"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./generator-DU5_TbXy.mjs");
const Route$5 = createFileRoute("/generator")({
  head: () => ({
    meta: [{
      title: "Generate QR — Oziktag"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./docs-DyjTtQJr.mjs");
const Route$4 = createFileRoute("/docs")({
  head: () => ({
    meta: [{
      title: "Dokumentasi — Oziktag"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./dashboard-ZhLZ2shI.mjs");
const Route$3 = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{
      title: "Dashboard — Oziktag"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./admin-D8ICoRZH.mjs");
const Route$2 = createFileRoute("/admin")({
  head: () => ({
    meta: [{
      title: "Admin Panel — Oziktag"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./index-FVvYq1v6.mjs");
const Route$1 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Oziktag — Digital Trust Seal untuk UMKM"
    }, {
      name: "description",
      content: "Validasi kualitas produk UMKM dengan QR Code tepercaya. Bangun kepercayaan pembeli dalam hitungan detik."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./scan._id-DoWtODGC.mjs");
const Route = createFileRoute("/scan/$id")({
  head: () => ({
    meta: [{
      title: "Verifikasi Produk — Oziktag"
    }, {
      name: "description",
      content: "Verifikasi keaslian dan QC produk via Oziktag."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const RegisterRoute = Route$8.update({
  id: "/register",
  path: "/register",
  getParentRoute: () => Route$9
});
const ProfileRoute = Route$7.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => Route$9
});
const PricingRoute = Route$6.update({
  id: "/pricing",
  path: "/pricing",
  getParentRoute: () => Route$9
});
const GeneratorRoute = Route$5.update({
  id: "/generator",
  path: "/generator",
  getParentRoute: () => Route$9
});
const DocsRoute = Route$4.update({
  id: "/docs",
  path: "/docs",
  getParentRoute: () => Route$9
});
const DashboardRoute = Route$3.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$9
});
const AdminRoute = Route$2.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => Route$9
});
const IndexRoute = Route$1.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$9
});
const ScanIdRoute = Route.update({
  id: "/scan/$id",
  path: "/scan/$id",
  getParentRoute: () => Route$9
});
const rootRouteChildren = {
  IndexRoute,
  AdminRoute,
  DashboardRoute,
  DocsRoute,
  GeneratorRoute,
  PricingRoute,
  ProfileRoute,
  RegisterRoute,
  ScanIdRoute
};
const routeTree = Route$9._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route as R,
  router as r
};
