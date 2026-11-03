-- ============================================================
-- Oziktag Event Ticketing — tables for Supabase SQL Editor
-- Mirrors the Seat / TicketTransaction models in prisma/schema.prisma.
-- (Alternatively run: python -m prisma db push)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "SeatCategory" AS ENUM ('VIP', 'REGULAR', 'WING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CheckInStatus" AS ENUM ('UNUSED', 'USED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS event_seats (
  id               TEXT PRIMARY KEY,
  seat_code        TEXT NOT NULL UNIQUE,
  row_label        TEXT NOT NULL,
  col_number       INTEGER NOT NULL,
  category         "SeatCategory" NOT NULL DEFAULT 'REGULAR',
  price            DECIMAL(12, 2) NOT NULL,
  status           "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
  reserved_until   TIMESTAMP(3),
  hold_token_hash  TEXT,
  held_by_user_id  TEXT,
  buyer_name       TEXT,
  buyer_contact    TEXT,
  buyer_email      TEXT,
  ticket_hash      TEXT,
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS event_seats_status_reserved_until_idx ON event_seats (status, reserved_until);
CREATE INDEX IF NOT EXISTS event_seats_held_by_user_id_idx ON event_seats (held_by_user_id);

CREATE TABLE IF NOT EXISTS ticket_transactions (
  id               TEXT PRIMARY KEY,
  seat_id          TEXT NOT NULL REFERENCES event_seats(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id          TEXT,
  amount           DECIMAL(12, 2) NOT NULL,
  payment_method   TEXT NOT NULL DEFAULT 'SIMULATED',
  payment_status   "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  check_in_status  "CheckInStatus" NOT NULL DEFAULT 'UNUSED',
  checked_in_at    TIMESTAMP(3),
  checked_in_gate  TEXT,
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS ticket_transactions_seat_id_idx ON ticket_transactions (seat_id);
CREATE INDEX IF NOT EXISTS ticket_transactions_check_in_status_idx ON ticket_transactions (check_in_status);

-- Defense in depth: at most one PAID ticket per seat, enforced by the database itself.
CREATE UNIQUE INDEX IF NOT EXISTS ticket_transactions_one_paid_per_seat
  ON ticket_transactions (seat_id) WHERE payment_status = 'PAID';

-- These tables are accessed only by the backend (service connection). Block the
-- public Supabase REST API from reading buyer data or hold hashes.
ALTER TABLE event_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_transactions ENABLE ROW LEVEL SECURITY;

