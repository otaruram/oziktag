import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/payment/cancel")({
  component: PaymentCancel,
});

function PaymentCancel() {
  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <XCircle className="h-20 w-20 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pembayaran Dibatalkan</h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          Proses pembayaran telah dibatalkan atau belum diselesaikan. Saldo Anda tidak terpotong. Silakan coba lagi jika Anda masih ingin melakukan Top-Up.
        </p>
        <Link
          to="/pricing"
          className="mt-8 rounded-md bg-secondary border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors shadow-sm"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </AppShell>
  );
}
