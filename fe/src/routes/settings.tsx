import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Settings as SettingsIcon, HelpCircle, MessageCircle, Bell, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — Oziktag" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [promoEmailEnabled, setPromoEmailEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // We could fetch actual current state here, but for now assuming it defaults to true
    // If the get_me API returns it, we can set it:
    apiFetch("/auth/me").then(res => {
       if (res.receivesPromoEmails !== undefined) {
         setPromoEmailEnabled(res.receivesPromoEmails);
       }
    }).catch(console.error);
  }, []);

  const handleTogglePromoEmail = async () => {
    setIsLoading(true);
    const newState = !promoEmailEnabled;
    try {
      await apiFetch("/auth/email-preferences", {
        method: "POST",
        body: JSON.stringify({ receives_promo_emails: newState })
      });
      setPromoEmailEnabled(newState);
      toast.success(newState ? "Email promosi diaktifkan" : "Email promosi dinonaktifkan");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah preferensi email");
    } finally {
      setIsLoading(false);
    }
  };

  const waNumber = "6285797968246";
  const waMessage = encodeURIComponent("Halo Admin Oziktag, saya butuh bantuan mengenai akun saya.");
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola preferensi akun dan dapatkan bantuan teknis.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Settings Column */}
        <div className="md:col-span-2 space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Notifikasi</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm font-medium">Email Promosi & Berita</p>
                  <p className="text-xs text-muted-foreground">Terima informasi update fitur terbaru & notifikasi akun.</p>
                </div>
                <button
                  onClick={handleTogglePromoEmail}
                  disabled={isLoading}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    promoEmailEnabled ? 'bg-primary' : 'bg-muted'
                  } ${isLoading ? 'opacity-50' : ''}`}
                >
                  <span className="sr-only">Toggle email promosi</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      promoEmailEnabled ? 'translate-x-2.5' : '-translate-x-2.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Privasi & Keamanan</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Data KYC Anda aman</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Kami menggunakan enkripsi standar industri untuk melindungi data identitas Anda (KTP/NPWP).
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Help Column */}
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Pusat Bantuan</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Mengalami kendala teknis atau memiliki pertanyaan seputar tagihan kredit? Tim support kami siap membantu Anda secara langsung via WhatsApp.
            </p>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20bd5a] transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Hubungi via WhatsApp
            </a>
            
            <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Nomor Support Resmi:</p>
              <p className="text-sm font-medium tracking-wider">0857-9796-8246</p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
