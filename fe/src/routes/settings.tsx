import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Settings as SettingsIcon, HelpCircle, MessageCircle, Bell, Shield, PaintBucket } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — Oziktag" }] }),
  component: SettingsPage,
});

function SettingsPage() {
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
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <PaintBucket className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Tampilan</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm font-medium">Tema Gelap (Dark Mode)</p>
                  <p className="text-xs text-muted-foreground">Oziktag secara otomatis mengikuti tema perangkat Anda.</p>
                </div>
                <div className="h-5 w-10 rounded-full bg-primary/20 p-0.5">
                  <div className="h-4 w-4 rounded-full bg-primary translate-x-5" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Notifikasi</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm font-medium">Email Promosi & Berita</p>
                  <p className="text-xs text-muted-foreground">Terima informasi update fitur terbaru Oziktag.</p>
                </div>
                <div className="h-5 w-10 rounded-full bg-secondary p-0.5">
                  <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />
                </div>
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
