import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { ShieldCheck, Sparkles } from "lucide-react";
import { setBrand } from "@/lib/oziktag-store";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Daftar — Oziktag" },
      { name: "description", content: "Daftar akun Oziktag dan lengkapi KYC brand UMKM Anda." },
    ],
  }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [form, setForm] = useState({
    brand: "",
    email: "",
    password: "",
    ktp: "",
    npwp: "",
    foto_ktp: null as File | null,
    foto_npwp: null as File | null,
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const performCheck = async (session: any) => {
      if (!session) {
        nav({ to: "/" });
        return;
      }
      try {
        const me = await apiFetch("/auth/me");
        if (me.kyc_status) {
          nav({ to: "/dashboard" });
        } else {
          setCheckingAuth(false);
        }
      } catch (err) {
        setCheckingAuth(false);
      }
    };

    const init = async () => {
      // If we are coming from an OAuth redirect, Supabase needs time to parse the hash.
      if (window.location.hash.includes("access_token")) {
        // Just wait for onAuthStateChange to fire.
        // If it doesn't fire within 3 seconds, fallback.
        timeoutId = setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          performCheck(data.session);
        }, 3000);
        return;
      }

      const { data } = await supabase.auth.getSession();
      performCheck(data.session);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        clearTimeout(timeoutId);
        performCheck(session);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      authListener.subscription.unsubscribe();
    };
  }, [nav]);

  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Loading...</div></div>;
  }

  const DUMMIES = [
    { brand: "Kopi Senja Nusantara", email: "owner@kopisenja.id", ktp: "3174051203900001", npwp: "09.876.543.2-901.000" },
    { brand: "Batik Sekar Wangi", email: "hello@batiksekar.com", ktp: "3274051203900002", npwp: "09.876.543.2-901.001" },
    { brand: "Sambal Bu Rudi Jkt", email: "admin@sambalburudi.id", ktp: "3374051203900003", npwp: "09.876.543.2-901.002" },
    { brand: "Kerajinan Kayu Jati", email: "craft@kayujati.id", ktp: "3474051203900004", npwp: "09.876.543.2-901.003" },
  ];

  const autofill = () => {
    const d = DUMMIES[Math.floor(Math.random() * DUMMIES.length)];
    setForm({
      brand: d.brand,
      email: d.email,
      password: "demo-password-" + Math.floor(Math.random() * 1000),
      ktp: d.ktp,
      npwp: d.npwp,
      foto_ktp: null,
      foto_npwp: null,
    });
    toast.success("Data KYC dummy berhasil diisi");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.ktp) {
      toast.error("Nama brand dan KTP wajib diisi");
      return;
    }

    try {
      toast.loading("Memproses KYC...", { id: "kyc" });

      let ktpUrl = undefined;
      let npwpUrl = undefined;

      if (form.foto_ktp || form.foto_npwp) {
        toast.loading("Mengunggah foto dokumen...", { id: "kyc" });
        const formData = new FormData();
        if (form.foto_ktp) formData.append("images", form.foto_ktp);
        if (form.foto_npwp) formData.append("images", form.foto_npwp);

        const uploadData = await apiFetch("/qc/upload", {
          method: "POST",
          body: formData,
        });

        if (form.foto_ktp && form.foto_npwp) {
          ktpUrl = uploadData.urls[0];
          npwpUrl = uploadData.urls[1];
        } else if (form.foto_ktp) {
          ktpUrl = uploadData.urls[0];
        } else if (form.foto_npwp) {
          npwpUrl = uploadData.urls[0];
        }
      }

      const res = await apiFetch("/auth/kyc", {
        method: "POST",
        body: JSON.stringify({
          nama_toko: form.brand,
          nik: form.ktp,
          npwp: form.npwp || "",
          foto_ktp: ktpUrl,
          foto_npwp: npwpUrl,
        }),
      });
      setBrand(form.brand || "Brand UMKM");
      toast.success(res.message || "Form telah diverifikasi.", { id: "kyc", duration: 6000 });
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Gagal verifikasi KYC", { id: "kyc" });
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" /> Oziktag
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Buat akun brand Anda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lengkapi data berikut. Hanya butuh 1 menit.
        </p>

        <button
          type="button"
          onClick={autofill}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15"
        >
          <Sparkles className="h-4 w-4" /> Simulasi Auto-Fill (Demo)
        </button>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Nama Brand / Toko">
            <input
              required
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              className={inputCls}
              placeholder="Toko Saya"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputCls}
              placeholder="email@brand.id"
            />
          </Field>
          <Field label="Password">
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className={inputCls}
              placeholder="Minimal 8 karakter"
            />
          </Field>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Verifikasi KYC
            </p>
            <div className="mt-3 space-y-3">
              <Field label="Nomor KTP">
                <input
                  required
                  value={form.ktp}
                  onChange={(e) => update("ktp", e.target.value)}
                  className={inputCls}
                  placeholder="16 digit NIK"
                />
              </Field>
              <Field label={<>NPWP <span className="text-muted-foreground">(opsional)</span></>}>
                <input
                  value={form.npwp}
                  onChange={(e) => update("npwp", e.target.value)}
                  className={inputCls}
                  placeholder="00.000.000.0-000.000"
                />
              </Field>
              <Field label={<>Foto KTP <span className="text-muted-foreground">(opsional)</span></>}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => update("foto_ktp", e.target.files?.[0] as any)}
                  className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"}
                />
              </Field>
              <Field label={<>Foto NPWP <span className="text-muted-foreground">(opsional)</span></>}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => update("foto_npwp", e.target.files?.[0] as any)}
                  className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"}
                />
              </Field>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90"
          >
            Daftar & Lanjut ke Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}