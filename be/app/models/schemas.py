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
    louvin_transaction_id: str
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
    status: str
    created_at: datetime
