/**
 * Oziktag Event Ticketing, Interactive Seat Map & Escrow Auto-Settlement Types
 * Specifically tailored for Summarecon Mall Bandung - Bandung Build Challenge 2026
 */

export type SeatTier = 'VIP' | 'REGULAR' | 'WING' | 'CAT1' | 'CAT2';

export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED';

export type EscrowStatus = 'HELD' | 'RELEASED' | 'REFUNDED';

export interface SeatTierConfig {
  tier: SeatTier;
  label: string;
  price: number;
  colorClass: string;
  description: string;
  perks: string[];
}

export interface EventCategoryQuota {
  price: number;
  quota: number;
}

export interface EventConfig {
  id: string;
  organizerId?: string;
  title: string;
  venue: string;
  date: string;
  time?: string;
  categories: {
    VIP: EventCategoryQuota;
    REGULAR: EventCategoryQuota;
    WING: EventCategoryQuota;
  };
  totalSeats?: number;
  soldSeats?: number;
  grossRevenue?: number;
  escrowHeld?: number;
  escrowReleased?: number;
}

export interface Seat {
  id: string; // e.g. "A-01", "B-05"
  eventId?: string;
  row: string; // "A", "B", ...
  col: number; // 1, 2, ...
  tier: SeatTier;
  price: number;
  status: SeatStatus;
  heldBySessionId?: string;
  heldByName?: string;
  holdExpiresAt?: number; // epoch ms (5 min window)
  bookedByTicketId?: string;
  version: number; // Optimistic Concurrency Control (OCC)
}

export interface AttendeeInfo {
  fullName: string;
  email: string;
  phone: string;
  institution?: string; // Team / University / Startup for Bandung Build Challenge
  idNumber?: string; // NIK or Student ID for verification
}

export type PaymentMethod = 'QRIS_OZIKTAG' | 'ESCROW_WALLET' | 'VIRTUAL_ACCOUNT';

export interface Ticket {
  id: string; // e.g. "OZT-BDG26-7842"
  seatId: string;
  seatRow: string;
  seatCol: number;
  seatTier: SeatTier;
  price: number;
  escrowFee: number; // 2.5% Oziktag Escrow & Payment Gateway fee
  netAmount: number; // 97.5% net settlement to Organizer Dompet Penghasilan
  escrowStatus: EscrowStatus;
  escrowReleasedAt?: string;
  attendee: AttendeeInfo;
  event: {
    id: string;
    name: string;
    venue: string;
    hall: string;
    date: string;
    time: string;
    gate: string;
    organizer: string;
  };
  status: 'VALID' | 'USED' | 'REVOKED';
  issuedAt: string;
  scannedAt?: string;
  scannedByGate?: string;
  cryptographicHash: string; // HMAC / SHA256 signature
  qrPayload: string; // Serialized cryptographic payload for QR
  transactionId: string;
}

export interface Transaction {
  id: string;
  seatId: string;
  ticketId: string;
  amount: number;
  escrowFee: number;
  netAmount: number;
  escrowStatus: EscrowStatus;
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'REFUNDED';
  paymentMethod: PaymentMethod;
  createdAt: string;
  completedAt?: string;
  escrowReleasedAt?: string;
  attendee: AttendeeInfo;
}

export type EscrowTransaction = Transaction;

export type GateScanStatus = 'VALID' | 'ALREADY_USED' | 'INVALID' | 'EXPIRED';

export interface GateScanResult {
  status: GateScanStatus;
  message: string;
  ticket?: Ticket;
  scannedAt: string;
  gate: string;
  escrowStatus?: EscrowStatus;
  settledNetAmount?: number;
  escrowFee?: number;
  walletCredited?: boolean;
}

export interface VenueSummary {
  eventName: string;
  venueName: string;
  city: string;
  date: string;
  totalSeats: number;
  availableSeats: number;
  heldSeats: number;
  bookedSeats: number;
  occupancyRate: number;
  totalRevenue: number;
  escrowHeldAmount: number;
  escrowReleasedAmount: number;
  checkInRate: number;
  checkedInCount: number;
}
