"""Unified AI analysis service with model fallback."""

import httpx
import json
import hashlib
from app.config import get_settings
from app.database import db


# ──────────── Core AI Call Helper ────────────
async def _call_ai(prompt: str, image_urls: list[str] | None = None) -> str:
    """
    Central function to call AI with automatic model fallback.
    Primary: claude-haiku-4-5
    Backup: gemini/gemini-3.1-flash-lite
    Final fallback: settings.gemini_model (from .env)
    """
    settings = get_settings()
    base_url = settings.gemini_base_url.rstrip("/")
    url = f"{base_url}/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.gemini_api_key}",
    }

    if image_urls:
        content = [{"type": "text", "text": prompt}]
        for img_url in image_urls:
            content.append({"type": "image_url", "image_url": {"url": img_url}})
    else:
        content = prompt

    models = [
        "claude-haiku-4-5",
        "gemini/gemini-3.1-flash-lite",
        settings.gemini_model,
    ]
    # Deduplicate while preserving order
    seen = set()
    unique_models = []
    for m in models:
        if m not in seen:
            seen.add(m)
            unique_models.append(m)

    last_err = None
    async with httpx.AsyncClient(timeout=30.0) as client:
        for model in unique_models:
            try:
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": content}],
                    "max_tokens": 1024,
                    "temperature": 0.7,
                }
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                resp_text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if resp_text:
                    print(f"[AI Service] Success with model: {model}")
                    return resp_text
                else:
                    print(f"[AI Service] Empty response from model: {model}")
            except Exception as e:
                last_err = e
                print(f"[AI Service] Model '{model}' failed: {e}")
                continue

    raise Exception(f"All AI models failed. Last error: {last_err}")


# ──────────── QC Analysis ────────────
async def analyze_qc(
    checklist: list[str],
    catatan_penjual: str,
    nama_produk: str,
    kategori: str,
    harga_produksi: int | None = None,
    harga_jual: int | None = None,
    image_urls: list[str] | None = None,
) -> dict:
    """
    Call AI to analyze QC data and images.
    Returns dict with 'ai_insight' and 'ai_solution'.
    """
    image_urls = image_urls or []

    prompt = f"""Kamu adalah asisten Quality Control profesional untuk produk UMKM Indonesia.
Analisis data QC (termasuk gambar jika ada) berikut dan berikan output dalam format yang diminta.

=== DATA PRODUK ===
Nama Produk: {nama_produk}
Kategori: {kategori}

=== CHECKLIST QC PENJUAL ===
{chr(10).join(f"✓ {item}" for item in checklist) if checklist else "Tidak ada checklist."}

=== CATATAN PENJUAL ===
{catatan_penjual or "Tidak ada catatan khusus."}

=== INSTRUKSI ===
Berdasarkan data di atas (serta gambar jika diberikan), berikan analisis:

1. **INSIGHT**: Berikan insight umum tentang kondisi produk ini (2-3 kalimat). 
   Fokus pada: apakah produk layak berdasarkan klaim di catatan penjual, apa yang sudah baik, dan apakah ada hal yang perlu diperhatikan pembeli.
   Gunakan bahasa yang ramah dan meyakinkan untuk pembeli.

2. **SOLUSI**: Berikan solusi dan tips perawatan spesifik untuk produk kategori "{kategori}" (2-3 kalimat).
   Fokus pada: cara menyimpan, merawat, dan menjaga kualitas produk ini agar tetap optimal.

Format output (WAJIB ikuti persis):
INSIGHT: [isi insight di sini]
SOLUSI: [isi solusi di sini]
"""

    if harga_produksi and harga_jual:
        margin = round((harga_jual - harga_produksi) / harga_jual * 100, 1) if harga_jual > 0 else 0
        prompt += f"""
=== DATA FINANSIAL (RAHASIA — hanya untuk analisis) ===
Harga Produksi: Rp {harga_produksi:,}
Harga Jual: Rp {harga_jual:,}
Margin: {margin}%

Tambahkan saran bisnis singkat di dalam SOLUSI: apakah margin sehat, tips efisiensi produksi, atau saran pengemasan untuk mengurangi retur.
"""

    # 1. Generate Input Hash
    img_str = ",".join(sorted(image_urls))
    raw_input = f"{nama_produk}|{kategori}|{catatan_penjual}|{','.join(sorted(checklist))}|{harga_produksi or ''}|{harga_jual or ''}|{img_str}"
    input_hash = hashlib.sha256(raw_input.encode('utf-8')).hexdigest()

    # 2. Check Cache
    try:
        cached = await db.aicache.find_unique(where={"inputHash": input_hash})
        if cached:
            print(f"[AI Service] Cache HIT for QC {input_hash}")
            return {
                "ai_insight": cached.insight,
                "ai_solution": cached.solution,
            }
    except Exception as e:
        print(f"[AI Service] Cache error: {e}")

    # 3. Call AI
    try:
        resp_text = await _call_ai(prompt, image_urls if image_urls else None)
        result = _parse_ai_response(resp_text, nama_produk, kategori, catatan_penjual)
        
        # 4. Save to Cache
        try:
            await db.aicache.create(
                data={
                    "inputHash": input_hash,
                    "insight": result["ai_insight"],
                    "solution": result["ai_solution"],
                }
            )
        except Exception as e:
            print(f"[AI Service] Failed to save cache: {e}")
            
        return result

    except Exception as e:
        print(f"[AI Service] Error calling AI for QC: {e}")
        return _fallback_response(nama_produk, kategori, catatan_penjual, checklist, harga_produksi, harga_jual)


# ──────────── Tracking Analysis ────────────
async def analyze_tracking(
    name: str,
    checklist: list[str],
    seller_notes: str,
    image_url: str | None = None,
    youtube_url: str | None = None,
) -> str:
    """
    Call AI to analyze Tracking data for risk mitigation and informative insights.
    Returns a single string summarizing the tracking status, condition, and tips.
    """
    prompt = f"""Kamu adalah asisten Logistik & Quality Control profesional yang bertugas memitigasi risiko bagi pembeli.
Analisis pengiriman paket ini dan berikan ringkasan yang informatif, padat, dan berguna.

=== DATA PENGIRIMAN ===
Nama Paket: {name}
Checklist QC: {chr(10).join(f"✓ {item}" for item in checklist) if checklist else "Tidak ada checklist."}
Catatan Manual Penjual: {seller_notes or "Tidak ada catatan."}
Link Video YouTube: {youtube_url or "Tidak dilampirkan."}

=== INSTRUKSI ===
Buat ringkasan menggunakan **bullet points** (poin-poin) agar sangat mudah dan cepat dibaca oleh pembeli. Isi poin-poinnya harus mencakup:
- **Kondisi Paket**: Berdasarkan hasil QC, catatan penjual, dan lampiran yang ada.
- **Perlindungan Pembeli**: Panduan mitigasi risiko jika terjadi ketidaksesuaian (contoh: anjuran wajib video unboxing dan klaim dalam 24 jam).
- **Tips Ekstra**: Saran perawatan atau informasi berguna terkait produk tersebut.

Gunakan bahasa yang profesional, ringkas, padat, dan meyakinkan. HANYA keluarkan poin-poinnya saja, tanpa basa-basi kalimat pembuka/penutup.
"""

    img_str = image_url or ""
    yt_str = youtube_url or ""
    raw_input = f"track_v4|{name}|{seller_notes}|{','.join(sorted(checklist))}|{img_str}|{yt_str}"
    input_hash = hashlib.sha256(raw_input.encode('utf-8')).hexdigest()

    try:
        cached = await db.aicache.find_unique(where={"inputHash": input_hash})
        if cached:
            print(f"[AI Service] Cache HIT for Tracking {input_hash}")
            return cached.insight
    except Exception:
        pass

    try:
        image_urls = [image_url] if image_url else None
        resp_text = await _call_ai(prompt, image_urls)

        try:
            await db.aicache.create(
                data={
                    "inputHash": input_hash,
                    "insight": resp_text,
                    "solution": "-",
                }
            )
        except Exception:
            pass
            
        return resp_text

    except Exception as e:
        print(f"[AI Service] Error calling AI for tracking: {e}")
        notes_str = f" dengan catatan: '{seller_notes}'" if seller_notes else ""
        return f"Paket '{name}' telah disiapkan dengan baik dan melalui {len(checklist)} poin pengecekan kondisi{notes_str}. Untuk memitigasi risiko, kami sarankan Anda merekam video unboxing tanpa jeda saat paket tiba sebagai bukti jika terjadi ketidaksesuaian."


# ──────────── Parsing & Fallbacks ────────────
def _parse_ai_response(
    content: str,
    nama_produk: str,
    kategori: str,
    catatan_penjual: str,
) -> dict:
    """Parse AI response into insight and solution."""
    import re
    
    # Clean common markdown formatting before parsing to avoid regex/UI issues
    clean_content = re.sub(r'\*\*', '', content)
    clean_content = re.sub(r'^#+\s*', '', clean_content, flags=re.MULTILINE)
    clean_content = re.sub(r'^\s*-\s*', '', clean_content, flags=re.MULTILINE)
    clean_content = re.sub(r'^\s*---\s*', '', clean_content, flags=re.MULTILINE)
    
    ai_insight = ""
    ai_solution = ""

    lines = clean_content.strip().split("\n")
    current_section = None

    for line in lines:
        stripped = line.strip()
        if stripped.upper().startswith("INSIGHT:"):
            current_section = "insight"
            ai_insight = stripped[len("INSIGHT:"):].strip()
        elif stripped.upper().startswith("SOLUSI:"):
            current_section = "solution"
            ai_solution = stripped[len("SOLUSI:"):].strip()
        elif current_section == "insight" and stripped:
            ai_insight += " " + stripped
        elif current_section == "solution" and stripped:
            ai_solution += " " + stripped

    if not ai_insight and not ai_solution:
        parts = clean_content.split("\n\n", 1)
        ai_insight = parts[0].strip() if parts else clean_content.strip()
        ai_solution = parts[1].strip() if len(parts) > 1 else ""

    return {
        "ai_insight": ai_insight.strip() or f"Produk {nama_produk} telah melewati Quality Control.",
        "ai_solution": ai_solution.strip() or f"Simpan produk di tempat yang sesuai untuk kategori {kategori}.",
    }


def _fallback_response(
    nama_produk: str,
    kategori: str,
    catatan_penjual: str,
    checklist: list[str],
    harga_produksi: int | None = None,
    harga_jual: int | None = None,
) -> dict:
    """Generate fallback response when AI is unavailable."""
    has_notes = catatan_penjual and catatan_penjual.strip()

    if has_notes:
        insight = (
            f"Produk {nama_produk} telah melewati {len(checklist)} checklist Quality Control. "
            f'Catatan dari penjual: "{catatan_penjual}" — informasi ini diberikan dengan transparan '
            f"untuk menjaga kepercayaan pembeli."
        )
    else:
        insight = (
            f"Produk {nama_produk} telah lolos seluruh {len(checklist)} checklist Quality Control "
            f"dan berada dalam kondisi prima serta original."
        )

    care_tips = {
        "Makanan & Minuman": "Simpan di tempat sejuk dan kering, hindari sinar matahari langsung untuk menjaga rasa & aroma.",
        "Fashion": "Cuci dengan air dingin dan jemur di tempat teduh agar warna & serat tetap awet.",
        "Kerajinan": "Bersihkan dengan kain kering, hindari kelembapan tinggi agar tidak berjamur.",
        "Kecantikan": "Tutup rapat setelah dipakai dan simpan di suhu ruang, hindari paparan matahari.",
    }

    solution = care_tips.get(kategori, "Simpan di tempat aman, kering, dan jauh dari jangkauan anak-anak.")

    if harga_produksi and harga_jual and harga_jual > 0:
        margin = round((harga_jual - harga_produksi) / harga_jual * 100, 1)
        if margin < 20:
            solution += f" Margin Anda ({margin}%) cukup tipis — pertimbangkan efisiensi bahan baku atau naikkan harga sedikit."
        elif margin > 50:
            solution += f" Margin Anda ({margin}%) sangat sehat. Pertahankan kualitas untuk menjaga loyalitas pembeli."

    return {
        "ai_insight": insight,
        "ai_solution": solution,
    }
