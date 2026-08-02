"""Pydantic models for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ──────────────────────── Auth / KYC ────────────────────────

class GoogleAuthRequest(BaseModel):
    access_token: str


class KYCRequest(BaseModel):
    nama_toko: str
    nik: str
    npwp: Optional[str] = None
    foto_ktp: Optional[str] = None
    foto_npwp: Optional[str] = None
    website: Optional[str] = None
    foto_produk_1: str
    foto_produk_2: str
    deskripsi_produk: str


class KYCResponse(BaseModel):
    message: str
    status: str = "verified"


class UserProfile(BaseModel):
    id: str
    nama: str
    email: str
    sisa_kredit: int
    api_kredit: int
    is_admin: bool = False
    has_api_access: bool = False
    is_banned: bool = False
    kyc_status: Optional[str] = None
    nama_toko: Optional[str] = None
    credit_score: int = 300
    credit_score_requested: bool = False
    can_view_credit_score: bool = False
    escrow_requested: bool = False
    escrow_request_status: Optional[str] = None
    can_use_escrow: bool = False
    is_elite: bool = False
    elite_expires_at: Optional[str] = None
    receivesPromoEmails: bool = True

# ──────────────────────── QC Products ────────────────────────

class QCSubmitResponse(BaseModel):
    product_id: str
    message: str
    ai_insight: Optional[str] = None
    ai_solution: Optional[str] = None


class ProductImage(BaseModel):
    id: str
    imagekit_url: str


class QCProductResponse(BaseModel):
    id: str
    nama_produk: str
    kategori: str
    batch: Optional[str] = None
    checklist: list
    catatan_penjual: Optional[str] = None
    harga_produksi: Optional[int] = None
    harga_jual: Optional[int] = None
    ai_insight: Optional[str] = None
    ai_solution: Optional[str] = None
    images: list[ProductImage] = []
    brand: Optional[str] = None
    created_at: str


class QCProductListItem(BaseModel):
    id: str
    nama_produk: str
    kategori: str
    batch: Optional[str] = None
    checklist: list
    created_at: str


# ──────────────────────── Top-Up / Payment ────────────────────────

class TopUpCreateRequest(BaseModel):
    paket: str = Field(..., description="starter | growth | pro | api_starter | etc")
    payment_type: str = Field(..., description="qris | bni_va | bri_va | permata_va | cimb_niaga_va | gopay | shopeepay")
    tipe_kredit: str = Field("QR", description="QR or API")


class TopUpCreateResponse(BaseModel):
    transaction_id: str
    sumopod_transaction_id: str
    amount: int
    payment_type: str
    qr_string: Optional[str] = None
    va_number: Optional[str] = None
    deeplink_url: Optional[str] = None
    expired_at: Optional[str] = None
    total_payment: int


class TopUpHistoryItem(BaseModel):
    id: str
    paket: str
    amount: int
    credits: int
    status: str
    payment_type: Optional[str] = None
    created_at: str


# ──────────────────────── Scan (Public) ────────────────────────

class ScanResponse(BaseModel):
    id: str
    nama_produk: str
    kategori: str
    batch: Optional[str] = None
    checklist: list
    catatan_penjual: Optional[str] = None
    ai_insight: Optional[str] = None
    ai_solution: Optional[str] = None
    images: list[str] = []
    brand: str = "Brand UMKM"
    created_at: str
    verified: bool = True
    is_elite: bool = False


# ──────────────────────── Admin ────────────────────────

class AdminUserItem(BaseModel):
    id: str
    nama: str
    email: str
    sisa_kredit: int
    api_kredit: int
    is_banned: bool
    is_admin: bool
    has_api_access: bool
    last_seen_at: Optional[str] = None
    created_at: str
    credit_score: int = 300
    credit_score_requested: bool = False
    can_view_credit_score: bool = False
    is_elite: bool = False


class AdminAddCreditsRequest(BaseModel):
    user_id: str
    amount: int = Field(..., gt=0, description="Number of credits to add")
    tipe_kredit: str = Field("QR", description="QR or API")


class AdminBanRequest(BaseModel):
    user_id: str
    banned: bool


class ApiAccessRequestItem(BaseModel):
    id: str
    user_id: str
    nama: str
    email: str
    status: str
    created_at: datetime

class AdminKycItem(BaseModel):
    id: str
    user_id: str
    nama: str
    email: str
    nama_toko: str
    nik: str
    npwp: Optional[str] = None
    foto_ktp: Optional[str] = None
    foto_npwp: Optional[str] = None
    website: Optional[str] = None
    foto_produk_1: Optional[str] = None
    foto_produk_2: Optional[str] = None
    deskripsi_produk: Optional[str] = None
    status: str
    created_at: datetime


# ──────────────────────── Tracking ────────────────────────

class TrackingInitRequest(BaseModel):
    name: str
    checklist_qc: list[str] = []
    seller_notes: str = ""
    is_escrow: bool = False
    price: int = 0


class TrackingInitResponse(BaseModel):
    product_id: str
    tracking_url: str
    buyer_pin: str
    ai_summary: Optional[str] = None
    message: str


class TrackingScanRequest(BaseModel):
    product_id: str
    role: str  # seller, courier, buyer
    pin: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class TrackingScanResponse(BaseModel):
    message: str
    new_status: str


class TrackingHistoryItem(BaseModel):
    id: str
    status_update: str
    scanned_by_role: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: str


class TrackingDetailResponse(BaseModel):
    id: str
    name: str
    current_status: str
    image_url: Optional[str] = None
    ai_summary: Optional[str] = None
    checklist_qc: list = []
    seller_notes: Optional[str] = None
    brand: Optional[str] = None
    history: list[TrackingHistoryItem] = []
    created_at: str
    
    # Escrow Fields
    is_escrow: bool = False
    price: int = 0
    escrow_fee: int = 0
    net_amount: int = 0
    payment_url: Optional[str] = None
    escrow_status: str = "HELD"


# ──────────────────────── Wallet / Escrow ────────────────────────

class WalletWithdrawRequest(BaseModel):
    amount: int
    bank_name: str
    bank_account: str
    account_name: str


class WithdrawRequestResponse(BaseModel):
    id: str
    amount: int
    bank_name: str
    bank_account: str
    account_name: str
    status: str
    created_at: str
    completed_at: Optional[str] = None

class EscrowRequestSubmit(BaseModel):
    nama_bank: str
    nomor_rekening: str
    nama_pemilik: str
    link_umkm: Optional[str] = None
    catatan_produk: Optional[str] = None
    tujuan_escrow: Optional[str] = None

class EscrowRequestResponse(BaseModel):
    id: str
    user_id: str
    nama_bank: str
    nomor_rekening: str
    nama_pemilik: str
    link_umkm: Optional[str] = None
    catatan_produk: Optional[str] = None
    tujuan_escrow: Optional[str] = None
    status: str
    created_at: str
