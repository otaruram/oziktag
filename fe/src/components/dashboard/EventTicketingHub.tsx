import { useState, useEffect, useMemo } from 'react';
import { Seat, Ticket, EventConfig } from '@/types/ticketing';
import { ticketingRepository } from '@/lib/ticketing-store';
import { InteractiveSeatGrid } from '@/components/seat-map/InteractiveSeatGrid';
import { EscrowCheckoutModal } from '@/components/checkout/EscrowCheckoutModal';
import { OziktagEPass } from '@/components/ticket/OziktagEPass';
import { GateScannerDashboard } from '@/components/admin/GateScannerDashboard';
import { OccupancyMetrics } from '@/components/admin/OccupancyMetrics';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  Ticket as TicketIcon,
  Plus,
  Wallet,
  Lock,
  CheckCircle2,
  Armchair,
  Scan,
  FileSpreadsheet,
  QrCode,
  Calendar,
  MapPin,
  ArrowUpRight,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';

type HubTab = 'SEAT_MAP' | 'GATE_SCANNER' | 'MANIFEST_METRICS' | 'ACTIVE_EPASS';

export function EventTicketingHub() {
  const [activeTab, setActiveTab] = useState<HubTab>('SEAT_MAP');
  const [events, setEvents] = useState<EventConfig[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [ticketToScan, setTicketToScan] = useState<Ticket | null>(null);

  // Create Event Modal State
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVenue, setNewVenue] = useState('Summarecon Mall Bandung — Grand Ballroom');
  const [newDate, setNewDate] = useState('2026-11-28');
  const [vipPrice, setVipPrice] = useState(350000);
  const [vipQuota, setVipQuota] = useState(20);
  const [regPrice, setRegPrice] = useState(150000);
  const [regQuota, setRegQuota] = useState(50);
  const [wingPrice, setWingPrice] = useState(85000);
  const [wingQuota, setWingQuota] = useState(30);

  const loadAll = () => {
    setEvents(ticketingRepository.getEvents());
    setSeats(ticketingRepository.getSeats());
    const allTickets = ticketingRepository.getTickets();
    setTickets(allTickets);
    if (!activeTicket && allTickets.length > 0) {
      setActiveTicket(allTickets[0]);
    }
  };

  useEffect(() => {
    loadAll();
    return ticketingRepository.subscribe(loadAll);
  }, []);

  const escrowMetrics = useMemo(() => {
    return ticketingRepository.getEscrowMetrics();
  }, [tickets, seats]);

  const seatCounts = useMemo(() => {
    const total = seats.length;
    const sold = seats.filter((s) => s.status === 'BOOKED').length;
    const held = seats.filter((s) => s.status === 'HELD').length;
    const available = total - sold - held;
    return { total, sold, held, available };
  }, [seats]);

  const currentEvent = events[0];

  const handleSelectSeat = (seat: Seat) => {
    setSelectedSeat(seat);
    setIsCheckoutOpen(true);
  };

  const handleBookingSuccess = (ticket: Ticket) => {
    setIsCheckoutOpen(false);
    setActiveTicket(ticket);
    setActiveTab('ACTIVE_EPASS');
  };

  const handleSimulateScanAtGate = (ticket: Ticket) => {
    setTicketToScan(ticket);
    setActiveTab('GATE_SCANNER');
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Masukkan nama event terlebih dahulu.');
      return;
    }

    const created = ticketingRepository.createEvent({
      title: newTitle.trim(),
      venue: newVenue.trim(),
      date: newDate,
      categories: {
        VIP: { price: Number(vipPrice), quota: Number(vipQuota) },
        REGULAR: { price: Number(regPrice), quota: Number(regQuota) },
        WING: { price: Number(wingPrice), quota: Number(wingQuota) },
      },
    });

    setIsCreateEventOpen(false);
    setNewTitle('');
    toast.success(`Event "${created.title}" berhasil dibuat!`, {
      description: `Kuota total ${Number(vipQuota) + Number(regQuota) + Number(wingQuota)} kursi terhubung ke Escrow Oziktag Anda.`,
    });
  };

  const handleResetDemo = () => {
    ticketingRepository.resetDemoData();
    toast.success('Data Demo Event & Kursi berhasil di-reset ke kondisi awal!');
  };

  return (
    <div className="space-y-6">
      {/* Organizer Event Header & Escrow Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                OZIKTAG EVENT TICKETING & ESCROW HUB
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                Bandung Build Challenge 2026
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentEvent?.title || 'Summarecon Mall Bandung — Event Pass'}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                {currentEvent?.venue || 'Summarecon Mall Bandung'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                {currentEvent?.date || '28 Nov 2026'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateEventOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-700 transition"
            >
              <Plus className="h-4 w-4" />
              Buat Event / Atur Kuota
            </button>

            <Link
              to="/wallet"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition"
            >
              <Wallet className="h-4 w-4" />
              Dompet Penghasilan
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              title="Reset denah kursi & transaksi demo"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* 4 Escrow & Occupancy KPI Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Okupansi Kursi</span>
              <Armchair className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-xl font-black text-white">
              {seatCounts.sold} <span className="text-sm font-normal text-slate-400">/ {seatCounts.total}</span>
            </p>
            <p className="mt-1 text-[11px] text-emerald-400">
              {seatCounts.available} Tersedia • {seatCounts.held} Hold 5m
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-amber-300">
              <span>Dana Ditahan di Escrow</span>
              <Lock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 text-xl font-black text-white">
              Rp {escrowMetrics.totalEscrowHeld.toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-[11px] text-amber-200">
              {escrowMetrics.heldTicketCount} tiket menunggu scan Gate
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <span>Cair ke Dompet Organizer</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-xl font-black text-white">
              Rp {escrowMetrics.totalEscrowReleased.toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-[11px] text-emerald-200">
              {escrowMetrics.releasedTicketCount} penonton sudah Check-In
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Gross Penjualan</span>
              <TicketIcon className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-2 text-xl font-black text-white">
              Rp {escrowMetrics.totalGrossRevenue.toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Fee Gateway 2.5%: Rp {escrowMetrics.totalGatewayFee.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'SEAT_MAP', label: '1. Denah Kursi (Seat Map)', icon: Armchair },
              { id: 'ACTIVE_EPASS', label: '2. E-Pass QR Kriptografi', icon: QrCode },
              { id: 'GATE_SCANNER', label: '3. Gate Scanner & Cair Escrow', icon: Scan },
              { id: 'MANIFEST_METRICS', label: '4. Manifest & Refund CSV', icon: FileSpreadsheet },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      {activeTab === 'SEAT_MAP' && (
        <InteractiveSeatGrid
          onSelectSeat={handleSelectSeat}
          selectedSeatId={selectedSeat?.id}
        />
      )}

      {activeTab === 'ACTIVE_EPASS' && (
        <div className="space-y-4">
          {activeTicket ? (
            <OziktagEPass
              ticket={activeTicket}
              onSimulateScanAtGate={handleSimulateScanAtGate}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Belum ada tiket yang dipilih. Silakan pilih kursi di Denah Kursi terlebih dahulu.
              </p>
            </div>
          )}

          {/* Switch between issued tickets */}
          {tickets.length > 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Daftar E-Pass Terbit ({tickets.length} Tiket) — Klik untuk melihat QR:
              </p>
              <div className="flex flex-wrap gap-2">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTicket(t)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      activeTicket?.id === t.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold">Kursi {t.seatId}</span>
                    <span className="opacity-75">• {t.attendee.fullName}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        t.status === 'USED'
                          ? 'bg-emerald-500 text-white'
                          : t.status === 'REVOKED'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {t.escrowStatus || (t.status === 'USED' ? 'RELEASED' : 'HELD')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'GATE_SCANNER' && (
        <GateScannerDashboard initialTicketToScan={ticketToScan} />
      )}

      {activeTab === 'MANIFEST_METRICS' && (
        <OccupancyMetrics
          onSelectTicket={(t) => {
            setActiveTicket(t);
            setActiveTab('ACTIVE_EPASS');
          }}
        />
      )}

      {/* Escrow Checkout Modal */}
      <EscrowCheckoutModal
        seat={selectedSeat}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Create Event & Quota Modal */}
      {isCreateEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">Buat Event & Konfigurasi Kuota Kursi</h3>
                <p className="text-xs text-slate-400">Terhubung otomatis ke Oziktag Escrow & Dompet Organizer</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateEventOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Event *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Bandung AI & Craft Summit 2026"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Venue *</label>
                  <input
                    type="text"
                    required
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Event *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Pengaturan Harga & Kuota Kategori Kursi
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700">VIP (Rp)</label>
                    <input
                      type="number"
                      value={vipPrice}
                      onChange={(e) => setVipPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Regular (Rp)</label>
                    <input
                      type="number"
                      value={regPrice}
                      onChange={(e) => setRegPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Wing (Rp)</label>
                    <input
                      type="number"
                      value={wingPrice}
                      onChange={(e) => setWingPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateEventOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-700"
                >
                  Simpan & Aktifkan Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

