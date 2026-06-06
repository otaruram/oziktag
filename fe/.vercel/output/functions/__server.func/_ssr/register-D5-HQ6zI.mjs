import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./supabase-CicGwi1Y.mjs";
import { a as apiFetch } from "./api-C3EYwLtX.mjs";
import { s as setBrand } from "./oziktag-store-CeL0dM1Q.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { S as ShieldCheck, a as Sparkles } from "../_libs/lucide-react.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function Register() {
  const nav = useNavigate();
  const [form, setForm] = reactExports.useState({
    brand: "",
    email: "",
    password: "",
    ktp: "",
    npwp: ""
  });
  const update = (k, v) => setForm((f) => ({
    ...f,
    [k]: v
  }));
  reactExports.useEffect(() => {
    const checkAuth = async () => {
      const {
        data
      } = await supabase.auth.getSession();
      if (!data.session) {
        nav({
          to: "/"
        });
        return;
      }
      if (localStorage.getItem("hasFilledForm")) {
        nav({
          to: "/dashboard"
        });
      }
    };
    checkAuth();
  }, [nav]);
  const DUMMIES = [{
    brand: "Kopi Senja Nusantara",
    email: "owner@kopisenja.id",
    ktp: "3174051203900001",
    npwp: "09.876.543.2-901.000"
  }, {
    brand: "Batik Sekar Wangi",
    email: "hello@batiksekar.com",
    ktp: "3274051203900002",
    npwp: "09.876.543.2-901.001"
  }, {
    brand: "Sambal Bu Rudi Jkt",
    email: "admin@sambalburudi.id",
    ktp: "3374051203900003",
    npwp: "09.876.543.2-901.002"
  }, {
    brand: "Kerajinan Kayu Jati",
    email: "craft@kayujati.id",
    ktp: "3474051203900004",
    npwp: "09.876.543.2-901.003"
  }];
  const autofill = () => {
    const d = DUMMIES[Math.floor(Math.random() * DUMMIES.length)];
    setForm({
      brand: d.brand,
      email: d.email,
      password: "demo-password-" + Math.floor(Math.random() * 1e3),
      ktp: d.ktp,
      npwp: d.npwp
    });
    toast.success("Data KYC dummy berhasil diisi");
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!form.brand || !form.ktp) {
      toast.error("Nama brand dan KTP wajib diisi");
      return;
    }
    try {
      toast.loading("Memproses KYC...", {
        id: "kyc"
      });
      const res = await apiFetch("/auth/kyc", {
        method: "POST",
        body: JSON.stringify({
          nama_toko: form.brand,
          nik: form.ktp,
          npwp: form.npwp || ""
        })
      });
      setBrand(form.brand || "Brand UMKM");
      localStorage.setItem("hasFilledForm", "true");
      toast.success(res.message || "Form telah diverifikasi.", {
        id: "kyc",
        duration: 6e3
      });
      nav({
        to: "/dashboard"
      });
    } catch (err) {
      toast.error(err.message || "Gagal verifikasi KYC", {
        id: "kyc"
      });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background px-6 py-12 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "mb-8 inline-flex items-center gap-2 font-semibold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5 text-primary" }),
      " Oziktag"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Buat akun brand Anda" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Lengkapi data berikut. Hanya butuh 1 menit." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: autofill, className: "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }),
      " Simulasi Auto-Fill (Demo)"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "mt-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Nama Brand / Toko", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, value: form.brand, onChange: (e) => update("brand", e.target.value), className: inputCls, placeholder: "Toko Saya" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Email", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, type: "email", value: form.email, onChange: (e) => update("email", e.target.value), className: inputCls, placeholder: "email@brand.id" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Password", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, type: "password", value: form.password, onChange: (e) => update("password", e.target.value), className: inputCls, placeholder: "Minimal 8 karakter" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Verifikasi KYC" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Nomor KTP", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, value: form.ktp, onChange: (e) => update("ktp", e.target.value), className: inputCls, placeholder: "16 digit NIK" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            "NPWP ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "(opsional)" })
          ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.npwp, onChange: (e) => update("npwp", e.target.value), className: inputCls, placeholder: "00.000.000.0-000.000" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90", children: "Daftar & Lanjut ke Dashboard" })
    ] })
  ] }) });
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
  Register as component
};
