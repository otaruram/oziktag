import { useState, useEffect } from 'react';
import { GateScanResult, Ticket } from '@/types/ticketing';
import { ticketingRepository, computeEscrowBreakdown } from '@/lib/ticketing-store';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import {
  Scan,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Ticket as TicketIcon,
  Volume2,
  VolumeX,
  Wallet,
  ArrowUpRight,
  History,
  Sparkles,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface GateScannerDashboardProps {
  initialTicketToScan?: Ticket | null;
  onScanCompleted?: (result: GateScanResult) => void;
}

export function GateScannerDashboard({
  initialTicketToScan,
  onScanCompleted,
}: GateScannerDashboardProps) {
  const [selectedGate, setSelectedGate] = useState('Gate 2 — West Lobby Summarecon Mall');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<GateScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<GateScanResult[]>([]);
  const [availableTickets, setAvailableTickets] = useState<Ticket[]>([]);

  const playSoundFeedback = (status: GateScanResult['status']) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (status === 'VALID') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.15);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.14);
        gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.14);
        osc2.stop(ctx.currentTime + 0.35);
      } else if (status === 'ALREADY_USED') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Ignore audio errors
    }
  };

  useEffect(() => {
    const loadTickets = () => {
      setAvailableTickets(ticketingRepository.getTickets());
    };
    loadTickets();
    return ticketingRepository.subscribe(loadTickets);
  }, []);

  useEffect(() => {
    if (initialTicketToScan) {
      setManualCode(initialTicketToScan.qrPayload || initialTicketToScan.id);
      executeScan(initialTicketToScan.qrPayload || initialTicketToScan.id);
    }
  }, [initialTicketToScan]);

  const executeScan = (rawPayload: string) => {
    if (!rawPayload.trim()) {
      toast.error('Masukkan kode QR atau pilih tiket untuk dipindai.');
      return;
    }

    setIsScanning(true);

    setTimeout(async () => {
      const result = ticketingRepository.verifyAndScanTicket(rawPayload, selectedGate);
      setIsScanning(false);
      setLastResult(result);
      setScanHistory((prev) => [result, ...prev.slice(0, 9)]);
      playSoundFeedback(result.status);

      // Also notify backend /api/gate/validate-qr if online so DB wallet balance updates
      try {
        await apiFetch('/gate/validate-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr: rawPayload, gate: selectedGate }),
        });
      } catch {
        // Offline / local simulation mode already handled by ticketingRepository
      }

      if (result.status === 'VALID') {
        toast.success('VALID — Check-In & Pencairan Escrow Berhasil!', {
          description: result.message,
        });
      } else if (result.status === 'ALREADY_USED') {
        toast.warning('ALREADY USED — Anti-Passback Aktif!', {
          description: result.message,
        });
      } else {
        toast.error('INVALID — Tiket Ditolak!', {
          description: result.message,
        });
      }

      if (onScanCompleted) onScanCompleted(result);
    }, 300);
  };

  const handlePresetScanValid = () => {
    const validTicket = availableTickets.find((t) => t.status === 'VALID');
    if (!validTicket) {
      toast.info('Semua tiket contoh sudah di-scan. Silakan pesan kursi baru atau Reset Demo.');
      return;
    }
    setManualCode(validTicket.qrPayload);
    executeScan(validTicket.qrPayload);
  };

  const handlePresetScanUsed = () => {
    const usedTicket = availableTickets.find((t) => t.status === 'USED');
    if (!usedTicket) {
      toast.info('Belum ada tiket berstatus USED. Scan tiket VALID terlebih dahulu.');
      return;
    }
    setManualCode(usedTicket.qrPayload);
    executeScan(usedTicket.qrPayload);
  };

  const handlePresetScanForged = () => {
    const forgedPayload = JSON.stringify({
      brand: 'Oziktag',
      v: 2,
      tid: 'OZT-BDG26-A05',
      sid: 'A-05',
      tier: 'VIP',
      holder: 'Spoofed Attacker',
      sig: '0xDEADBEEF0000FAKE',
    });
    setManualCode(forgedPayload);
    executeScan(forgedPayload);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Header Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">
              <Scan className="h-3.5 w-3.5 text-emerald-400" />
              GATE VALIDATION & ESCROW SETTLEMENT
            </span>
            <span className="text-xs font-semibold text-slate-500">POST /api/gate/validate-qr</span>
          </div>
          <h3 className="mt-1.5 text-lg font-bold text-slate-900">
            Pemindai QR Gate Panitia (Anti-Passback + Auto-Release Dompet)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="Gate 2 — West Lobby Summarecon Mall">Gate 2 — West Lobby Summarecon</option>
            <option value="Gate 1 — VIP Fast Track Atrium">Gate 1 — VIP Fast Track Atrium</option>
            <option value="Gate 3 — Sawarga Courtyard Entrance">Gate 3 — Sawarga Courtyard</option>
          </select>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100"
            title={soundEnabled ? 'Suara Beep Aktif' : 'Suara Beep Nonaktif'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Main Split Grid: Scanner Input vs Instant Visual Feedback */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Camera Viewport & Quick Test Presets (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-300">
                <Camera className="h-4 w-4 text-emerald-400" />
                Optical HMAC-SHA256 Scanner Viewport
              </span>
              <span className="text-[11px] font-mono text-emerald-400">READY</span>
            </div>

            {/* Simulated Optical Frame */}
            <div className="relative flex h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/90 p-4 overflow-hidden">
              <div className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
              <Scan className={`h-10 w-10 text-emerald-400 mb-2 ${isScanning ? 'animate-spin' : ''}`} />
              <p className="text-xs font-semibold text-slate-300 text-center">
                {isScanning
                  ? 'Memverifikasi Signature HMAC-SHA256 & Mencairkan Escrow...'
                  : 'Arahkan QR E-Pass Oziktag atau gunakan tombol uji instan di bawah'}
              </p>
            </div>

            {/* 1-Click Test Presets */}
            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Simulasi Uji Panitia 1-Klik:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handlePresetScanValid}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2.5 text-left hover:bg-emerald-500/25 transition"
                >
                  <span className="block text-[10px] font-extrabold text-emerald-400 uppercase">
                    1. Tiket Valid
                  </span>
                  <span className="text-[11px] font-semibold text-white">
                    Hijau + Cair Escrow
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePresetScanUsed}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2.5 text-left hover:bg-amber-500/25 transition"
                >
                  <span className="block text-[10px] font-extrabold text-amber-400 uppercase">
                    2. Anti-Passback
                  </span>
                  <span className="text-[11px] font-semibold text-white">
                    Kuning (Sudah Scan)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePresetScanForged}
                  className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2.5 text-left hover:bg-rose-500/25 transition"
                >
                  <span className="block text-[10px] font-extrabold text-rose-400 uppercase">
                    3. QR Palsu
                  </span>
                  <span className="text-[11px] font-semibold text-white">
                    Merah (Invalid Sig)
                  </span>
                </button>
              </div>
            </div>

            {/* Manual Input */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Input Payload QR / ID Tiket Manual:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder='Tempel JSON QR atau ID Tiket (contoh: OZT-BDG26-A05)...'
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => executeScan(manualCode)}
                  className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition shrink-0"
                >
                  Validasi QR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Instant Color Feedback & Escrow Auto-Settlement Card (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {!lastResult ? (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                Menunggu Pemindaian Tiket...
              </h4>
              <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                Setiap tiket yang terverifikasi <strong>VALID (Hijau)</strong> akan otomatis mengubah status menjadi <strong>USED</strong> dan mencairkan dana dari <strong>Oziktag Escrow</strong> langsung ke <strong>Dompet Penghasilan Organizer</strong>.
              </p>
            </div>
          ) : (
            <div
              className={`rounded-3xl border-2 p-6 shadow-md transition-all ${
                lastResult.status === 'VALID'
                  ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950'
                  : lastResult.status === 'ALREADY_USED'
                  ? 'border-amber-500 bg-amber-50/90 text-amber-950'
                  : 'border-rose-500 bg-rose-50/90 text-rose-950'
              }`}
            >
              {/* Status Banner */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {lastResult.status === 'VALID' && (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                  )}
                  {lastResult.status === 'ALREADY_USED' && (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
                      <AlertTriangle className="h-7 w-7" />
                    </div>
                  )}
                  {lastResult.status === 'INVALID' && (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-sm">
                      <XCircle className="h-7 w-7" />
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-75">
                      HASIL VERIFIKASI GATE • {lastResult.scannedAt}
                    </span>
                    <h4 className="text-xl font-black tracking-tight">
                      {lastResult.status === 'VALID' && 'ACCESS GRANTED (VALID)'}
                      {lastResult.status === 'ALREADY_USED' && 'ANTI-PASSBACK (ALREADY USED)'}
                      {lastResult.status === 'INVALID' && 'ACCESS DENIED (INVALID QR)'}
                    </h4>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold leading-relaxed">
                {lastResult.message}
              </p>

              {/* Ticket & Attendee Details */}
              {lastResult.ticket && (
                <div className="mt-4 rounded-2xl bg-white/90 p-4 border border-black/5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <TicketIcon className="h-4 w-4 text-slate-500" />
                      Kursi {lastResult.ticket.seatId} ({lastResult.ticket.seatTier})
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {lastResult.ticket.id}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Nama Peserta</p>
                      <p className="font-bold text-slate-900">{lastResult.ticket.attendee.fullName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Institusi / Tim</p>
                      <p className="font-semibold text-slate-700">
                        {lastResult.ticket.attendee.institution || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Automatic Escrow -> Wallet Settlement Confirmation Box */}
              {lastResult.status === 'VALID' && lastResult.ticket && (
                <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-600 p-4 text-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-emerald-200" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                          ESCROW AUTO-SETTLEMENT TRIGGERED
                        </p>
                        <p className="text-sm font-extrabold">
                          + Rp {(lastResult.settledNetAmount || computeEscrowBreakdown(lastResult.ticket.price).netAmount).toLocaleString('id-ID')} Cair ke Dompet Penghasilan
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/wallet"
                      className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-[11px] font-extrabold text-emerald-900 hover:bg-emerald-50 transition"
                    >
                      Cek Dompet <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Scan History */}
          {scanHistory.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2.5">
                <History className="h-3.5 w-3.5" /> Riwayat Scan Gate Terbaru
              </h5>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {scanHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          item.status === 'VALID'
                            ? 'bg-emerald-500'
                            : item.status === 'ALREADY_USED'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-slate-800">
                        {item.ticket ? `Kursi ${item.ticket.seatId}` : 'Invalid Token'}
                      </span>
                      <span className="text-slate-500 truncate max-w-[160px]">
                        {item.ticket?.attendee.fullName || item.message}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{item.scannedAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

