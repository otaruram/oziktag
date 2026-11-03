import { useState, useEffect, useMemo } from 'react';
import { Seat, Ticket, AttendeeInfo, PaymentMethod } from '@/types/ticketing';
import {
  ticketingRepository,
  EVENT_DETAILS,
  TIER_CONFIGS,
  getOrCreateSessionId,
} from '@/lib/ticketing-store';
import { toast } from 'sonner';
import {
  Clock,
  ShieldCheck,
  X,
  CreditCard,
  QrCode,
  Wallet,
  Building,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SeatCheckoutModalProps {
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (ticket: Ticket) => void;
}

export function SeatCheckoutModal({
  seat,
  isOpen,
  onClose,
  onBookingSuccess,
}: SeatCheckoutModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 mins = 300s
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS_OZIKTAG');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [idNumber, setIdNumber] = useState('');

  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  // Sync remaining countdown time based on seat holdExpiresAt
  useEffect(() => {
    if (!isOpen || !seat) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiresAt = seat.holdExpiresAt || now + 300 * 1000;
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        toast.error('Waktu Reservasi Habis', {
          description: `Batas waktu 5 menit untuk kursi ${seat.id} telah berakhir. Kursi telah dirilis.`,
        });
        ticketingRepository.releaseSeatHold(seat.id, sessionId);
        onClose();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isOpen, seat, onClose, sessionId]);

  if (!isOpen || !seat) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isExpiringSoon = secondsRemaining <= 60;

  const handleCancelHold = () => {
    ticketingRepository.releaseSeatHold(seat.id, sessionId);
    toast.info(`Reservasi kursi ${seat.id} dibatalkan.`);
    onClose();
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error('Harap lengkapi nama, email, dan nomor WhatsApp.');
      return;
    }

    setIsProcessing(true);

    // Realistic network / escrow verification simulation
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const attendee: AttendeeInfo = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      institution: institution.trim() || 'Bandung Build Challenge 2026',
      idNumber: idNumber.trim() || 'ID-AUTO-GEN',
    };

    const res = ticketingRepository.completeBooking(seat.id, sessionId, attendee, paymentMethod);

    setIsProcessing(false);

    if (!res.success) {
      toast.error('Gagal Menyelesaikan Pemesanan', {
        description: res.error,
      });
      onClose();
      return;
    }

    toast.success('Pembayaran Berhasil & E-Ticket Terbit!', {
      description: `E-Ticket Oziktag untuk kursi ${seat.id} siap digunakan di Gate 2 Summarecon Mall Bandung.`,
    });

    if (res.ticket) {
      onBookingSuccess(res.ticket);
    }
  };

  const tierDetail = TIER_CONFIGS[seat.tier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={handleCancelHold}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl transition-all animate-in fade-in zoom-in-95">
        {/* Header & 5-minute Countdown Banner */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Oziktag Escrow Checkout
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Kursi: <strong className="text-slate-900">{seat.id}</strong> ({tierDetail.label})
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Konfirmasi Reservasi & Tiket
            </h3>
            <p className="text-xs text-slate-500">
              {EVENT_DETAILS.name} • {EVENT_DETAILS.venue}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelHold}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic 5-minute countdown status bar */}
        <div
          className={`mt-4 flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
            isExpiringSoon
              ? 'bg-rose-50 text-rose-800 border border-rose-300 animate-pulse'
              : 'bg-amber-50 text-amber-900 border border-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {isExpiringSoon
                ? 'Sesi checkout hampir habis! Segera selesaikan pembayaran:'
                : 'Kursi ini dikunci sementara untuk Anda selama:'}
            </span>
          </div>
          <span className="font-mono text-sm font-bold tracking-wider">
            {timeFormatted}
          </span>
        </div>

        <form onSubmit={handleSubmitBooking} className="mt-5 space-y-5">
          {/* Attendee Details Form */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Data Pengunjung (Attendee)
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Nama Lengkap Sesuai KTP / ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Raden Surya"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Alamat Email (Pengiriman E-Ticket) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="surya@techteam.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  No. WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Instansi / Startup / Tim BBC 2026
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tim Inovasi ITB / Oziktag"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Metode Pembayaran Instan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS_OZIKTAG')}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                  paymentMethod === 'QRIS_OZIKTAG'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  <span>QRIS Oziktag</span>
                </div>
                <span className="text-[11px] text-slate-500">Instan, bebas biaya admin</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ESCROW_WALLET')}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                  paymentMethod === 'ESCROW_WALLET'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <span>Dompet Oziktag</span>
                </div>
                <span className="text-[11px] text-slate-500">Saldo Escrow terverifikasi</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('VIRTUAL_ACCOUNT')}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                  paymentMethod === 'VIRTUAL_ACCOUNT'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Building className="h-4 w-4 text-purple-600" />
                  <span>Virtual Account</span>
                </div>
                <span className="text-[11px] text-slate-500">BCA, Mandiri, BNI</span>
              </button>
            </div>
          </div>

          {/* Pricing & Escrow Guarantee Summary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Biaya Tiket ({tierDetail.label} - {seat.id})</span>
              <span className="font-semibold text-slate-900">
                Rp {seat.price.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Biaya Penanganan & Sistem Kripto</span>
              <span className="font-semibold text-emerald-600">GRATIS (Rp 0)</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-sm font-bold text-slate-900">
              <span>Total Pembayaran</span>
              <span className="text-base text-slate-900">
                Rp {seat.price.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Escrow regulatory badge */}
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 border border-emerald-200">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Garansi Oziktag Escrow 24 Jam:</strong> Dana transaksi ditahan secara aman di payment gateway rekanan dan diteruskan sesuai regulasi Bank Indonesia.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelHold}
              disabled={isProcessing}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Lepas Kursi / Batal
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Memproses Pembayaran & E-Ticket...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>Simulasi Bayar Instan (Rp {seat.price.toLocaleString('id-ID')})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
