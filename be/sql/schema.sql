-- ============================================================
-- Oziktag Database Schema (Supabase PostgreSQL)
-- ============================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS TABLE
-- Synced with Supabase Auth. Stores app-level user data.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    sisa_kredit INTEGER NOT NULL DEFAULT 0,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. KYC TABLE
-- One-to-one with users. NIK and NPWP must be unique.
-- ============================================================
CREATE TABLE IF NOT EXISTS kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nama_toko TEXT NOT NULL DEFAULT '',
    nik TEXT NOT NULL UNIQUE,
    npwp TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'verified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. QC_PRODUCTS TABLE
-- Each product gets a UUID that becomes the QR code identifier.
-- ============================================================
CREATE TABLE IF NOT EXISTS qc_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nama_produk TEXT NOT NULL,
    kategori TEXT NOT NULL DEFAULT 'Lainnya',
    batch TEXT,
    checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
    catatan_penjual TEXT,
    ai_insight TEXT,
    ai_solution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qc_products_user_id ON qc_products(user_id);

-- ============================================================
-- 4. PRODUCT_IMAGES TABLE
-- Stores ImageKit URLs for each product (1-5 images).
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES qc_products(id) ON DELETE CASCADE,
    imagekit_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- ============================================================
-- 5. TOPUP_TRANSACTIONS TABLE
-- Records credit purchases via Louvin payment gateway.
-- ============================================================
CREATE TABLE IF NOT EXISTS topup_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paket TEXT NOT NULL,
    amount INTEGER NOT NULL,
    credits INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    louvin_ref TEXT,
    louvin_transaction_id TEXT,
    payment_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topup_transactions_user_id ON topup_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_topup_transactions_louvin_ref ON topup_transactions(louvin_ref);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_updated_at
    BEFORE UPDATE ON kyc
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topup_transactions_updated_at
    BEFORE UPDATE ON topup_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable but allow service_role full access from backend.
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE topup_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can manage their own KYC
CREATE POLICY "Users can view own kyc" ON kyc
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kyc" ON kyc
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can manage their own products
CREATE POLICY "Users can view own products" ON qc_products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON qc_products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Public can view product images (for QR scan)
CREATE POLICY "Public can view product images" ON product_images
    FOR SELECT USING (true);

-- Policy: Users can view own transactions
CREATE POLICY "Users can view own transactions" ON topup_transactions
    FOR SELECT USING (auth.uid() = user_id);
