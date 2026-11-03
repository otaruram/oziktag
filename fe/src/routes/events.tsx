import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { InteractiveGrid } from '@/components/seat-map/InteractiveGrid';
import { SeatCheckoutModal } from '@/components/checkout/SeatCheckoutModal';
import { EQRCodeCard } from '@/components/ticket/EQRCodeCard';
import { GateScannerSimulator } from '@/components/admin/GateScannerSimulator';
import { OccupancyMetrics } from '@/components/admin/OccupancyMetrics';
import { Seat, Ticket } from '@/types/ticketing';
import { EVENT_DETAILS } from '@/lib/ticketing-store';
import {
  Armchair,
  Scan,
  LayoutGrid,
  Columns,
  Ticket as TicketIcon,
  Sparkles,
  MapPin,
  Calendar,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export const Route = createFileRoute('/events')({
  head: () => ({ meta: [{ title: 'Event Ticketing & Seat Map — Oziktag' }] }),
  component: EventsPage,
});

type ActiveViewMode = 'ATTENDEE_RESERVATION' | 'SPLIT_VIEW_PANITIA' | 'GATE_SCANNER' | 'OCCUPANCY_METRICS';

function EventsPage() {
  const [viewMode, setViewMode] = useState<ActiveViewMode>('ATTENDEE_RESERVATION');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [ticketToScan, setTicketToScan] = useState<Ticket | null>(null);

  const handleSelectSeat = (seat: Seat) => {
    setSelectedSeat(seat);
    setIsCheckoutOpen(true);
  };

  const handleBookingSuccess = (newTicket: Ticket) => {
    setIsCheckoutOpen(false);
    setActiveTicket(newTicket);
  };

  const handleSimulateScanAtGate = (ticket: Ticket) => {
    setTicketToScan(ticket);
    setViewMode('GATE_SCANNER');
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
            {/* Background geometric accents */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Oziktag Cryptographic Ticketing Engine
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300">
                    Bandung Build Challenge 2026
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {EVENT_DETAILS.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Grand Demo Day & Tech Exhibition • Reservasi kursi interaktif real-time dengan proteksi tabrakan data (Optimistic Concurrency Control) dan segel tiket HMAC-SHA256 Oziktag.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span>{EVENT_DETAILS.venue} ({EVENT_DETAILS.hall})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span>{EVENT_DETAILS.date} • {EVENT_DETAILS.time}</span>
                  </div>
                </div>
              </div>

              {/* View Switcher Pills */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('ATTENDEE_RESERVATION')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    viewMode === 'ATTENDEE_RESERVATION'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Armchair className="h-3.5 w-3.5" />
                  <span>Reservasi Kursi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('SPLIT_VIEW_PANITIA')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    viewMode === 'SPLIT_VIEW_PANITIA'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span>Split-View Panitia</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('GATE_SCANNER')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    viewMode === 'GATE_SCANNER'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Scan className="h-3.5 w-3.5" />
                  <span>Gate Scanner</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('OCCUPANCY_METRICS')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    viewMode === 'OCCUPANCY_METRICS'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Okupansi & Manifest</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recently Issued Ticket Callout (if any) */}
          {activeTicket && viewMode === 'ATTENDEE_RESERVATION' && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Tiket Anda Berhasil Diterbitkan: {activeTicket.id}
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Kursi {activeTicket.seatId} ({activeTicket.seatTier}) atas nama {activeTicket.attendee.fullName}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('my-ticket-card-view');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  Lihat Tiket Kripto
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: Attendee Reservation View */}
          {viewMode === 'ATTENDEE_RESERVATION' && (
            <div className="space-y-8">
              <InteractiveGrid
                onSelectSeat={handleSelectSeat}
                selectedSeatId={selectedSeat?.id}
              />

              {/* If an active ticket exists, render the cryptographic EQR card below */}
              {activeTicket && (
                <div id="my-ticket-card-view" className="pt-4 border-t border-slate-200">
                  <div className="text-center mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tiket Digital Anda
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">
                      Oziktag Cryptographic Pass
                    </h3>
                  </div>

                  <EQRCodeCard
                    ticket={activeTicket}
                    onSimulateScanAtGate={handleSimulateScanAtGate}
                  />
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: Split-View Panitia (Gate Scanner + Occupancy Metrics side by side) */}
          {viewMode === 'SPLIT_VIEW_PANITIA' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              <div className="xl:col-span-5 sticky top-20">
                <GateScannerSimulator
                  initialTicketToScan={ticketToScan}
                  onScanCompleted={() => {
                    // refresh state automatically via ticketingRepository
                  }}
                />
              </div>

              <div className="xl:col-span-7">
                <OccupancyMetrics
                  onSelectTicket={(ticket) => {
                    setActiveTicket(ticket);
                    setViewMode('ATTENDEE_RESERVATION');
                  }}
                />
              </div>
            </div>
          )}

          {/* VIEW MODE 3: Gate Scanner Solo */}
          {viewMode === 'GATE_SCANNER' && (
            <div className="max-w-4xl mx-auto">
              <GateScannerSimulator
                initialTicketToScan={ticketToScan}
                onScanCompleted={() => {}}
              />
            </div>
          )}

          {/* VIEW MODE 4: Occupancy & Manifest Solo */}
          {viewMode === 'OCCUPANCY_METRICS' && (
            <OccupancyMetrics
              onSelectTicket={(ticket) => {
                setActiveTicket(ticket);
                setViewMode('ATTENDEE_RESERVATION');
              }}
            />
          )}

          {/* Checkout Modal */}
          <SeatCheckoutModal
            seat={selectedSeat}
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            onBookingSuccess={handleBookingSuccess}
          />
        </div>
      </div>
    </AppShell>
  );
}
