"""Google Gemini AI analysis service for QC products."""

import httpx
import json
import hashlib
from app.config import get_settings
from app.database import db


async def analyze_qc(
    checklist: list[str],
    catatan_penjual: str,
    nama_produk: str,
    kategori: str,
    harga_produksi: int | None = None,
    harga_jual: int | None = None,
) -> dict:
    """
    Call Gemini AI to analyze QC data.
    Returns dict with 'ai_insight' and 'ai_solution'.
    Uses the custom endpoint https://ai.sumopod.com with model gemini/gemini-2.5-flash-lite.
    """
    settings = get_settings()

    prompt = f"""Kamu adalah asisten Quality Control profesional untuk produk UMKM Indonesia.
Analisis data QC berikut dan berikan output dalam format yang diminta.

=== DATA PRODUK ===
Nama Produk: {nama_produk}
Kategori: {kategori}

=== CHECKLIST QC PENJUAL ===
{chr(10).join(f"✓ {item}" for item in checklist)}

=== CATATAN PENJUAL ===
{catatan_penjual or "Tidak ada catatan khusus."}

=== INSTRUKSI ===
Berdasarkan 2 indikator utama di atas (checklist dan catatan penjual), berikan analisis dalam format berikut:

1. **INSIGHT**: Berikan insight umum tentang kondisi produk ini (2-3 kalimat). 
   Fokus pada: apakah produk layak, apa yang sudah baik, dan apakah ada hal yang perlu diperhatikan pembeli.
   Gunakan bahasa yang ramah dan meyakinkan untuk pembeli.

2. **SOLUSI**: Berikan solusi dan tips perawatan spesifik untuk produk kategori "{kategori}" (2-3 kalimat).
   Fokus pada: cara menyimpan, merawat, dan menjaga kualitas produk ini agar tetap optimal.

Format output (WAJIB ikuti persis):
INSIGHT: [isi insight di sini]
SOLUSI: [isi solusi di sini]
"""

    # Enrich prompt with financial data if available
    if harga_produksi and harga_jual:
        margin = round((harga_jual - harga_produksi) / harga_jual * 100, 1)
        prompt += f"""

=== DATA FINANSIAL (RAHASIA — hanya untuk analisis) ===
Harga Produksi: Rp {harga_produksi:,}
Harga Jual: Rp {harga_jual:,}
Margin: {margin}%

Tambahkan saran bisnis singkat di dalam SOLUSI: apakah margin sehat, tips efisiensi produksi, atau saran pengemasan untuk mengurangi retur.
"""

    # 1. Generate Input Hash
    raw_input = f"{nama_produk}|{kategori}|{catatan_penjual}|{','.join(sorted(checklist))}|{harga_produksi or ''}|{harga_jual or ''}"
    input_hash = hashlib.sha256(raw_input.encode('utf-8')).hexdigest()

    # 2. Check Cache
    try:
        cached = await db.aicache.find_unique(where={"inputHash": input_hash})
        if cached:
            print(f"[AI Service] Cache HIT for {input_hash}")
            return {
                "ai_insight": cached.insight,
                "ai_solution": cached.solution,
            }
    except Exception as e:
        print(f"[AI Service] Cache error: {e}")

    try:
        # Call the custom Gemini endpoint
        base_url = settings.gemini_base_url.rstrip("/")
        url = f"{base_url}/v1/chat/completions"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.gemini_api_key}",
        }

        payload = {
            "model": settings.gemini_model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1024,
            "temperature": 0.7,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        # Parse the response
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        result = _parse_ai_response(content, nama_produk, kategori, catatan_penjual)
        
        # 3. Save to Cache
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
        print(f"[AI Service] Error calling Gemini: {e}")
        # Fallback response if AI fails
        return _fallback_response(nama_produk, kategori, catatan_penjual, checklist, harga_produksi, harga_jual)


def _parse_ai_response(
    content: str,
    nama_produk: str,
    kategori: str,
    catatan_penjual: str,
) -> dict:
    """Parse AI response into insight and solution."""
    ai_insight = ""
    ai_solution = ""

    lines = content.strip().split("\n")
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

    # If parsing failed, use the whole content
    if not ai_insight and not ai_solution:
        parts = content.split("\n\n", 1)
        ai_insight = parts[0].strip() if parts else content.strip()
        ai_solution = parts[1].strip() if len(parts) > 1 else ""

    return {
        "ai_insight": ai_insight or f"Produk {nama_produk} telah melewati Quality Control.",
        "ai_solution": ai_solution or f"Simpan produk di tempat yang sesuai untuk kategori {kategori}.",
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

    # Enrich with business tip if financial data present
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
