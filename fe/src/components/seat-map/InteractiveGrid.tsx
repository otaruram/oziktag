import { useState, useEffect, useMemo, useId } from 'react';
import { Seat, SeatTier } from '@/types/ticketing';
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

interface InteractiveGridProps {
  onSelectSeat: (seat: Seat) => void;
  selectedSeatId?: string | null;
}

export function InteractiveGrid({ onSelectSeat, selectedSeatId }: InteractiveGridProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [isSimulatingContention, setIsSimulatingContention] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  // Sync state from repository and broadcast channel
  useEffect(() => {
    const loadSeats = () => {
      const data = ticketingRepository.getSeats();
      setSeats(data);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
    };

    loadSeats();
    const unsubscribe = ticketingRepository.subscribe(loadSeats);

    // Polling fallback every 3 seconds for rock-solid sync
    const interval = setInterval(loadSeats, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Compute metrics for legend
  const stats = useMemo(() => {
    let available = 0;
    let held = 0;
    let booked = 0;

    seats.forEach((s) => {
      if (s.status === 'AVAILABLE') available++;
      else if (s.status === 'HELD') held++;
      else if (s.status === 'BOOKED') booked++;
    });

    return { total: seats.length, available, held, booked };
  }, [seats]);

  // Group seats by rows
  const rowKeys = useMemo(() => {
    const rows = Array.from(new Set(seats.map((s) => s.row))).sort();
    return rows;
  }, [seats]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'BOOKED') {
      toast.error('Kursi Sudah Terjual', {
        description: `Kursi ${seat.id} (${seat.tier}) telah dibooking oleh pengunjung lain.`,
      });
      return;
    }

    // Attempt to acquire hold via Optimistic Concurrency Engine
    const result = ticketingRepository.acquireSeatHold(seat.id, sessionId);

    if (!result.success) {
      toast.error('Terjadi Konflik Reservasi (Race Condition)', {
        description: result.error,
        duration: 5000,
      });
      // Refresh local state immediately
      setSeats(ticketingRepository.getSeats());
      return;
    }

    toast.success(`Kursi ${seat.id} Diamankan Sementara!`, {
      description: 'Waktu checkout 5 menit dimulai. Silakan lengkapi data pemesanan.',
      duration: 3500,
    });

    if (result.seat) {
      onSelectSeat(result.seat);
    }
  };

  // Simulate concurrent user snatching the hovered or selected seat
  const handleSimulateRaceCollision = () => {
    const targetSeat = seats.find(
      (s) => s.status === 'AVAILABLE' && (selectedTierFilter === 'ALL' || s.tier === selectedTierFilter)
    );

    if (!targetSeat) {
      toast.info('Tidak ada kursi yang tersedia untuk disimulasikan.');
      return;
    }

    setIsSimulatingContention(true);
    const res = ticketingRepository.simulateContentionRace(targetSeat.id);

    if (res.success) {
      toast.warning('Simulasi Race Condition Dijalankan!', {
        description: `Pengunjung virtual lain baru saja mengunci kursi ${targetSeat.id}. Coba klik kursi ini untuk menguji proteksi race-condition.`,
        duration: 6000,
      });
    }

    setIsSimulatingContention(false);
  };

  // Render individual seat button
  const renderSeat = (seat: Seat) => {
    const isSelected = selectedSeatId === seat.id;
    const isHeldByMe = seat.status === 'HELD' && seat.heldBySessionId === sessionId;
    const isHeldByOther = seat.status === 'HELD' && seat.heldBySessionId !== sessionId;
    const isBooked = seat.status === 'BOOKED';
    const isAvailable = seat.status === 'AVAILABLE';

    let colorStyles = '';
    let badgeText = '';

    if (isSelected || isHeldByMe) {
      colorStyles =
        'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900 ring-offset-2 scale-105 z-10';
      badgeText = 'Anda';
    } else if (isHeldByOther) {
      // Amber status accent for Reserved/Hold
      colorStyles =
        'bg-amber-50 text-amber-900 border-amber-400 hover:border-amber-500 shadow-sm cursor-not-allowed opacity-90';
      badgeText = 'Hold';
    } else if (isBooked) {
      // Rose red status accent for Sold/Booked
      colorStyles =
        'bg-rose-50/70 text-rose-500 border-rose-200 cursor-not-allowed opacity-60';
      badgeText = 'Sold';
    } else {
      // Emerald Green status accent for Available
      colorStyles =
        'bg-white text-slate-800 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/70 hover:shadow-sm hover:scale-105';
    }

    return (
      <button
        key={seat.id}
        type="button"
        onClick={() => handleSeatClick(seat)}
        onMouseEnter={() => setHoveredSeat(seat)}
        onMouseLeave={() => setHoveredSeat(null)}
        disabled={isBooked || isHeldByOther}
        className={`group relative flex h-10 w-10 sm:h-11 sm:w-11 flex-col items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-150 ${colorStyles}`}
        title={`Kursi ${seat.id} - ${seat.tier} (Rp ${seat.price.toLocaleString('id-ID')})`}
      >
        <span className="text-[11px] font-bold tracking-tight">{seat.id}</span>

        {/* Status indicator pip */}
        <div className="mt-0.5 flex items-center justify-center">
          {isAvailable && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
          {isHeldByOther && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          )}
          {isBooked && (
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          )}
          {(isSelected || isHeldByMe) && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Venue Header & Real-time Live Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Polling & OCC Active
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Sinkronisasi: {lastSyncTime || 'Menghubungkan...'}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Denah Interaktif Grand Ballroom • Summarecon Mall Bandung
          </h2>
          <p className="text-xs text-slate-500">
            Bandung Build Challenge 2026 • Silakan klik kursi bertanda hijau untuk melakukan reservasi instan.
          </p>
        </div>

        {/* Action button to test race condition */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateRaceCollision}
            disabled={isSimulatingContention}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors shadow-sm"
            title="Simulasikan user lain yang secara bersamaan mengunci kursi"
          >
            <Flame className="h-3.5 w-3.5 text-amber-600" />
            <span>Tes Tabrakan Kunci (Race Demo)</span>
          </button>
        </div>
      </div>

      {/* Tier Filter Bar & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Tier filter pill buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setSelectedTierFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedTierFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua Tier ({stats.total})
          </button>
          {(Object.keys(TIER_CONFIGS) as SeatTier[]).map((tierKey) => {
            const conf = TIER_CONFIGS[tierKey];
            const active = selectedTierFilter === tierKey;
            return (
              <button
                key={tierKey}
                type="button"
                onClick={() => setSelectedTierFilter(tierKey)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {conf.label} (Rp {conf.price / 1000}k)
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500 border border-emerald-600" />
            <span className="text-slate-600 font-medium">Tersedia ({stats.available})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-400 border border-amber-500" />
            <span className="text-slate-600 font-medium">Hold / Sesi ({stats.held})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-400 border border-rose-500" />
            <span className="text-slate-600 font-medium">Terjual ({stats.booked})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-slate-900 border border-slate-900" />
            <span className="text-slate-600 font-medium">Pilihan Anda</span>
          </div>
        </div>
      </div>

      {/* Main Seat Map Stage Viewport */}
      <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-10 shadow-inner">
        {/* Stage Curved Screen */}
        <div className="mx-auto mb-10 max-w-lg text-center">
          <div className="relative mx-auto h-12 w-full rounded-t-[100px] border-t-4 border-slate-800 bg-gradient-to-b from-slate-200/60 to-transparent flex items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-700">
              PANGGUNG UTAMA • BANDUNG BUILD CHALLENGE 2026
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sawarga Courtyard & Stage Hall</div>
        </div>

        {/* Seat Matrix Grid */}
        <div className="mx-auto flex flex-col items-center gap-3">
          {rowKeys.map((rowLetter) => {
            const rowSeats = seats
              .filter((s) => s.row === rowLetter)
              .sort((a, b) => a.col - b.col);

            const rowTier = rowSeats[0]?.tier || 'REGULAR';
            const isVisibleByTier =
              selectedTierFilter === 'ALL' || selectedTierFilter === rowTier;

            if (!isVisibleByTier) return null;

            return (
              <div key={rowLetter} className="flex items-center gap-2 sm:gap-3">
                {/* Row Letter indicator left */}
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                  {rowLetter}
                </div>

                {/* Left wing (cols 1-5) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {rowSeats.slice(0, 5).map((seat) => renderSeat(seat))}
                </div>

                {/* Center aisle walkway */}
                <div className="flex w-6 sm:w-10 items-center justify-center">
                  <span className="text-[10px] font-mono text-slate-300">|</span>
                </div>

                {/* Right wing (cols 6-10) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {rowSeats.slice(5, 10).map((seat) => renderSeat(seat))}
                </div>

                {/* Row Letter indicator right */}
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                  {rowLetter}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hover Inspector Pill at bottom */}
        {hoveredSeat && (
          <div className="sticky bottom-2 mx-auto mt-6 max-w-sm rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-2">
            <div>
              <span className="font-bold text-slate-900">Kursi {hoveredSeat.id}</span>
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                {TIER_CONFIGS[hoveredSeat.tier].label}
              </span>
            </div>
            <div className="font-semibold text-slate-900">
              Rp {hoveredSeat.price.toLocaleString('id-ID')}
            </div>
          </div>
        )}
      </div>

      {/* Tier Explanation Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(TIER_CONFIGS) as SeatTier[]).map((tierKey) => {
          const item = TIER_CONFIGS[tierKey];
          return (
            <div
              key={tierKey}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{item.label}</span>
                <span className="font-bold text-slate-900 text-xs">
                  Rp {item.price.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
              <ul className="text-[11px] text-slate-600 space-y-1 pt-1">
                {item.perks.map((perk, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
