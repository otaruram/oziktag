import { useState, useEffect, useMemo } from 'react';
import { Seat, Ticket, AttendeeInfo, PaymentMethod } from '@/types/ticketing';
import {
  ticketingRepository,
  EVENT_DETAILS,
  TIER_CONFIGS,
  getOrCreateSessionId,
  computeEscrowBreakdown,
} from '@/lib/ticketing-store';
import { toast } from 'sonner';
import {
  Clock,
  ShieldCheck,
  X,
  QrCode,
  Wallet,
  Building,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface EscrowCheckoutModalProps {
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (ticket: Ticket) => void;
}

export function EscrowCheckoutModal({
  seat,
  isOpen,
  onClose,
  onBookingSuccess,
}: EscrowCheckoutModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS_OZIKTAG');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [idNumber, setIdNumber] = useState('');

  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  useEffect(() => {
    if (!isOpen || !seat) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiresAt = seat.holdExpiresAt || now + 300 * 1000;
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        ticketingRepository.releaseSeatHold(seat.id, sessionId);
        toast.error('Waktu Tahan Kursi (5 Menit) Habis', {
          description: `Kursi ${seat.id} telah dikembalikan ke status Tersedia (Available).`,
        });
        onClose();
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [isOpen, seat, sessionId, onClose]);

  if (!isOpen || !seat) return null;

  const tierConfig = TIER_CONFIGS[seat.tier];
  const { gross, escrowFee, netAmount } = computeEscrowBreakdown(seat.price);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = secondsRemaining < 60;

  const handleCancelAndRelease = () => {
    ticketingRepository.releaseSeatHold(seat.id, sessionId);
    toast.info(`Kunci kursi ${seat.id} telah dilepas.`);
    onClose();
  };

  const handleFillDemoAttendee = () => {
    setFullName('Raka Pratama Wijaya');
    setEmail('raka.wijaya@itb.ac.id');
    setPhone('081288997766');
    setInstitution('Tim Ganesha AI — Bandung Build Challenge');
    setIdNumber('3273012811020001');
    toast.success('Data peserta demo berhasil diisi otomatis.');
  };

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error('Mohon lengkapi Nama, Email, dan Nomor WhatsApp.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const attendee: AttendeeInfo = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        institution: institution.trim() || 'Peserta Umum Summarecon Bandung',
        idNumber: idNumber.trim() || undefined,
      };

      const result = ticketingRepository.completeBooking(
        seat.id,
        sessionId,
        attendee,
        paymentMethod
      );

      setIsProcessing(false);

      if (!result.success || !result.ticket) {
        toast.error('Pembayaran Gagal Diproses', {
          description: result.error,
        });
        onClose();
        return;
      }

      toast.success('Pembayaran Berhasil — Dana Diamankan di Oziktag Escrow!', {
        description: `E-Pass Kursi ${seat.id} telah diterbitkan dengan segel HMAC-SHA256.`,
      });

      onBookingSuccess(result.ticket);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Top Countdown Banner */}
        <div
          className={`flex items-center justify-between px-6 py-3.5 text-xs font-bold text-white transition-colors ${
            isUrgent ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" style={{ animationDuration: '6s' }} />
            <span>KURSI {seat.id} DIKUNCI SEMENTARA (ATOMIC TTL HOLD)</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 font-mono text-sm">
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Oziktag Escrow-Protected Checkout
            </span>
            <h2 className="mt-1.5 text-xl font-bold text-slate-900">
              Konfirmasi Kursi {seat.id} ({tierConfig?.label || seat.tier})
            </h2>
            <p className="text-xs text-slate-500">
              {EVENT_DETAILS.name} • {EVENT_DETAILS.venue}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancelAndRelease}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitCheckout} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Escrow Routing Breakdown Box */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                Skema Proteksi Dana Oziktag Escrow
              </span>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                Escrow Held
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Dana pembelian tiket Anda <strong>tidak langsung cair</strong> ke penyelenggara, melainkan ditahan di rekening <strong>Oziktag Escrow</strong> dan baru otomatis masuk ke <strong>Dompet Penghasilan Organizer</strong> saat QR E-Pass Anda valid di-scan di Gate Summarecon Mall Bandung.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/70 text-center">
              <div className="rounded-xl bg-white p-2 border border-emerald-100">
                <p className="text-[10px] text-slate-500">Harga Tiket</p>
                <p className="text-xs font-bold text-slate-900">Rp {gross.toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-xl bg-white p-2 border border-emerald-100">
                <p className="text-[10px] text-slate-500">Biaya Escrow (2.5%)</p>
                <p className="text-xs font-semibold text-slate-600">Rp {escrowFee.toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-xl bg-white p-2 border border-emerald-200">
                <p className="text-[10px] text-emerald-700 font-medium">Settlement ke Dompet</p>
                <p className="text-xs font-extrabold text-emerald-700">Rp {netAmount.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          {/* Attendee Form */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Identitas Pemegang Tiket (E-Pass)
              </h3>
              <button
                type="button"
                onClick={handleFillDemoAttendee}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <Sparkles className="h-3 w-3" /> Isi Cepat (Demo)
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Peserta *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Raka Pratama Wijaya"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Aktif *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institusi / Startup / Tim (Opsional)
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Contoh: ITB / Unpad / UMKM Bandung"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Metode Pembayaran Escrow
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  { id: 'QRIS_OZIKTAG', label: 'QRIS Oziktag', sub: 'Instant Escrow', icon: QrCode },
                  { id: 'ESCROW_WALLET', label: 'Saldo Oziktag', sub: 'Auto-Hold', icon: Wallet },
                  { id: 'VIRTUAL_ACCOUNT', label: 'Virtual Account', sub: 'BCA / Mandiri', icon: Building },
                ] as const
              ).map((pm) => {
                const Icon = pm.icon;
                const active = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-1.5 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold">{pm.label}</span>
                    <span className={`text-[10px] ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                      {pm.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancelAndRelease}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal & Lepas Kursi
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-700 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Memproses ke Escrow...</span>
              ) : (
                <>
                  <span>Bayar Rp {gross.toLocaleString('id-ID')} via Escrow</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

