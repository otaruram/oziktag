import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/payment/success")({
  component: PaymentSuccess,
});

function PaymentSuccess() {
  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <CheckCircle2 className="h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pembayaran Berhasil!</h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          Terima kasih, pembayaran Anda telah kami terima. Kredit atau langganan Anda akan segera masuk ke akun secara otomatis dalam beberapa saat.
        </p>
        <Link
          to="/pricing"
          className="mt-8 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
        >
          Kembali ke Dashboard Pricing
        </Link>
      </div>
    </AppShell>
  );
}
