import {
  Seat,
  SeatTier,
  SeatTierConfig,
  Ticket,
  Transaction,
  AttendeeInfo,
  PaymentMethod,
  GateScanResult,
} from '@/types/ticketing';

const SEATS_STORAGE_KEY = 'oziktag_event_seats_v1';
const TICKETS_STORAGE_KEY = 'oziktag_event_tickets_v1';
const TRANSACTIONS_STORAGE_KEY = 'oziktag_event_transactions_v1';
const SESSION_STORAGE_KEY = 'oziktag_client_session_id';
const BROADCAST_CHANNEL_NAME = 'oziktag_event_realtime_sync';

export const EVENT_DETAILS = {
  id: 'BBC-2026-SMB',
  name: 'Bandung Build Challenge 2026',
  subName: 'Event Ticketing & Interactive Seat Reservation System',
  venue: 'Summarecon Mall Bandung',
  hall: 'Grand Ballroom & Sawarga Courtyard (Lt. 2)',
  city: 'Bandung, Jawa Barat',
  date: 'Sabtu, 28 November 2026',
  time: '09:00 - 18:00 WIB',
  gate: 'Gate 2 (West Lobby Summarecon Mall Bandung)',
  organizer: 'Oziktag Technologies',
};

export const TIER_CONFIGS: Record<SeatTier, SeatTierConfig> = {
  VIP: {
    tier: 'VIP',
    label: 'VIP Front Row',
    price: 350000,
    colorClass: 'border-purple-300 bg-purple-50 text-purple-900',
    description: 'Akses baris terdepan, goodie bag eksklusif Oziktag, networking lounge.',
    perks: ['Front-stage unobstructed view', 'Access to VIP Tech Lounge', 'Oziktag NFC Badge Swag Pack'],
  },
  REGULAR: {
    tier: 'REGULAR',
    label: 'Regular Center',
    price: 150000,
    colorClass: 'border-slate-300 bg-slate-50 text-slate-800',
    description: 'Kenyamanan optimal untuk para developer, founder & tech enthusiasts.',
    perks: ['Grand Ballroom Access', 'Demo Showcase Access', 'Digital Certificate'],
  },
  WING: {
    tier: 'WING',
    label: 'Side Wing',
    price: 85000,
    colorClass: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    description: 'Pemandangan samping panggung dengan mobilitas tinggi.',
    perks: ['Side View', 'Quick Exit Access', 'Digital Certificate'],
  },
  CAT1: {
    tier: 'CAT1',
    label: 'Category 1',
    price: 200000,
    colorClass: 'border-blue-300 bg-blue-50 text-blue-900',
    description: 'Pandangan panggung tengah premium dengan audio fidelity tinggi.',
    perks: ['Center Stage View', 'Dedicated Q&A Microphone', 'Bandung Build 2026 Certificate'],
  },
  CAT2: {
    tier: 'CAT2',
    label: 'Category 2',
    price: 125000,
    colorClass: 'border-cyan-300 bg-cyan-50 text-cyan-900',
    description: 'Kenyamanan optimal untuk peserta umum.',
    perks: ['Ergonomic Seating', 'Standard Certificate', 'Expo Area Fast Pass'],
  },
};

// Client Session ID for hold ownership
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';
  let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sid) {
    sid = `ozk_sess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
  }
  return sid;
}

// Generate cryptographic hash signature simulation for EQR
export function generateCryptographicSignature(data: {
  ticketId: string;
  seatId: string;
  attendeeEmail: string;
  timestamp: string;
}): string {
  const secretSalt = 'OZIKTAG_SECURE_HMAC_SUMMARECON_2026';
  const rawString = `${data.ticketId}|${data.seatId}|${data.attendeeEmail}|${data.timestamp}|${secretSalt}`;
  // Simple deterministic DJB2-like hash mixed with hex encoding for zero-dependency browser runtime
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 17) ^ char;
  }
  const part1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const part2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return `0x${part1}${part2}`.toUpperCase();
}

// Initial Seats Generator (100 seats: Rows A-J, 10 columns each)
function createInitialSeats(): Seat[] {
  const rows: { row: string; tier: SeatTier }[] = [
    { row: 'A', tier: 'VIP' },
    { row: 'B', tier: 'VIP' },
    { row: 'C', tier: 'CAT1' },
    { row: 'D', tier: 'CAT1' },
    { row: 'E', tier: 'CAT1' },
    { row: 'F', tier: 'CAT2' },
    { row: 'G', tier: 'CAT2' },
    { row: 'H', tier: 'REGULAR' },
    { row: 'I', tier: 'REGULAR' },
    { row: 'J', tier: 'REGULAR' },
  ];

  const initialBookedSeatIds = new Set([
    'A-02', 'A-05', 'B-03', 'B-07', 'C-04', 'C-08', 'D-01', 'D-06',
    'E-03', 'E-09', 'F-02', 'F-07', 'G-05', 'H-03', 'I-06', 'J-02'
  ]);

  const seats: Seat[] = [];

  for (const { row, tier } of rows) {
    for (let col = 1; col <= 10; col++) {
      const colFormatted = col.toString().padStart(2, '0');
      const id = `${row}-${colFormatted}`;
      const isPreBooked = initialBookedSeatIds.has(id);

      seats.push({
        id,
        row,
        col,
        tier,
        price: TIER_CONFIGS[tier].price,
        status: isPreBooked ? 'BOOKED' : 'AVAILABLE',
        version: 1,
        bookedByTicketId: isPreBooked ? `OZT-BDG26-${row}${colFormatted}` : undefined,
      });
    }
  }

  return seats;
}

// Initial seed tickets for pre-booked seats
function createInitialTickets(): Ticket[] {
  const initialBooked = [
    { seatId: 'A-02', tier: 'VIP', name: 'Rangga Aditya', email: 'rangga@itb.ac.id', phone: '081223456789', status: 'USED' as const, scannedAt: '2026-11-28 09:15:22' },
    { seatId: 'A-05', tier: 'VIP', name: 'Gita Saraswati', email: 'gita@techstartup.id', phone: '081398765432', status: 'VALID' as const },
    { seatId: 'B-03', tier: 'VIP', name: 'Farhan Maulana', email: 'farhan@oziktag.id', phone: '081567890123', status: 'VALID' as const },
    { seatId: 'C-04', tier: 'CAT1', name: 'Dian Permana', email: 'dian@bandungdev.org', phone: '081987654321', status: 'VALID' as const },
    { seatId: 'D-01', tier: 'CAT1', name: 'Nadhira Putri', email: 'nadhira@unpad.ac.id', phone: '081234509876', status: 'USED' as const, scannedAt: '2026-11-28 09:32:10' },
  ];

  return initialBooked.map((item) => {
    const [row, colStr] = item.seatId.split('-');
    const col = parseInt(colStr, 10);
    const tier = item.tier as SeatTier;
    const issuedAt = '2026-11-20T10:00:00.000Z';
    const id = `OZT-BDG26-${row}${colStr}`;
    const hash = generateCryptographicSignature({
      ticketId: id,
      seatId: item.seatId,
      attendeeEmail: item.email,
      timestamp: issuedAt,
    });

    const qrPayload = JSON.stringify({
      brand: 'Oziktag',
      v: 2,
      tid: id,
      sid: item.seatId,
      tier,
      event: 'BBC-2026-SMB',
      holder: item.name,
      sig: hash,
    });

    return {
      id,
      seatId: item.seatId,
      seatRow: row,
      seatCol: col,
      seatTier: tier,
      price: TIER_CONFIGS[tier].price,
      attendee: {
        fullName: item.name,
        email: item.email,
        phone: item.phone,
        institution: 'Bandung Build Challenge Participant',
      },
      event: {
        id: EVENT_DETAILS.id,
        name: EVENT_DETAILS.name,
        venue: EVENT_DETAILS.venue,
        hall: EVENT_DETAILS.hall,
        date: EVENT_DETAILS.date,
        time: EVENT_DETAILS.time,
        gate: EVENT_DETAILS.gate,
        organizer: EVENT_DETAILS.organizer,
      },
      status: item.status,
      issuedAt,
      scannedAt: item.scannedAt,
      scannedByGate: item.status === 'USED' ? 'Gate 2 - Summarecon Mall' : undefined,
      cryptographicHash: hash,
      qrPayload,
      transactionId: `TX-OZK-${row}${colStr}-INIT`,
    };
  });
}

// Memory & LocalStorage Repository
class TicketingRepository {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'TICKETING_STATE_UPDATED') {
            this.notify();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment', e);
      }

      // Check expired holds every 5 seconds
      setInterval(() => {
        this.cleanExpiredHolds();
      }, 5000);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  private broadcastChange(): void {
    this.notify();
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'TICKETING_STATE_UPDATED', timestamp: Date.now() });
      } catch (err) {
        console.warn('Failed to postMessage on BroadcastChannel', err);
      }
    }
  }

  public getSeats(): Seat[] {
    if (typeof window === 'undefined') return createInitialSeats();
    const raw = localStorage.getItem(SEATS_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialSeats();
      localStorage.setItem(SEATS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      const seats: Seat[] = JSON.parse(raw);
      // Auto purge expired holds dynamically on read
      const now = Date.now();
      let hasExpired = false;
      seats.forEach((seat) => {
        if (seat.status === 'HELD' && seat.holdExpiresAt && seat.holdExpiresAt < now) {
          seat.status = 'AVAILABLE';
          seat.heldBySessionId = undefined;
          seat.heldByName = undefined;
          seat.holdExpiresAt = undefined;
          seat.version += 1;
          hasExpired = true;
        }
      });
      if (hasExpired) {
        localStorage.setItem(SEATS_STORAGE_KEY, JSON.stringify(seats));
      }
      return seats;
    } catch {
      const fallback = createInitialSeats();
      localStorage.setItem(SEATS_STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }
  }

  private saveSeats(seats: Seat[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SEATS_STORAGE_KEY, JSON.stringify(seats));
    this.broadcastChange();
  }

  public getTickets(): Ticket[] {
    if (typeof window === 'undefined') return createInitialTickets();
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialTickets();
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveTickets(tickets: Ticket[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
    this.broadcastChange();
  }

  public getTransactions(): Transaction[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveTransaction(tx: Transaction): void {
    if (typeof window === 'undefined') return;
    const all = this.getTransactions();
    all.unshift(tx);
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(all));
    this.broadcastChange();
  }

  private cleanExpiredHolds(): void {
    const seats = this.getSeats();
    const now = Date.now();
    let updated = false;

    seats.forEach((seat) => {
      if (seat.status === 'HELD' && seat.holdExpiresAt && seat.holdExpiresAt < now) {
        seat.status = 'AVAILABLE';
        seat.heldBySessionId = undefined;
        seat.heldByName = undefined;
        seat.holdExpiresAt = undefined;
        seat.version += 1;
        updated = true;
      }
    });

    if (updated) {
      this.saveSeats(seats);
    }
  }

  /**
   * Acquire a 5-minute hold on a seat with Race-Condition (OCC) validation
   */
  public acquireSeatHold(
    seatId: string,
    sessionId: string,
    attendeeName?: string
  ): { success: boolean; seat?: Seat; error?: string } {
    const seats = this.getSeats();
    const target = seats.find((s) => s.id === seatId);

    if (!target) {
      return { success: false, error: `Kursi ${seatId} tidak ditemukan di denah.` };
    }

    const now = Date.now();

    // Check if already held by another session and not yet expired
    if (target.status === 'HELD' && target.heldBySessionId !== sessionId) {
      if (target.holdExpiresAt && target.holdExpiresAt > now) {
        const remainingSeconds = Math.ceil((target.holdExpiresAt - now) / 1000);
        return {
          success: false,
          error: `RACE CONDITION DETECTED: Kursi ${seatId} baru saja dikunci oleh pengunjung lain (${remainingSeconds} detik tersisa pada sesi mereka). Silakan pilih kursi lain.`,
        };
      }
    }

    // Check if already booked
    if (target.status === 'BOOKED') {
      return {
        success: false,
        error: `Kursi ${seatId} sudah ludes terjual (Booked/Sold).`,
      };
    }

    // If currently holding another seat in the same session, release it first
    seats.forEach((s) => {
      if (s.heldBySessionId === sessionId && s.id !== seatId && s.status === 'HELD') {
        s.status = 'AVAILABLE';
        s.heldBySessionId = undefined;
        s.heldByName = undefined;
        s.holdExpiresAt = undefined;
        s.version += 1;
      }
    });

    // Lock the seat for 5 minutes (300,000 ms)
    const holdDurationMs = 5 * 60 * 1000;
    target.status = 'HELD';
    target.heldBySessionId = sessionId;
    target.heldByName = attendeeName || 'Calon Pengunjung';
    target.holdExpiresAt = now + holdDurationMs;
    target.version += 1;

    this.saveSeats(seats);
    return { success: true, seat: { ...target } };
  }

  /**
   * Release hold if checkout modal is closed or user deselects
   */
  public releaseSeatHold(seatId: string, sessionId: string): void {
    const seats = this.getSeats();
    const target = seats.find((s) => s.id === seatId);

    if (target && target.status === 'HELD' && target.heldBySessionId === sessionId) {
      target.status = 'AVAILABLE';
      target.heldBySessionId = undefined;
      target.heldByName = undefined;
      target.holdExpiresAt = undefined;
      target.version += 1;
      this.saveSeats(seats);
    }
  }

  /**
   * Confirm booking after successful payment simulation
   */
  public completeBooking(
    seatId: string,
    sessionId: string,
    attendee: AttendeeInfo,
    paymentMethod: PaymentMethod
  ): { success: boolean; ticket?: Ticket; error?: string } {
    const seats = this.getSeats();
    const target = seats.find((s) => s.id === seatId);

    if (!target) {
      return { success: false, error: 'Kursi tidak ditemukan.' };
    }

    const now = Date.now();

    // Verify hold validity and ownership
    if (target.status !== 'HELD' || target.heldBySessionId !== sessionId) {
      return {
        success: false,
        error: 'Sesi reservasi Anda telah habis atau kursi ini telah dialihkan. Silakan ulangi pemilihan kursi.',
      };
    }

    if (target.holdExpiresAt && target.holdExpiresAt < now) {
      target.status = 'AVAILABLE';
      target.heldBySessionId = undefined;
      target.holdExpiresAt = undefined;
      this.saveSeats(seats);
      return {
        success: false,
        error: 'Waktu checkout 5 menit telah kedaluwarsa. Kursi dikembalikan ke status tersedia.',
      };
    }

    // Generate cryptographic ticket
    const [row, colStr] = target.id.split('-');
    const col = parseInt(colStr, 10);
    const ticketId = `OZT-BDG26-${row}${colStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    const issuedAt = new Date().toISOString();

    const cryptographicHash = generateCryptographicSignature({
      ticketId,
      seatId: target.id,
      attendeeEmail: attendee.email,
      timestamp: issuedAt,
    });

    const qrPayload = JSON.stringify({
      brand: 'Oziktag',
      v: 2,
      tid: ticketId,
      sid: target.id,
      tier: target.tier,
      event: EVENT_DETAILS.id,
      holder: attendee.fullName,
      sig: cryptographicHash,
    });

    const newTicket: Ticket = {
      id: ticketId,
      seatId: target.id,
      seatRow: row,
      seatCol: col,
      seatTier: target.tier,
      price: target.price,
      attendee,
      event: {
        id: EVENT_DETAILS.id,
        name: EVENT_DETAILS.name,
        venue: EVENT_DETAILS.venue,
        hall: EVENT_DETAILS.hall,
        date: EVENT_DETAILS.date,
        time: EVENT_DETAILS.time,
        gate: EVENT_DETAILS.gate,
        organizer: EVENT_DETAILS.organizer,
      },
      status: 'VALID',
      issuedAt,
      cryptographicHash,
      qrPayload,
      transactionId: `TX-OZK-${Date.now().toString(36).toUpperCase()}`,
    };

    // Commit seat state
    target.status = 'BOOKED';
    target.heldBySessionId = undefined;
    target.heldByName = undefined;
    target.holdExpiresAt = undefined;
    target.bookedByTicketId = ticketId;
    target.version += 1;

    // Save transaction
    const newTx: Transaction = {
      id: newTicket.transactionId,
      seatId: target.id,
      ticketId,
      amount: target.price,
      status: 'SUCCESS',
      paymentMethod,
      createdAt: issuedAt,
      completedAt: issuedAt,
      attendee,
    };

    this.saveSeats(seats);
    const tickets = this.getTickets();
    tickets.unshift(newTicket);
    this.saveTickets(tickets);
    this.saveTransaction(newTx);

    return { success: true, ticket: newTicket };
  }

  /**
   * Panitia Gate Scanner Verification Engine
   * Validates state and HMAC cryptographic checksum
   */
  public verifyAndScanTicket(rawInput: string, gateName = 'Gate 2 - Summarecon Mall'): GateScanResult {
    const tickets = this.getTickets();
    const now = new Date().toLocaleTimeString('id-ID', { hour12: false });

    let targetTicket: Ticket | undefined;
    let decodedPayload: any = null;

    // Try parsing as JSON QR payload first
    try {
      decodedPayload = JSON.parse(rawInput);
      if (decodedPayload.tid) {
        targetTicket = tickets.find((t) => t.id === decodedPayload.tid);
      }
    } catch {
      // Fallback: direct Ticket ID search
      targetTicket = tickets.find((t) => t.id === rawInput.trim());
    }

    if (!targetTicket) {
      return {
        status: 'INVALID',
        message: 'Tiket tidak terdaftar dalam database Oziktag atau segel digital palsu.',
        scannedAt: now,
        gate: gateName,
      };
    }

    // Verify cryptographic signature integrity
    const expectedSig = generateCryptographicSignature({
      ticketId: targetTicket.id,
      seatId: targetTicket.seatId,
      attendeeEmail: targetTicket.attendee.email,
      timestamp: targetTicket.issuedAt,
    });

    if (decodedPayload && decodedPayload.sig && decodedPayload.sig !== expectedSig) {
      return {
        status: 'INVALID',
        message: 'PEMALSUAN TERDETEKSI: Checksum kriptografi tiket tidak cocok dengan signature master Oziktag.',
        scannedAt: now,
        gate: gateName,
      };
    }

    // Check if already used
    if (targetTicket.status === 'USED') {
      return {
        status: 'ALREADY_USED',
        message: `Tiket ini SUDAH DIGUNAKAN sebelumnya pada ${targetTicket.scannedAt || 'waktu lampau'} melalui ${targetTicket.scannedByGate || 'Gate Utama'}.`,
        ticket: targetTicket,
        scannedAt: now,
        gate: gateName,
      };
    }

    // Check if revoked
    if (targetTicket.status === 'REVOKED') {
      return {
        status: 'INVALID',
        message: 'Tiket telah DIBATALKAN / DI-REVOKE oleh panitia atau sistem escrow.',
        ticket: targetTicket,
        scannedAt: now,
        gate: gateName,
      };
    }

    // Valid entry! Transition ticket to USED
    targetTicket.status = 'USED';
    targetTicket.scannedAt = `${new Date().toLocaleDateString('id-ID')} ${now} WIB`;
    targetTicket.scannedByGate = gateName;

    this.saveTickets(tickets);

    return {
      status: 'VALID',
      message: 'TIKET TERVERIFIKASI VALID. Silakan masuk ke Grand Ballroom!',
      ticket: targetTicket,
      scannedAt: now,
      gate: gateName,
    };
  }

  /**
   * Simulate a race condition: another concurrent user tries to claim a seat at the same instant
   */
  public simulateContentionRace(seatId: string): { success: boolean; message: string } {
    const seats = this.getSeats();
    const seat = seats.find((s) => s.id === seatId);

    if (!seat) return { success: false, message: 'Kursi tidak ditemukan.' };

    const simulatedCompetitorSession = `competitor_${Math.random().toString(36).substring(2, 7)}`;
    seat.status = 'HELD';
    seat.heldBySessionId = simulatedCompetitorSession;
    seat.heldByName = 'Peserta Bandung Lain (Simulasi Kompetisi)';
    seat.holdExpiresAt = Date.now() + 5 * 60 * 1000;
    seat.version += 1;

    this.saveSeats(seats);
    return {
      success: true,
      message: `Simulasi aktif: Kursi ${seatId} telah dikunci oleh peserta lain secara bersamaan.`,
    };
  }

  /**
   * Update attendee metadata (Perubahan data peserta - fitur pendukung brief)
   */
  public updateAttendeeData(
    ticketId: string,
    updated: Partial<AttendeeInfo>
  ): { success: boolean; ticket?: Ticket; error?: string } {
    const tickets = this.getTickets();
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return { success: false, error: 'Tiket tidak ditemukan.' };

    target.attendee = {
      ...target.attendee,
      ...updated,
    };

    // Recompute cryptographic HMAC signature
    target.cryptographicHash = generateCryptographicSignature({
      ticketId: target.id,
      seatId: target.seatId,
      attendeeEmail: target.attendee.email,
      timestamp: target.issuedAt,
    });

    target.qrPayload = JSON.stringify({
      brand: 'Oziktag',
      v: 2,
      tid: target.id,
      sid: target.seatId,
      tier: target.seatTier,
      event: target.event.id,
      holder: target.attendee.fullName,
      sig: target.cryptographicHash,
    });

    this.saveTickets(tickets);
    return { success: true, ticket: target };
  }

  /**
   * Pembatalan & Refund Tiket (Fitur pendukung brief)
   */
  public refundAndCancelTicket(
    ticketId: string,
    reason = 'Permintaan Pengunjung / Kebijakan Panitia'
  ): { success: boolean; error?: string } {
    const tickets = this.getTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return { success: false, error: 'Tiket tidak ditemukan.' };

    if (ticket.status === 'REVOKED') {
      return { success: false, error: 'Tiket sudah dibatalkan sebelumnya.' };
    }

    ticket.status = 'REVOKED';

    // Release seat back to AVAILABLE
    const seats = this.getSeats();
    const seat = seats.find((s) => s.id === ticket.seatId);
    if (seat) {
      seat.status = 'AVAILABLE';
      seat.bookedByTicketId = undefined;
      seat.heldBySessionId = undefined;
      seat.heldByName = undefined;
      seat.holdExpiresAt = undefined;
      seat.version += 1;
      this.saveSeats(seats);
    }

    // Record refund transaction
    const refundTx: Transaction = {
      id: `TX-REFUND-${Date.now().toString(36).toUpperCase()}`,
      seatId: ticket.seatId,
      ticketId: ticket.id,
      amount: ticket.price,
      status: 'REFUNDED',
      paymentMethod: 'ESCROW_WALLET',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      attendee: ticket.attendee,
    };
    this.saveTransaction(refundTx);
    this.saveTickets(tickets);

    return { success: true };
  }

  /**
   * Reset data to pristine demo state
   */
  public resetDemoData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SEATS_STORAGE_KEY);
    localStorage.removeItem(TICKETS_STORAGE_KEY);
    localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
    this.broadcastChange();
  }
}

export const ticketingRepository = new TicketingRepository();
