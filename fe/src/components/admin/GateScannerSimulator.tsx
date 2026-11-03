import { useState, useEffect, useRef } from 'react';
import { GateScanResult, Ticket } from '@/types/ticketing';
import { ticketingRepository } from '@/lib/ticketing-store';
import { toast } from 'sonner';
import {
  Scan,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  RotateCw,
  Flashlight,
  Ticket as TicketIcon,
  Search,
  ArrowRight,
  Sparkles,
  History,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface GateScannerSimulatorProps {
  initialTicketToScan?: Ticket | null;
  onScanCompleted?: (result: GateScanResult) => void;
}

export function GateScannerSimulator({
  initialTicketToScan,
  onScanCompleted,
}: GateScannerSimulatorProps) {
  const [selectedGate, setSelectedGate] = useState('Gate 2 - West Lobby Summarecon');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<GateScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<GateScanResult[]>([]);
  const [availableTickets, setAvailableTickets] = useState<Ticket[]>([]);

  // Sound Synth using Web Audio API
  const playSoundFeedback = (status: GateScanResult['status']) => {
    if (!soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (status === 'VALID') {
        // High pleasant double chime (880Hz -> 1320Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.15);

        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.frequency.setValueAtTime(1320, ctx.currentTime);
          gain2.gain.setValueAtTime(0.18, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.25);
        }, 120);
      } else if (status === 'ALREADY_USED') {
        // Mid warning pulse (440Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Low error buzzer (160Hz sawtooth)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio feedback failed', e);
    }
  };

  // Sync available tickets for quick testing
  const reloadTickets = () => {
    const list = ticketingRepository.getTickets();
    setAvailableTickets(list);
  };

  useEffect(() => {
    reloadTickets();
    const unsub = ticketingRepository.subscribe(reloadTickets);
    return unsub;
  }, []);

  // If initialTicketToScan was provided, pre-fill and auto scan
  useEffect(() => {
    if (initialTicketToScan) {
      setManualCode(initialTicketToScan.id);
      executeScan(initialTicketToScan.qrPayload || initialTicketToScan.id);
    }
  }, [initialTicketToScan]);

  const executeScan = (input: string) => {
    if (!input.trim()) {
      toast.error('Masukkan kode tiket atau arahkan QR');
      return;
    }

    setIsScanning(true);

    // Realistic scanning latency simulation
    setTimeout(() => {
      const result = ticketingRepository.verifyAndScanTicket(input, selectedGate);
      setIsScanning(false);
      setLastResult(result);
      setScanHistory((prev) => [result, ...prev.slice(0, 19)]);
      playSoundFeedback(result.status);

      if (result.status === 'VALID') {
        toast.success('TIKET VALID - SILAKAN MASUK', {
          description: `${result.ticket?.attendee.fullName} • Kursi ${result.ticket?.seatId}`,
        });
      } else if (result.status === 'ALREADY_USED') {
        toast.warning('PERINGATAN: TIKET SUDAH DIPAKAI', {
          description: result.message,
        });
      } else {
        toast.error('TIKET TIDAK VALID', {
          description: result.message,
        });
      }

      if (onScanCompleted) {
        onScanCompleted(result);
      }

      reloadTickets();
    }, 450);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeScan(manualCode);
  };

  // Presets for quick evaluation by judges
  const handleQuickTestValid = () => {
    const validTicket = availableTickets.find((t) => t.status === 'VALID');
    if (!validTicket) {
      toast.info('Belum ada tiket berstatus VALID. Silakan booking kursi terlebih dahulu.');
      return;
    }
    setManualCode(validTicket.id);
    executeScan(validTicket.qrPayload || validTicket.id);
  };

  const handleQuickTestUsed = () => {
    const usedTicket = availableTickets.find((t) => t.status === 'USED');
    if (!usedTicket) {
      toast.info('Belum ada tiket berstatus USED. Lakukan scan tiket valid terlebih dahulu.');
      return;
    }
    setManualCode(usedTicket.id);
    executeScan(usedTicket.qrPayload || usedTicket.id);
  };

  const handleQuickTestBogus = () => {
    const fakeCode = 'OZT-FAKE-PIRATED-SIGNATURE-2026';
    setManualCode(fakeCode);
    executeScan(fakeCode);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Panitia Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
              <Scan className="h-3.5 w-3.5 text-emerald-400" />
              Panitia Gate Control • Summarecon Mall
            </span>
            <span className="text-xs text-slate-500">Live Validator</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Simulator Scanner Gate & Check-in
          </h2>
          <p className="text-xs text-slate-500">
            Verifikasi tanda tangan kriptografi tiket Oziktag secara offline/online dengan umpan balik visual instan.
          </p>
        </div>

        {/* Controls: Gate selector & Audio toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-slate-900 focus:outline-none"
          >
            <option value="Gate 2 - West Lobby Summarecon">Gate 2 - West Lobby Summarecon</option>
            <option value="Gate 1 - East Lobby Sawarga">Gate 1 - East Lobby Sawarga</option>
            <option value="VIP Fast Track Lounge">VIP Fast Track Lounge</option>
          </select>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            title={soundEnabled ? 'Matikan Suara Beep' : 'Nyalakan Suara Beep'}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Viewport Simulation & Instant Visual Feedback */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Simulated Scanner Viewport Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-900 bg-slate-950 p-6 text-white shadow-xl min-h-[360px] flex flex-col justify-between">
            {/* Top Viewport Header */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono uppercase tracking-wider">CAMERA 1 (60 FPS)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px]">
                  {selectedGate}
                </span>
              </div>
            </div>

            {/* Target Reticle in Center */}
            <div className="relative my-6 mx-auto flex h-56 w-56 items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-emerald-400" />

              {/* Laser scan line animation */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-bounce" />

              <div className="text-center text-xs text-slate-400 font-mono">
                {isScanning ? (
                  <span className="text-emerald-400 font-bold animate-pulse">
                    Memindai Kriptografi...
                  </span>
                ) : (
                  <span>Arahkan EQR Pass Oziktag</span>
                )}
              </div>
            </div>

            {/* Bottom Viewport Status Message */}
            <div className="text-center font-mono text-xs text-slate-400">
              Sensor Otomatis • Algoritma Oziktag V2
            </div>
          </div>

          {/* Instant Visual Feedback Card (Green / Yellow / Red) */}
          {lastResult ? (
            <div
              className={`rounded-2xl border p-5 transition-all shadow-md animate-in fade-in zoom-in-95 ${
                lastResult.status === 'VALID'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                  : lastResult.status === 'ALREADY_USED'
                    ? 'border-amber-500 bg-amber-50 text-amber-950'
                    : 'border-rose-500 bg-rose-50 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    lastResult.status === 'VALID'
                      ? 'bg-emerald-600 text-white'
                      : lastResult.status === 'ALREADY_USED'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                  }`}
                >
                  {lastResult.status === 'VALID' && <CheckCircle2 className="h-6 w-6" />}
                  {lastResult.status === 'ALREADY_USED' && <AlertTriangle className="h-6 w-6" />}
                  {lastResult.status === 'INVALID' && <XCircle className="h-6 w-6" />}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {lastResult.status === 'VALID' && 'Status: TIKET VALID (SILAKAN MASUK)'}
                      {lastResult.status === 'ALREADY_USED' && 'Status: PERINGATAN (SUDAH DIPAKAI)'}
                      {lastResult.status === 'INVALID' && 'Status: INVALID (TIDAK DIIZINKAN)'}
                    </span>
                    <span className="font-mono text-xs opacity-75">{lastResult.scannedAt}</span>
                  </div>

                  <p className="text-sm font-semibold">{lastResult.message}</p>

                  {lastResult.ticket && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl bg-white/80 p-3 text-xs border border-black/5">
                      <div>
                        <div className="text-[10px] text-slate-500">Pemegang Tiket</div>
                        <div className="font-bold text-slate-900">{lastResult.ticket.attendee.fullName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Nomor Kursi</div>
                        <div className="font-bold text-slate-900">{lastResult.ticket.seatId} ({lastResult.ticket.seatTier})</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">ID Tiket</div>
                        <div className="font-mono text-[11px] font-bold text-slate-900 truncate">
                          {lastResult.ticket.id}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
              Belum ada aktivitas pemindaian. Gunakan tombol uji cepat di sebelah kanan atau ketik kode tiket.
            </div>
          )}
        </div>

        {/* Right Column: Fast Test Controls & Manual Code Entry */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Quick Simulation Presets for Bandung Build Challenge Evaluation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-slate-900" />
                <span>Simulasi Sekali Klik (Demo Evaluation)</span>
              </div>
              <p className="text-xs text-slate-500">
                Uji langsung tiga skenario pintu masuk utama:
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleQuickTestValid}
                className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 text-left hover:bg-emerald-100/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                    ✓
                  </span>
                  <div>
                    <div className="text-xs font-bold text-emerald-950">1. Uji Tiket Valid (Baru)</div>
                    <div className="text-[11px] text-emerald-700">Scan tiket asli yang belum pernah dipakai</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-700" />
              </button>

              <button
                type="button"
                onClick={handleQuickTestUsed}
                className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-left hover:bg-amber-100/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs">
                    !
                  </span>
                  <div>
                    <div className="text-xs font-bold text-amber-950">2. Uji Tiket Duplikat / Re-entry</div>
                    <div className="text-[11px] text-amber-700">Scan ulang tiket yang sudah pernah dicap masuk</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-700" />
              </button>

              <button
                type="button"
                onClick={handleQuickTestBogus}
                className="flex items-center justify-between rounded-xl border border-rose-300 bg-rose-50/70 p-3 text-left hover:bg-rose-100/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-xs">
                    ✕
                  </span>
                  <div>
                    <div className="text-xs font-bold text-rose-950">3. Uji Tiket Palsu / Segel Rusak</div>
                    <div className="text-[11px] text-rose-700">Simulasikan kode palsu tanpa HMAC signature</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-rose-700" />
              </button>
            </div>
          </div>

          {/* Manual Input Fallback */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Input Manual Kode Tiket
            </h3>
            <p className="text-xs text-slate-500">
              Gunakan jika barcode fisik rusak atau layar HP pengunjung redup.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="relative">
                <TicketIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Contoh: OZT-BDG26-A02 atau paste payload..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isScanning || !manualCode.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Verifikasi Tiket Ini</span>
              </button>
            </form>
          </div>

          {/* Recent Scans History Pill */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <History className="h-3.5 w-3.5" />
                <span>Log Scan Terkini ({scanHistory.length})</span>
              </div>
              {scanHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScanHistory([])}
                  className="text-[10px] text-slate-400 hover:text-slate-700"
                >
                  Bersihkan
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
              {scanHistory.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">Belum ada riwayat scan.</div>
              ) : (
                scanHistory.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {item.ticket?.attendee.fullName || 'Kode Tidak Dikenal'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.ticket ? `Kursi ${item.ticket.seatId}` : 'N/A'} • {item.scannedAt}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.status === 'VALID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'ALREADY_USED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
