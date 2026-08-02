import { CheckCircle2, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface TrackingResultProps {
  qrResult: { url: string; qrDataUrl: string; summary: string; buyerPin: string };
  onClose: () => void;
}

export function TrackingResult({ qrResult, onClose }: TrackingResultProps) {
  return (
    <div className="text-center space-y-4">
      <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
      <h2 className="text-xl font-semibold">Tracking Berhasil Dibuat!</h2>
      <div className="mx-auto max-w-xs">
        <img src={qrResult.qrDataUrl} alt="QR Code" className="mx-auto w-48 h-48 rounded-lg border border-border" />
      </div>
      
      <div className="mx-auto max-w-xs rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
        <p className="text-sm text-orange-600 font-medium mb-1">PIN Rahasia Pembeli</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl font-bold tracking-[0.2em]">{qrResult.buyerPin}</span>
          <button 
            onClick={() => { navigator.clipboard.writeText(qrResult.buyerPin); toast.success("PIN disalin!"); }}
            className="text-orange-600 hover:text-orange-700 p-1"
            title="Salin PIN"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-orange-600/80 mt-2">Berikan PIN ini kepada pembeli agar mereka bisa mengkonfirmasi pesanan.</p>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground truncate max-w-xs">{qrResult.url}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(qrResult.url); toast.success("URL disalin!"); }}
          className="text-primary hover:opacity-80"
          title="Salin URL"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      
      {qrResult.summary && (
        <div className="mx-auto max-w-md rounded-lg bg-primary/5 border border-primary/20 p-4 text-left">
          <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI Summary
          </p>
          <p className="text-sm text-muted-foreground">{qrResult.summary}</p>
        </div>
      )}
      
      <button onClick={onClose} className="text-sm text-primary hover:underline">
        Tutup
      </button>
    </div>
  );
}
