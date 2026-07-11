import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getBrand, setBrand } from "@/lib/oziktag-store";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profil — Oziktag" }] }),
  component: Profile,
});

function Profile() {
  const [brand, setBrandLocal] = useState("");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    setBrandLocal(getBrand());
    apiFetch("/auth/me").then((res) => {
      setProfile(res);
      if (res.nama_toko) setBrandLocal(res.nama_toko);
    }).catch(console.error);
  }, []);

  const save = () => {
    setBrand(brand || "Brand UMKM");
    toast.success("Profil disimpan");
  };



  return (
    <AppShell>
      <h1 className="text-3xl font-semibold tracking-tight">Profil Brand</h1>
      <p className="mt-1 text-sm text-muted-foreground">Kelola identitas dan paket Anda.</p>

      <div className="mt-8 grid gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl font-semibold text-primary-foreground">
              {brand.slice(0, 1).toUpperCase() || "O"}
            </div>
            <div>
              <p className="text-lg font-semibold">{brand || "Brand UMKM"}</p>
              {profile?.kyc_status === "verified" || profile?.kyc_status === "approved" ? (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" /> KYC Terverifikasi
                </span>
              ) : (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-600">
                  KYC Belum Lengkap
                </span>
              )}
            </div>
          </div>



          <div className="mt-6 space-y-4">
            <Field label="Nama Brand / Toko (Terkunci dari KYC)">
              <input
                value={brand}
                readOnly
                className={inputCls + " cursor-not-allowed bg-muted opacity-80"}
              />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={profile?.email || ""} readOnly />
            </Field>
            <Field label="Sisa Kredit QR">
              <input className={inputCls} value={profile?.sisa_kredit || 0} readOnly />
            </Field>
            <button
              onClick={save}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Simpan perubahan
            </button>
          </div>
        </div>
      </div>
    </AppShell>
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