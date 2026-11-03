/**
 * Oziktag Event Ticketing & Interactive Seat Reservation Types
 * Specifically tailored for Summarecon Mall Bandung - Bandung Build Challenge 2026
 */

export type SeatTier = 'VIP' | 'REGULAR' | 'WING' | 'CAT1' | 'CAT2';

export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED';

export interface SeatTierConfig {
  tier: SeatTier;
  label: string;
  price: number;
  colorClass: string;
  description: string;
  perks: string[];
}

export interface Seat {
  id: string; // e.g. "A-01", "B-05"
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
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'REFUNDED';
  paymentMethod: PaymentMethod;
  createdAt: string;
  completedAt?: string;
  attendee: AttendeeInfo;
}

export type GateScanStatus = 'VALID' | 'ALREADY_USED' | 'INVALID' | 'EXPIRED';

export interface GateScanResult {
  status: GateScanStatus;
  message: string;
  ticket?: Ticket;
  scannedAt: string;
  gate: string;
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
  checkInRate: number;
  checkedInCount: number;
}
