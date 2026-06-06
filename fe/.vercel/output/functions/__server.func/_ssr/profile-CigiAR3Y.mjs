import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { A as AppShell } from "./AppShell-CyXwpKPM.mjs";
import { g as getBrand, s as setBrand } from "./oziktag-store-CeL0dM1Q.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { B as BadgeCheck } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__react-router.mjs";
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
import "./api-C3EYwLtX.mjs";
function Profile() {
  const [brand, setBrandLocal] = reactExports.useState("");
  reactExports.useEffect(() => {
    setBrandLocal(getBrand());
  }, []);
  const save = () => {
    setBrand(brand || "Brand UMKM");
    toast.success("Profil disimpan");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Profil Brand" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Kelola identitas dan paket Anda." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 grid gap-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl font-semibold text-primary-foreground", children: brand.slice(0, 1).toUpperCase() || "O" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold", children: brand || "Brand UMKM" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BadgeCheck, { className: "h-3.5 w-3.5" }),
            " KYC Terverifikasi"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Nama Brand", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: brand, onChange: (e) => setBrandLocal(e.target.value), className: inputCls }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Email", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, defaultValue: "owner@kopisenja.id" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Alamat", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, defaultValue: "Jl. Melati No. 12, Jakarta Selatan" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: save, className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90", children: "Simpan perubahan" })
      ] })
    ] }) })
  ] });
}
const inputCls = "w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-sm font-medium", children: label }),
    children
  ] });
}
export {
  Profile as component
};
