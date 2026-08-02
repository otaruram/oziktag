import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Coins, Check, Sparkles, History, X, QrCode as QrIcon, Crown, Award, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import QRCode from "qrcode";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Top-Up Kredit — Oziktag" }] }),
  component: Pricing,
});

type Pkg = {
  id: string;
  name: string;
  price: number;
  credits: number;
  highlight?: boolean;
  tagline: string;
};

const PACKAGES: Pkg[] = [
  { id: "starter", name: "Starter", price: 15000, credits: 50, tagline: "Cocok untuk UMKM pemula" },
  { id: "growth", name: "Growth", price: 35000, credits: 150, tagline: "Pilihan paling populer — hemat 22%", highlight: true },
  { id: "pro", name: "Pro", price: 79000, credits: 400, tagline: "Harga termurah per QR — hemat 34%" },
];

const BENEFITS = [
  "Akses penuh Dashboard QC",
  "Akses fitur Tracking Lite",
  "Integrasi AI Scanner",
  "QR aktif selamanya",
  "Halaman scan publik tanpa iklan",
  "Badge \"Artisan Elite\" di halaman scan publik",
  "Video pelatihan QC kerajinan tangan",
  "Tips & trik dari pengrajin berpengalaman",
  "Forum diskusi sesama pengrajin (coming soon)",
  "Prioritas dukungan Oziktag",
];

const idr = (n: number) => "Rp " + n.toLocaleString("id-ID");

function Pricing() {
  const [credits, setCreditsState] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selected, setSelected] = useState<Pkg | null>(null);
  const [isElite, setIsElite] = useState(false);
  const [eliteExpires, setEliteExpires] = useState<string | null>(null);
  const [eliteLoading, setEliteLoading] = useState(false);
  const [showEliteCheckout, setShowEliteCheckout] = useState(false);

  const fetchAll = async () => {
    try {
      const me = await apiFetch("/auth/me");
      setCreditsState(me.sisa_kredit);
      setIsElite(me.is_elite || false);
      setEliteExpires(me.elite_expires_at || null);
      const hist = await apiFetch("/topup/history");
      setHistory(hist);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAll();

    let sub: any;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;

      const channelName = `pricing-user-${uid}-${Date.now()}`;
      sub = supabase
        .channel(channelName)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, (payload) => {
          if (payload.new && payload.new.sisa_kredit !== undefined) {
            setCreditsState(payload.new.sisa_kredit);
          }
        })
        .subscribe();
    });

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, []);

  const refresh = () => {
    fetchAll();
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Top-Up Kredit QR</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            1 Kredit = 1× Generate QR QC atau 1× Tracking Lite. Bayar sesuai pemakaian (Pay-As-You-Go).
          </p>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary"
        >
          <History className="h-4 w-4" /> Riwayat
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-gradient-to-br from-card to-secondary/40 p-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Sisa Kredit QR Anda</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight">
            {credits}
            <span className="ml-2 text-base font-normal text-muted-foreground">kredit QR</span>
          </p>
        </div>
        <QrIcon className="h-12 w-12 text-primary/70" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PACKAGES.map((p) => (
          <PackageCard key={p.id} pkg={p} onPick={() => setSelected(p)} />
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-medium">Semua paket termasuk:</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" /> {b}
            </li>
          ))}
        </ul>
      </div>

      {/* NEW SECTION: ARTISAN ELITE */}
      <div className="mt-16">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Artisan Elite Membership</h2>
          <p className="mt-1 text-sm text-muted-foreground">Akses penuh ke Elite Hub, prioritas dukungan, dan badge khusus pada halaman scan.</p>
        </div>
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-background to-background p-8 md:flex md:items-center md:justify-between md:gap-8 shadow-[var(--shadow-elegant)]">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
               <Crown className="h-6 w-6 text-primary" />
               <h3 className="text-xl font-bold">Artisan Elite</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Tingkatkan level bisnis Anda dengan panduan eksklusif, forum, dan badge verified.</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> Akses Penuh Elite Hub</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> Badge "Verified Artisan Elite"</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> Video Pelatihan Eksklusif</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> Dukungan Prioritas 24/7</li>
            </ul>
          </div>
          <div className="mt-8 md:mt-0 flex flex-col items-center justify-center rounded-xl bg-card border border-border p-6 shadow-sm min-w-[250px] shrink-0">
             <p className="text-3xl font-bold tracking-tight">Rp 49.900</p>
             <p className="text-sm text-muted-foreground mt-1">/ bulan</p>
             {isElite ? (
                <div className="mt-6 w-full rounded-md bg-secondary py-2.5 text-center text-sm font-medium text-foreground opacity-80 cursor-not-allowed">
                  Member Aktif
                </div>
             ) : (
                <button
                  onClick={() => setShowEliteCheckout(true)}
                  className="mt-6 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 shadow-sm"
                >
                  Berlangganan Sekarang
                </button>
             )}
          </div>
        </div>
      </div>

      {selected && (
        <CheckoutModal
          pkg={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {showEliteCheckout && (
        <EliteCheckoutModal onClose={() => setShowEliteCheckout(false)} />
      )}

      {showHistory && (
        <HistoryModal history={history} onClose={() => setShowHistory(false)} />
      )}
    </AppShell>
  );
}

function PackageCard({ pkg, onPick }: { pkg: Pkg; onPick: () => void }) {
  const perQr = Math.round(pkg.price / pkg.credits);
  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-card p-6 transition-colors ${
        pkg.highlight ? "border-primary/60 shadow-[var(--shadow-elegant)]" : "border-border"
      }`}
    >
      {pkg.highlight && (
        <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[11px] font-medium text-primary-foreground">
          <Sparkles className="h-3 w-3" /> Paling Laris
        </span>
      )}
      <p className="text-sm font-medium text-muted-foreground">Paket {pkg.name}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{idr(pkg.price)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{pkg.tagline}</p>

      <div className="mt-5 rounded-lg border border-border bg-background/40 p-4">
        <p className="text-2xl font-semibold text-primary">{pkg.credits} Kredit QR</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Setara {idr(perQr)} / QR Code
        </p>
      </div>

      <button
        onClick={onPick}
        className={`mt-6 w-full rounded-md py-2.5 text-sm font-medium transition-colors ${
          pkg.highlight
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "border border-border bg-background hover:bg-secondary"
        }`}
      >
        Pilih Paket
      </button>
    </div>
  );
}

function CheckoutModal({
  pkg,
  onClose,
}: {
  pkg: Pkg;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<"QRIS" | "GoPay">("QRIS");
  const [processing, setProcessing] = useState(false);

  const createTransaction = async () => {
    setProcessing(true);
    try {
      const paymentType = method === "QRIS" ? "qris" : "gopay";
      const res = await apiFetch("/topup/create", {
        method: "POST",
        body: JSON.stringify({ paket: pkg.id, payment_type: paymentType })
      });
      
      // SumoPod uses hosted checkout. qr_string contains the checkout URL.
      if (res.qr_string) {
        window.location.href = res.qr_string;
      } else if (res.deeplink_url) {
        window.location.href = res.deeplink_url;
      } else {
        toast.error("Tidak ada link pembayaran dari server");
        setProcessing(false);
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat transaksi");
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Checkout</p>
            <h3 className="mt-1 text-lg font-semibold">Paket {pkg.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Total bayar</span>
          <span className="text-lg font-semibold">{idr(pkg.price)}</span>
        </div>

        {processing ? (
          <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-border bg-background/40 p-6 text-center">
            <div className="mt-2 flex flex-col items-center gap-1.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
              </span>
              <p className="text-sm font-medium mt-2">Mengarahkan ke Halaman Pembayaran...</p>
              <p className="text-[11px] text-muted-foreground mt-1">Mohon tunggu sebentar.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Metode pembayaran
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["QRIS", "GoPay"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    method === m
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={createTransaction}
              disabled={processing}
              className="mt-6 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90 disabled:opacity-60"
            >
              {processing ? "Memproses..." : "Buat Tagihan"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function HistoryModal({ history, onClose }: { history: any[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Riwayat</p>
            <h3 className="mt-1 text-lg font-semibold">Top-Up & Penggunaan</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 max-h-80 overflow-y-auto">
          {history.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Belum ada riwayat top-up.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">Paket {t.paket}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString("id-ID")} • {t.payment_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">+{t.credits} kredit</p>
                    <p className="text-xs text-muted-foreground">{idr(t.amount)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EliteCheckoutModal({ onClose }: { onClose: () => void }) {
  const [method, setMethod] = useState<"QRIS" | "GoPay">("QRIS");
  const [processing, setProcessing] = useState(false);

  const createSubscription = async () => {
    setProcessing(true);
    try {
      const paymentType = method === "QRIS" ? "qris" : "gopay";
      const res = await apiFetch(`/topup/subscribe-elite?payment_type=${paymentType}`, {
        method: "POST"
      });
      
      if (res.qr_string) {
        window.location.href = res.qr_string;
      } else if (res.deeplink_url) {
        window.location.href = res.deeplink_url;
      } else {
        toast.error("Tidak ada link pembayaran dari server");
        setProcessing(false);
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat transaksi langganan");
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Checkout</p>
            <h3 className="mt-1 text-lg font-semibold flex items-center gap-2">
               <Crown className="h-5 w-5 text-primary" /> Artisan Elite
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Total tagihan bulanan</span>
          <span className="text-lg font-semibold">Rp 49.900</span>
        </div>

        {processing ? (
          <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-border bg-background/40 p-6 text-center">
            <div className="mt-2 flex flex-col items-center gap-1.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
              </span>
              <p className="text-sm font-medium mt-2">Mengarahkan ke Halaman Pembayaran...</p>
              <p className="text-[11px] text-muted-foreground mt-1">Mohon tunggu sebentar.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Metode pembayaran
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["QRIS", "GoPay"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    method === m
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={createSubscription}
              disabled={processing}
              className="mt-6 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              Berlangganan
            </button>
          </>
        )}
      </div>
    </div>
  );
}