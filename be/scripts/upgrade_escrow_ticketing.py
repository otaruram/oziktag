"""
Upgrades Oziktag Event Ticketing schema to include:
- `events` table (organizer_id, title, venue, date, categories)
- `event_seats.event_id` foreign key
- `ticket_transactions` Escrow & Wallet Auto-Settlement fields (`buyer_id`, `organizer_id`, `escrow_status`, `escrow_fee`, `net_amount`, `escrow_released_at`)
"""
import os
import urllib.parse
import psycopg2

# 1. Update be/prisma/schema.prisma
with open("be/prisma/schema.prisma", "r", encoding="utf-8") as f:
    schema_text = f.read()

marker = "// ============================================================\n// Event Ticketing"
if marker not in schema_text:
    marker = "// ============================================================\r\n// Event Ticketing"

if marker in schema_text:
    prefix = schema_text[:schema_text.index(marker)]
else:
    prefix = schema_text

new_prisma_block = """// ============================================================
// Event Ticketing, Seat Map & Escrow Auto-Settlement (Oziktag x Summarecon Mall Bandung)
// ============================================================
enum SeatCategory {
  VIP
  REGULAR
  WING
}

enum SeatStatus {
  AVAILABLE
  RESERVED
  SOLD
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
}

enum CheckInStatus {
  UNUSED
  USED
}

enum EscrowStatus {
  HELD
  RELEASED
  REFUNDED
}

model Event {
  id          String   @id @default(uuid())
  organizerId String?  @map("organizer_id")
  title       String
  venue       String
  date        String
  categories  Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  seats       Seat[]

  @@index([organizerId])
  @@map("events")
}

model Seat {
  id            String       @id @default(uuid())
  eventId       String?      @map("event_id")
  seatCode      String       @unique @map("seat_code") // e.g. "A-01" or "VIP-A1"
  rowLabel      String       @map("row_label")
  colNumber     Int          @map("col_number")
  category      SeatCategory @default(REGULAR)
  price         Decimal      @db.Decimal(12, 2)
  status        SeatStatus   @default(AVAILABLE)

  // 5-minute TTL hold. Only a SHA-256 hash of the hold token is stored (never plaintext).
  reservedUntil DateTime?    @map("reserved_until")
  holdTokenHash String?      @map("hold_token_hash")
  heldByUserId  String?      @map("held_by_user_id")

  buyerName     String?      @map("buyer_name")
  buyerContact  String?      @map("buyer_contact")
  buyerEmail    String?      @map("buyer_email")

  // SHA-256 of the HMAC signature embedded in the QR (binds DB row to the issued pass).
  ticketHash    String?      @map("ticket_hash")

  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  event         Event?              @relation(fields: [eventId], references: [id], onDelete: SetNull)
  transactions  TicketTransaction[]

  @@index([eventId])
  @@index([status, reservedUntil])
  @@index([heldByUserId])
  @@map("event_seats")
}

model TicketTransaction {
  id               String        @id @default(uuid())
  seatId           String        @map("seat_id")
  userId           String?       @map("user_id")
  buyerId          String?       @map("buyer_id")
  organizerId      String?       @map("organizer_id")
  amount           Decimal       @db.Decimal(12, 2)
  escrowFee        Decimal       @default(0) @db.Decimal(12, 2) @map("escrow_fee")
  netAmount        Decimal       @default(0) @db.Decimal(12, 2) @map("net_amount")
  paymentMethod    String        @default("SIMULATED") @map("payment_method")
  paymentStatus    PaymentStatus @default(PENDING) @map("payment_status")
  checkInStatus    CheckInStatus @default(UNUSED) @map("check_in_status")
  escrowStatus     EscrowStatus  @default(HELD) @map("escrow_status")
  checkedInAt      DateTime?     @map("checked_in_at")
  checkedInGate    String?       @map("checked_in_gate")
  escrowReleasedAt DateTime?     @map("escrow_released_at")
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  seat Seat @relation(fields: [seatId], references: [id], onDelete: Cascade)

  @@index([seatId])
  @@index([checkInStatus])
  @@index([escrowStatus])
  @@index([organizerId])
  @@map("ticket_transactions")
}
"""

with open("be/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(prefix + new_prisma_block)

print("1. Updated be/prisma/schema.prisma")

# 2. Run SQL migration on Supabase PostgreSQL
env_vars = {}
if os.path.exists("be/.env"):
    with open("be/.env", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip().strip('"').strip("'")

dsn = env_vars.get("DIRECT_URL") or env_vars.get("DATABASE_URL")
if dsn:
    parsed = urllib.parse.urlsplit(dsn)
    clean_dsn = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))

    ddl = """
    DO $$ BEGIN
        CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'REFUNDED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE TABLE IF NOT EXISTS "events" (
        "id"           TEXT         NOT NULL PRIMARY KEY,
        "organizer_id" TEXT,
        "title"        TEXT         NOT NULL,
        "venue"        TEXT         NOT NULL,
        "date"         TEXT         NOT NULL,
        "categories"   JSONB        NOT NULL DEFAULT '{}'::jsonb,
        "created_at"   TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
        "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
    );

    CREATE INDEX IF NOT EXISTS "events_organizer_id_idx" ON "events" ("organizer_id");

    ALTER TABLE "event_seats" ADD COLUMN IF NOT EXISTS "event_id" TEXT REFERENCES "events"("id") ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS "event_seats_event_id_idx" ON "event_seats" ("event_id");

    ALTER TABLE "ticket_transactions" ADD COLUMN IF NOT EXISTS "buyer_id" TEXT;
    ALTER TABLE "ticket_transactions" ADD COLUMN IF NOT EXISTS "organizer_id" TEXT;
    ALTER TABLE "ticket_transactions" ADD COLUMN IF NOT EXISTS "escrow_fee" DECIMAL(12, 2) NOT NULL DEFAULT 0;
    ALTER TABLE "ticket_transactions" ADD COLUMN IF NOT EXISTS "net_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0;
    ALTER TABLE "ticket_transactions" ADD COLUMN IF NOT EXISTS "escrow_status" "EscrowStatus" NOT NULL DEFAULT 'HELD';
    ALTER TABLE "ticket_transactions" ADD COLUMN IF NOT EXISTS "escrow_released_at" TIMESTAMP(3);

    CREATE INDEX IF NOT EXISTS "ticket_transactions_escrow_status_idx" ON "ticket_transactions" ("escrow_status");
    CREATE INDEX IF NOT EXISTS "ticket_transactions_organizer_id_idx" ON "ticket_transactions" ("organizer_id");

    -- Seed default Summarecon Mall Bandung Event if not exists
    INSERT INTO "events" ("id", "title", "venue", "date", "categories")
    VALUES (
        'EVT-SMB-2026',
        'Bandung Build Challenge & Creative Tech Expo 2026',
        'Grand Atrium — Summarecon Mall Bandung (Gedebage)',
        '2026-11-15',
        '{"VIP": {"price": 250000, "quota": 20}, "REGULAR": {"price": 100000, "quota": 50}, "WING": {"price": 75000, "quota": 30}}'::jsonb
    )
    ON CONFLICT ("id") DO UPDATE SET
        "title" = EXCLUDED."title",
        "venue" = EXCLUDED."venue",
        "categories" = EXCLUDED."categories";

    UPDATE "event_seats" SET "event_id" = 'EVT-SMB-2026' WHERE "event_id" IS NULL;
    """

    conn = psycopg2.connect(clean_dsn)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(ddl)
        cur.execute("SELECT COUNT(*) FROM events;")
        ev_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM event_seats WHERE event_id = 'EVT-SMB-2026';")
        st_count = cur.fetchone()[0]
        print(f"2. Live Supabase DB Migrated! Events: {ev_count}, Linked Seats: {st_count}")
    conn.close()

