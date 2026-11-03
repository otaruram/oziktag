import { useState, useEffect, useMemo } from 'react';
import { Seat, Ticket, SeatTier, AttendeeInfo } from '@/types/ticketing';
import { ticketingRepository, TIER_CONFIGS, EVENT_DETAILS } from '@/lib/ticketing-store';
import { toast } from 'sonner';
import {
  Download,
  Users,
  CreditCard,
  Percent,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Flame,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  Edit2,
  Undo2,
  X,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface OccupancyMetricsProps {
  onSelectTicket?: (ticket: Ticket) => void;
}

export function OccupancyMetrics({ onSelectTicket }: OccupancyMetricsProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'HELD' | 'BOOKED'>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Edit Attendee Modal State
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editInstitution, setEditInstitution] = useState('');

  // Explainer Modal
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);

  const loadData = () => {
    setSeats(ticketingRepository.getSeats());
    setTickets(ticketingRepository.getTickets());
  };

  useEffect(() => {
    loadData();
    const unsub = ticketingRepository.subscribe(loadData);
    return unsub;
  }, []);

  // Compute live KPIs
  const metrics = useMemo(() => {
    const total = seats.length;
    let available = 0;
    let held = 0;
    let booked = 0;
    let totalRevenue = 0;

    seats.forEach((s) => {
      if (s.status === 'AVAILABLE') available++;
      else if (s.status === 'HELD') held++;
      else if (s.status === 'BOOKED') {
        booked++;
        totalRevenue += s.price;
      }
    });

    const occupancyRate = total > 0 ? Math.round((booked / total) * 100) : 0;
    const checkedInCount = tickets.filter((t) => t.status === 'USED').length;
    const checkInRate = booked > 0 ? Math.round((checkedInCount / booked) * 100) : 0;

    return {
      total,
      available,
      held,
      booked,
      totalRevenue,
      occupancyRate,
      checkedInCount,
      checkInRate,
    };
  }, [seats, tickets]);

  // Tier Occupancy breakdown
  const tierMetrics = useMemo(() => {
    const breakdown: Record<SeatTier, { total: number; booked: number; revenue: number }> = {
      VIP: { total: 0, booked: 0, revenue: 0 },
      CAT1: { total: 0, booked: 0, revenue: 0 },
      CAT2: { total: 0, booked: 0, revenue: 0 },
      REGULAR: { total: 0, booked: 0, revenue: 0 },
    };

    seats.forEach((s) => {
      breakdown[s.tier].total++;
      if (s.status === 'BOOKED') {
        breakdown[s.tier].booked++;
        breakdown[s.tier].revenue += s.price;
      }
    });

    return breakdown;
  }, [seats]);

  // Combined manifest data joining Seats with Tickets
  const manifestData = useMemo(() => {
    const ticketMap = new Map<string, Ticket>();
    tickets.forEach((t) => {
      ticketMap.set(t.seatId, t);
    });

    return seats.map((seat) => {
      const ticket = ticketMap.get(seat.id);
      return {
        seat,
        ticket,
        holderName: ticket?.attendee.fullName || seat.heldByName || '-',
        holderEmail: ticket?.attendee.email || '-',
        holderPhone: ticket?.attendee.phone || '-',
        ticketId: ticket?.id || '-',
        checkInStatus: ticket ? ticket.status : seat.status === 'HELD' ? 'HELD' : 'AVAILABLE',
        scannedAt: ticket?.scannedAt || '-',
      };
    });
  }, [seats, tickets]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return manifestData.filter((row) => {
      const matchesSearch =
        row.seat.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.holderEmail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || row.seat.status === statusFilter;

      const matchesTier =
        tierFilter === 'ALL' || row.seat.tier === tierFilter;

      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [manifestData, searchQuery, statusFilter, tierFilter]);

  // Export Manifest to CSV
  const handleExportCSV = () => {
    const headers = [
      'Kursi ID',
      'Row',
      'Col',
      'Tier',
      'Harga (IDR)',
      'Status Kursi',
      'Nama Pemegang',
      'Email',
      'No. Telepon',
      'ID Tiket',
      'Status Check-in Gate',
      'Waktu Scan',
      'Event',
      'Venue',
    ];

    const escapeCsvField = (field: any) => {
      const stringValue = String(field ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = manifestData.map((row) => [
      row.seat.id,
      row.seat.row,
      row.seat.col,
      row.seat.tier,
      row.seat.price,
      row.seat.status,
      row.holderName,
      row.holderEmail,
      row.holderPhone,
      row.ticketId,
      row.checkInStatus,
      row.scannedAt,
      EVENT_DETAILS.name,
      EVENT_DETAILS.venue,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCsvField).join(','), ...rows.map((r) => r.map(escapeCsvField).join(','))].join(
        '\r\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Oziktag_Summarecon_Manifest_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Manifest CSV Berhasil Diekspor!', {
      description: `${manifestData.length} baris kursi telah diunduh.`,
    });
  };

  const handleOpenEditModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setEditName(ticket.attendee.fullName);
    setEditEmail(ticket.attendee.email);
    setEditPhone(ticket.attendee.phone);
    setEditInstitution(ticket.attendee.institution || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;

    const res = ticketingRepository.updateAttendeeData(editingTicket.id, {
      fullName: editName,
      email: editEmail,
      phone: editPhone,
      institution: editInstitution,
    });

    if (res.success) {
      toast.success('Data Peserta Berhasil Diperbarui!', {
        description: `Tanda tangan kriptografi tiket ${editingTicket.id} telah disinkronkan ulang.`,
      });
      setEditingTicket(null);
      loadData();
    } else {
      toast.error('Gagal memperbarui data', { description: res.error });
    }
  };

  const handleCancelAndRefund = (ticket: Ticket) => {
    if (confirm(`Batalkan pemesanan dan refund kursi ${ticket.seatId} untuk ${ticket.attendee.fullName}?`)) {
      const res = ticketingRepository.refundAndCancelTicket(ticket.id);
      if (res.success) {
        toast.success(`Tiket ${ticket.id} Telah Direfund`, {
          description: `Kursi ${ticket.seatId} kini kembali berstatus TERSEDIA.`,
        });
        loadData();
      } else {
        toast.error('Gagal refund', { description: res.error });
      }
    }
  };

  const handleResetData = () => {
    if (confirm('Reset semua data reservasi kembali ke data awal demo?')) {
      ticketingRepository.resetDemoData();
      toast.info('Data demo telah di-reset ke kondisi awal.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              Panitia Executive Suite
            </span>
            <span className="text-xs text-slate-500">Summarecon Mall Bandung 2026</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Metrik Okupansi & Manifest Pengunjung
          </h2>
          <p className="text-xs text-slate-500">
            Pemantauan kapasitas real-time, pendapatan escrow, dan log kehadiran gate panitia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExplainerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition-colors shadow-2xs"
            title="Penjelasan arsitektur pencegahan pemesanan ganda"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
            <span>Pencegahan Double Booking (OCC)</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Reset ke kondisi awal"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ekspor CSV Manifest</span>
          </button>
        </div>
      </div>

      {/* High-level KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Pendapatan Terkunci</span>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            Rp {(metrics.totalRevenue / 1000000).toFixed(2)} jt
          </div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3" />
            <span>100% Terlindungi Oziktag Escrow</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tingkat Okupansi</span>
            <Percent className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics.occupancyRate}%
          </div>
          <div className="text-[11px] text-slate-500">
            {metrics.booked} dari {metrics.total} kursi terisi
          </div>
        </div>

        {/* Available vs Held */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sisa Kursi Tersedia</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {metrics.available}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">
            {metrics.held} kursi sedang di-hold pembeli
          </div>
        </div>

        {/* Gate Check-in Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Kehadiran Gerbang (Check-in)</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics.checkInRate}%
          </div>
          <div className="text-[11px] text-slate-500">
            {metrics.checkedInCount} pengunjung telah masuk Gate
          </div>
        </div>
      </div>

      {/* Tier Occupancy Progress Bars */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Tingkat Keterisian per Kategori Kursi
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(TIER_CONFIGS) as SeatTier[]).map((tierKey) => {
            const conf = TIER_CONFIGS[tierKey];
            const data = tierMetrics[tierKey];
            const pct = data.total > 0 ? Math.round((data.booked / data.total) * 100) : 0;

            return (
              <div key={tierKey} className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{conf.label}</span>
                  <span className="font-semibold text-slate-700">{pct}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-slate-900 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{data.booked} / {data.total} Terjual</span>
                  <span>Rp {(data.revenue / 1000).toLocaleString('id-ID')}k</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search, Filter & Manifest Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Table Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 p-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor kursi, nama, tiket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-slate-900 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="AVAILABLE">Tersedia (Emerald)</option>
              <option value="HELD">On Hold (Amber)</option>
              <option value="BOOKED">Terjual (Rose)</option>
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-slate-900 focus:outline-none"
            >
              <option value="ALL">Semua Tier</option>
              <option value="VIP">VIP</option>
              <option value="CAT1">CAT 1</option>
              <option value="CAT2">CAT 2</option>
              <option value="REGULAR">Regular</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Kursi</th>
                <th className="py-3 px-4">Kategori / Tier</th>
                <th className="py-3 px-4">Harga</th>
                <th className="py-3 px-4">Status Kursi</th>
                <th className="py-3 px-4">Nama Pengunjung</th>
                <th className="py-3 px-4">ID Tiket</th>
                <th className="py-3 px-4">Check-in Gate</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada kursi yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isAvailable = row.seat.status === 'AVAILABLE';
                  const isHeld = row.seat.status === 'HELD';
                  const isBooked = row.seat.status === 'BOOKED';
                  const isCheckedIn = row.ticket?.status === 'USED';

                  return (
                    <tr key={row.seat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{row.seat.id}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {row.seat.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        Rp {row.seat.price.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        {isAvailable && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Tersedia
                          </span>
                        )}
                        {isHeld && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            On Hold
                          </span>
                        )}
                        {isBooked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Terjual
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{row.holderName}</div>
                        {row.holderEmail !== '-' && (
                          <div className="text-[10px] text-slate-400">{row.holderEmail}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {row.ticketId}
                      </td>
                      <td className="py-3 px-4">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Checked In
                          </span>
                        ) : isBooked ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                            Belum Masuk
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {row.ticket && onSelectTicket && (
                            <button
                              type="button"
                              onClick={() => onSelectTicket(row.ticket!)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Lihat Tiket Kripto"
                            >
                              <span>Lihat</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                          )}

                          {row.ticket && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(row.ticket!)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                              title="Ubah Data Peserta"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Ubah</span>
                            </button>
                          )}

                          {row.ticket && row.ticket.status !== 'REVOKED' && (
                            <button
                              type="button"
                              onClick={() => handleCancelAndRefund(row.ticket!)}
                              className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50/50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Batalkan & Refund Tiket"
                            >
                              <Undo2 className="h-3 w-3" />
                              <span>Refund</span>
                            </button>
                          )}

                          {!row.ticket && (
                            <span className="text-slate-300 text-[11px]">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Meta */}
        <div className="border-t border-slate-200 bg-slate-50/60 p-4 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredRows.length} dari {manifestData.length} total baris kursi</span>
          <span>Grand Ballroom & Sawarga Courtyard • Summarecon Mall Bandung</span>
        </div>
      </div>

      {/* Edit Attendee Modal */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setEditingTicket(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ubah Data Peserta</h3>
                <p className="text-xs text-slate-500">
                  Kursi {editingTicket.seatId} • Tiket {editingTicket.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  No. WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Instansi / Tim
                </label>
                <input
                  type="text"
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Double Booking Explainer Modal */}
      {isExplainerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsExplainerOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Arsitektur Pencegahan Pemesanan Ganda (Double Booking)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bandung Build Challenge 2026 Technical Specification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExplainerOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Untuk memenuhi syarat teknis pada Technical Brief (halaman 2 & 3), sistem Oziktag menerapkan mekanisme <strong>Optimistic Concurrency Control (OCC)</strong> dua tahap:
              </p>

              <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-[10px]">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900">Fase Hold Sementara (5 Menit / 300s):</strong>
                    <div>Saat Pengguna A mengklik kursi, server/store memeriksa status dan versi kursi. Jika berstatus AVAILABLE, sistem langsung mengubah ke HELD, mengaitkan <code>sessionId</code>, dan menyalakan timer 5 menit. Kursi lain yang sedang di-hold otomatis dilepas.</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-[10px]">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900">Intersepsi Race Condition (OCC Version Check):</strong>
                    <div>Jika Pengguna B mencoba mengklik kursi yang sama dalam detik yang sama, sistem mendeteksi tabrakan lock dan melempar pesan kesalahan interaktif <em>"Kursi sedang dalam proses checkout oleh pengunjung lain"</em>. Pengguna B dicegah melanjutkan ke form pembayaran.</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-[10px]">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900">Atomisitas Penyelesaian & Tiket:</strong>
                    <div>Hanya sesi yang memegang lock sah yang dapat men-trigger status BOOKED. Setelah transaksi sukses, segel digital kriptografi HMAC diterbitkan dan disiarkan via BroadcastChannel.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsExplainerOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Tutup Penjelasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
