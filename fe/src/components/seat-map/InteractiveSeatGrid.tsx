import { useState, useEffect, useMemo } from 'react';
import { Seat } from '@/types/ticketing';
import { ticketingRepository, TIER_CONFIGS, getOrCreateSessionId } from '@/lib/ticketing-store';
import { toast } from 'sonner';
import {
  Sparkles,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Lock,
  Layers,
  Info,
  Radio,
  Flame,
} from 'lucide-react';

interface InteractiveSeatGridProps {
  onSelectSeat: (seat: Seat) => void;
  selectedSeatId?: string | null;
}

export function InteractiveSeatGrid({ onSelectSeat, selectedSeatId }: InteractiveSeatGridProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [isSimulatingContention, setIsSimulatingContention] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  useEffect(() => {
    const loadSeats = () => {
      const data = ticketingRepository.getSeats();
      setSeats(data);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
    };

    loadSeats();
    const unsubscribe = ticketingRepository.subscribe(loadSeats);
    const interval = setInterval(loadSeats, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    let available = 0;
    let held = 0;
    let booked = 0;

    seats.forEach((s) => {
      if (s.status === 'AVAILABLE') available++;
      else if (s.status === 'HELD') held++;
      else if (s.status === 'BOOKED') booked++;
    });

    return { available, held, booked, total: seats.length };
  }, [seats]);

  const rowsMap = useMemo(() => {
    const grouped: Record<string, Seat[]> = {};
    seats.forEach((seat) => {
      if (!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    });
    Object.keys(grouped).forEach((r) => {
      grouped[r].sort((a, b) => a.col - b.col);
    });
    return grouped;
  }, [seats]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'BOOKED') {
      toast.error(`Kursi ${seat.id} sudah Terjual (Sold).`, {
        description: 'Silakan pilih kursi berwarna Hijau (Tersedia).',
      });
      return;
    }

    if (seat.status === 'HELD' && seat.heldBySessionId !== sessionId) {
      const remainingSec = seat.holdExpiresAt
        ? Math.max(0, Math.ceil((seat.holdExpiresAt - Date.now()) / 1000))
        : 0;
      toast.warning(`409 Conflict — Kursi ${seat.id} Sedang Ditahan`, {
        description: `Pengunjung lain sedang memproses kursi ini (${remainingSec}d tersisa). Anti-Double Booking aktif.`,
      });
      return;
    }

    const result = ticketingRepository.acquireSeatHold(seat.id, sessionId);
    if (!result.success || !result.seat) {
      toast.error('Gagal Mengunci Kursi (409 Conflict)', {
        description: result.error,
      });
      return;
    }

    toast.success(`Kursi ${seat.id} berhasil dikunci selama 5 menit!`, {
      description: 'Dana pembayaran akan dilindungi oleh sistem Escrow Oziktag.',
    });

    onSelectSeat(result.seat);
  };

  const handleTriggerRaceSimulation = () => {
    setIsSimulatingContention(true);
    const availableSeats = seats.filter((s) => s.status === 'AVAILABLE');
    if (availableSeats.length === 0) {
      toast.info('Tidak ada kursi tersedia untuk simulasi.');
      setIsSimulatingContention(false);
      return;
    }

    const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
    const res = ticketingRepository.simulateContentionRace(randomSeat.id);

    setTimeout(() => {
      setIsSimulatingContention(false);
      if (res.success) {
        toast.warning(`Simulasi Concurrency: Kursi ${randomSeat.id} Dikunci User Lain!`, {
          description: `Coba klik kursi ${randomSeat.id} (kuning) untuk menguji proteksi Anti-Double Booking 409 Conflict.`,
        });
      }
    }, 350);
  };

  return (
    <div className="space-y-6">
      {/* Top Status Bar & Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
            <span>Live Seat Sync ({lastSyncTime || 'Aktif'})</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-emerald-500 inline-block" />
              Available ({stats.available})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-amber-500 inline-block" />
              Reserved 5m ({stats.held})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-rose-500 inline-block" />
              Sold ({stats.booked})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerRaceSimulation}
            disabled={isSimulatingContention}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
          >
            <Flame className="h-3.5 w-3.5 text-amber-600" />
            {isSimulatingContention ? 'Mensimulasikan...' : 'Uji Anti-Double Booking (409)'}
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Layers className="h-4 w-4 text-slate-500" />
          <span>Filter Kategori Kursi:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'VIP', 'CAT1', 'CAT2', 'REGULAR', 'WING'] as const).map((tierKey) => {
            const isActive = selectedTierFilter === tierKey;
            const cfg = tierKey !== 'ALL' ? TIER_CONFIGS[tierKey] : null;
            return (
              <button
                key={tierKey}
                type="button"
                onClick={() => setSelectedTierFilter(tierKey)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tierKey === 'ALL'
                  ? 'Semua Tier (100 Kursi)'
                  : `${tierKey} • Rp ${(cfg!.price / 1000).toFixed(0)}rb`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage & Seat Matrix */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* Stage Visual Header */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="relative mx-auto h-12 w-full overflow-hidden rounded-t-full bg-gradient-to-b from-slate-900 to-slate-800 shadow-md flex items-center justify-center border-b-4 border-emerald-500">
            <span className="text-[11px] font-bold tracking-[0.25em] text-white uppercase flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              MAIN STAGE — SUMMARECON MALL BANDUNG ATRIUM
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-400">
            Arah Pandang Panggung Utama • Klik kursi berwarna Hijau untuk mengunci kursi (5 menit TTL)
          </p>
        </div>

        {/* Seat Rows Matrix */}
        <div className="overflow-x-auto pb-4">
          <div className="mx-auto min-w-[540px] max-w-3xl space-y-2.5">
            {Object.entries(rowsMap).map(([rowLabel, rowSeats]) => {
              const rowTier = rowSeats[0]?.tier || 'REGULAR';
              const isRowDimmed = selectedTierFilter !== 'ALL' && selectedTierFilter !== rowTier;

              return (
                <div
                  key={rowLabel}
                  className={`flex items-center justify-center gap-2 sm:gap-3 transition-opacity ${
                    isRowDimmed ? 'opacity-25 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  {/* Left Row Label */}
                  <div className="flex w-14 shrink-0 items-center justify-end gap-1.5 pr-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {rowTier}
                    </span>
                    <span className="w-5 text-center text-xs font-extrabold text-slate-800">
                      {rowLabel}
                    </span>
                  </div>

                  {/* Columns 1 - 5 */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {rowSeats.slice(0, 5).map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeatId === seat.id}
                        isOwnHold={seat.status === 'HELD' && seat.heldBySessionId === sessionId}
                        onClick={() => handleSeatClick(seat)}
                        onMouseEnter={() => setHoveredSeat(seat)}
                        onMouseLeave={() => setHoveredSeat(null)}
                      />
                    ))}
                  </div>

                  {/* Center Aisle Walkaway */}
                  <div className="mx-2 flex h-8 w-6 items-center justify-center text-[9px] font-bold tracking-widest text-slate-300 uppercase">
                    ••
                  </div>

                  {/* Columns 6 - 10 */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {rowSeats.slice(5, 10).map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeatId === seat.id}
                        isOwnHold={seat.status === 'HELD' && seat.heldBySessionId === sessionId}
                        onClick={() => handleSeatClick(seat)}
                        onMouseEnter={() => setHoveredSeat(seat)}
                        onMouseLeave={() => setHoveredSeat(null)}
                      />
                    ))}
                  </div>

                  {/* Right Row Label */}
                  <div className="w-8 shrink-0 pl-2 text-left text-xs font-extrabold text-slate-400">
                    {rowLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Seat Inspector Footer */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row">
          {hoveredSeat ? (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-bold text-white">
                Kursi {hoveredSeat.id}
              </span>
              <span className="font-semibold text-slate-700">
                {TIER_CONFIGS[hoveredSeat.tier]?.label || hoveredSeat.tier}
              </span>
              <span className="font-bold text-emerald-700">
                Rp {hoveredSeat.price.toLocaleString('id-ID')}
              </span>
              <span className="text-slate-500">
                • Status:{' '}
                <strong className="uppercase">
                  {hoveredSeat.status === 'AVAILABLE'
                    ? 'Tersedia (Klik untuk kunci 5 menit)'
                    : hoveredSeat.status === 'HELD'
                    ? 'Ditahan Sementara (5m Hold)'
                    : 'Sudah Terjual (Sold)'}
                </strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="h-4 w-4 text-slate-400" />
              <span>
                Arahkan kursor atau ketuk salah satu kursi untuk melihat harga, tier, dan status ketersediaan.
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" />
            <span>Atomic Row-Level Lock & Oziktag Escrow Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeatButton({
  seat,
  isSelected,
  isOwnHold,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  seat: Seat;
  isSelected: boolean;
  isOwnHold: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  let colorStyles = '';
  if (seat.status === 'AVAILABLE') {
    colorStyles =
      'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 hover:scale-105 shadow-xs cursor-pointer';
  } else if (seat.status === 'HELD') {
    colorStyles = isOwnHold
      ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300 animate-pulse cursor-pointer'
      : 'bg-amber-400 text-amber-950 border-amber-500 cursor-not-allowed opacity-90';
  } else {
    colorStyles = 'bg-rose-500 text-white border-rose-600 opacity-75 cursor-not-allowed';
  }

  if (isSelected) {
    colorStyles += ' ring-4 ring-slate-900/30 scale-105';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={`Kursi ${seat.id} (${seat.tier}) - Rp ${seat.price.toLocaleString('id-ID')}`}
      className={`relative flex h-9 w-9 sm:h-10 sm:w-10 flex-col items-center justify-center rounded-t-xl rounded-b-md border text-[10px] font-bold transition-all duration-150 ${colorStyles}`}
    >
      <span>{seat.id}</span>
      <span className="mt-0.5 flex items-center justify-center">
        {seat.status === 'AVAILABLE' && <CheckCircle2 className="h-2.5 w-2.5 opacity-80" />}
        {seat.status === 'HELD' && <Clock className="h-2.5 w-2.5" />}
        {seat.status === 'BOOKED' && <Lock className="h-2.5 w-2.5 opacity-80" />}
      </span>
    </button>
  );
}

