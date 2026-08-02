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
    website: "",
    deskripsi_produk: "",
    foto_ktp: null as File | null,
    foto_npwp: null as File | null,
    foto_produk_1: null as File | null,
    foto_produk_2: null as File | null,
  });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

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
    { brand: "Kopi Senja Nusantara", email: "owner@kopisenja.id", ktp: "3174051203900001", npwp: "09.876.543.2-901.000", web: "www.kopisenja.id", desc: "Kopi gayo premium dengan rasa terbaik." },
    { brand: "Batik Sekar Wangi", email: "hello@batiksekar.com", ktp: "3274051203900002", npwp: "09.876.543.2-901.001", web: "sekarwangi.com", desc: "Batik tulis khas pekalongan." },
    { brand: "Sambal Bu Rudi Jkt", email: "admin@sambalburudi.id", ktp: "3374051203900003", npwp: "09.876.543.2-901.002", web: "", desc: "Sambal bawang bu rudi terpedas." },
    { brand: "Kerajinan Kayu Jati", email: "craft@kayujati.id", ktp: "3474051203900004", npwp: "09.876.543.2-901.003", web: "kayucraft.id", desc: "Kerajinan ukiran dari kayu jati asli." },
  ];

  const autofill = async () => {
    const d = DUMMIES[Math.floor(Math.random() * DUMMIES.length)];
    
    // Create dummy image files
    const createDummyImage = async (text: string, color: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 400; canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 400, 400);
        ctx.fillStyle = "white";
        ctx.font = "24px sans-serif";
        ctx.fillText(text, 110, 200);
      }
      return new Promise<File>((resolve) => {
        canvas.toBlob((b) => resolve(new File([b!], `${text.replace(/\s+/g, '-')}.jpg`, { type: "image/jpeg" })));
      });
    };
    
    const fotoProduk1 = await createDummyImage("Foto Produk 1", "#4f46e5");
    const fotoProduk2 = await createDummyImage("Foto Produk 2", "#10b981");

    setForm({
      brand: d.brand,
      email: d.email,
      password: "demo-password-" + Math.floor(Math.random() * 1000),
      ktp: d.ktp,
      npwp: d.npwp,
      website: d.web,
      deskripsi_produk: d.desc,
      foto_ktp: null,
      foto_npwp: null,
      foto_produk_1: fotoProduk1,
      foto_produk_2: fotoProduk2,
    });
    toast.success("Data KYC dummy berhasil diisi");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.ktp || !form.deskripsi_produk || !form.foto_produk_1 || !form.foto_produk_2) {
      toast.error("Nama brand, KTP, Deskripsi, dan Foto Produk wajib diisi");
      return;
    }

    try {
      toast.loading("Memproses KYC...", { id: "kyc" });

      let ktpUrl = undefined;
      let npwpUrl = undefined;
      let foto1Url = "";
      let foto2Url = "";

      const imagesToUpload = [];
      if (form.foto_ktp) imagesToUpload.push({ key: "ktp", file: form.foto_ktp });
      if (form.foto_npwp) imagesToUpload.push({ key: "npwp", file: form.foto_npwp });
      if (form.foto_produk_1) imagesToUpload.push({ key: "foto1", file: form.foto_produk_1 });
      if (form.foto_produk_2) imagesToUpload.push({ key: "foto2", file: form.foto_produk_2 });

      if (imagesToUpload.length > 0) {
        toast.loading(`Mengunggah ${imagesToUpload.length} foto...`, { id: "kyc" });
        const formData = new FormData();
        for (const item of imagesToUpload) {
          formData.append("images", item.file);
        }

        const uploadData = await apiFetch("/qc/upload", {
          method: "POST",
          body: formData,
        });

        const urls = uploadData.urls || [];
        imagesToUpload.forEach((item, index) => {
          if (item.key === "ktp") ktpUrl = urls[index];
          if (item.key === "npwp") npwpUrl = urls[index];
          if (item.key === "foto1") foto1Url = urls[index];
          if (item.key === "foto2") foto2Url = urls[index];
        });
      }

      if (!foto1Url || !foto2Url) {
        throw new Error("Gagal mengunggah foto produk.");
      }

      const res = await apiFetch("/auth/kyc", {
        method: "POST",
        body: JSON.stringify({
          nama_toko: form.brand,
          nik: form.ktp,
          npwp: form.npwp || "",
          foto_ktp: ktpUrl,
          foto_npwp: npwpUrl,
          website: form.website || "",
          foto_produk_1: foto1Url,
          foto_produk_2: foto2Url,
          deskripsi_produk: form.deskripsi_produk,
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
              <Field label={<>Website Toko <span className="text-muted-foreground">(opsional)</span></>}>
                <input
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  className={inputCls}
                  placeholder="www.tokosaya.com"
                />
              </Field>
              <Field label="Deskripsi Produk">
                <textarea
                  required
                  value={form.deskripsi_produk}
                  onChange={(e) => update("deskripsi_produk", e.target.value)}
                  className={inputCls}
                  rows={3}
                  placeholder="Ceritakan tentang produk Anda secara detail..."
                />
              </Field>
              <Field label="Foto Produk 1">
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => update("foto_produk_1", e.target.files?.[0] as any)}
                  className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"}
                />
              </Field>
              <Field label="Foto Produk 2">
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => update("foto_produk_2", e.target.files?.[0] as any)}
                  className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"}
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