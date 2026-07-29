import { useState } from "react";
import { toast } from "sonner";
import { X, Coins } from "lucide-react";
import { apiFetch } from "../../lib/api";
import QRCode from "qrcode";

export function PricingModal({ onClose }: { onClose: () => void }) {
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  if (selectedPkg) {
    return <RealCheckoutModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-[var(--shadow-elegant)] overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Biaya Pemakaian</p>
            <h3 className="mt-1 text-lg font-semibold">Pricing API (Pay-as-you-go)</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-secondary/30 p-5 text-center">
            <Coins className="h-10 w-10 text-primary mx-auto mb-3" />
            <h4 className="text-xl font-bold">1 Request = 1 Kredit</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Setiap kali Anda menembak API untuk membuat QR Code QC ataupun Tracking Lite, sistem akan otomatis memotong 1 kredit dari saldo akun Anda.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-sm font-semibold">Pilih Paket Kredit API</h5>
            <ul className="space-y-2">
              <button onClick={() => setSelectedPkg({ id: "api_starter", name: "Starter API", price: 20000, credits: 50 })} className="w-full flex items-center justify-between text-sm rounded-md border border-border bg-card p-3 hover:bg-secondary transition-colors text-left">
                <span><span className="font-medium">Starter</span> (50 kredit API)</span>
                <span className="font-mono text-muted-foreground">Rp 400 / req</span>
              </button>
              <button onClick={() => setSelectedPkg({ id: "api_growth", name: "Growth API", price: 50000, credits: 150 })} className="w-full flex items-center justify-between text-sm rounded-md border border-primary/40 bg-primary/5 p-3 hover:bg-primary/10 transition-colors text-left">
                <span><span className="font-medium text-primary">Growth</span> (150 kredit API)</span>
                <span className="font-mono text-muted-foreground">Rp 333 / req</span>
              </button>
              <button onClick={() => setSelectedPkg({ id: "api_pro", name: "Pro API", price: 100000, credits: 400 })} className="w-full flex items-center justify-between text-sm rounded-md border border-border bg-card p-3 hover:bg-secondary transition-colors text-left">
                <span><span className="font-medium">Pro</span> (400 kredit API)</span>
                <span className="font-mono text-muted-foreground">Rp 250 / req</span>
              </button>
            </ul>
          </div>
          
          <div className="rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Catatan:</span> Klik salah satu paket di atas untuk memulai transaksi riil menggunakan Louvin Payment.
          </div>
        </div>
      </div>
    </div>
  );
}

function RealCheckoutModal({ pkg, onClose }: { pkg: any, onClose: () => void }) {
  const [method, setMethod] = useState<"QRIS" | "GoPay">("QRIS");
  const [processing, setProcessing] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [deeplink, setDeeplink] = useState<string | null>(null);

  const createTransaction = async () => {
    setProcessing(true);
    try {
      const paymentType = method === "QRIS" ? "qris" : "gopay";
      const res = await apiFetch("/topup/create", {
        method: "POST",
        body: JSON.stringify({ 
          paket: "starter", // Fallback to starter price for prototype
          payment_type: paymentType,
          tipe_kredit: "API"
        })
      });
      if (res.qr_string) {
        const url = await QRCode.toDataURL(res.qr_string, { width: 300 });
        setQrImage(url);
        toast.success("Tagihan berhasil dibuat!");
      } else if (res.deeplink_url) {
        setDeeplink(res.deeplink_url);
        toast.success("Tagihan berhasil dibuat!");
      } else {
        toast.error("Tidak ada data QR/Deeplink dari server");
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat transaksi");
    } finally {
      setProcessing(false);
    }
  };

  const idr = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-[var(--shadow-elegant)] overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Checkout</p>
            <h3 className="mt-1 text-lg font-semibold">Paket {pkg.name} API</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Total bayar</span>
          <span className="text-lg font-semibold">{idr(pkg.price)}</span>
        </div>

        {qrImage || deeplink ? (
          <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-border bg-background/40 p-4 text-center">
            {qrImage && (
              <>
                <img src={qrImage} alt="QRIS" className="h-48 w-48 rounded-md bg-white p-2 shadow-sm" />
                <p className="mt-3 text-xs font-semibold text-primary">Scan dengan e-Wallet atau m-Banking</p>
              </>
            )}
            {deeplink && (
              <a href={deeplink} target="_blank" rel="noreferrer" className="mt-4 rounded-md bg-[#00AED6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90">
                Buka Aplikasi Gojek
              </a>
            )}
            <div className="mt-6 flex flex-col items-center gap-1.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
              </span>
              <p className="text-sm font-medium">Menunggu Pembayaran...</p>
              <p className="text-[11px] text-muted-foreground">Saldo Anda akan otomatis bertambah jika pembayaran berhasil.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Metode pembayaran</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["QRIS", "GoPay"] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${method === m ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
                  {m}
                </button>
              ))}
            </div>
            <button onClick={createTransaction} disabled={processing} className="mt-6 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90 disabled:opacity-60">
              {processing ? "Memproses..." : "Buat Tagihan (Bayar Asli)"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
