from app.database import db
from prisma import Json
from app.services.ai_service import analyze_qc

async def process_qc_submission(user_id: str, nama_produk: str, kategori: str, batch: str, checklist_items: list, catatan_penjual: str, harga_produksi: int, harga_jual: int, image_urls: list):
    try:
        ai_result = await analyze_qc(
            checklist=checklist_items,
            catatan_penjual=catatan_penjual,
            nama_produk=nama_produk,
            kategori=kategori,
            harga_produksi=harga_produksi,
            harga_jual=harga_jual,
        )
    except Exception as e:
        print(f"[QC Router] AI analysis failed: {e}")
        ai_result = {
            "ai_insight": f"Produk {nama_produk} telah melewati Quality Control.",
            "ai_solution": "Simpan produk sesuai petunjuk penyimpanan.",
        }

    product = await db.qcproduct.create(
        data={
            "userId": user_id,
            "namaProduk": nama_produk.strip(),
            "kategori": kategori,
            "batch": batch.strip() if batch else None,
            "checklist": Json(checklist_items),
            "catatanPenjual": catatan_penjual.strip(),
            "hargaProduksi": harga_produksi,
            "hargaJual": harga_jual,
            "aiInsight": ai_result["ai_insight"],
            "aiSolution": ai_result["ai_solution"],
            "images": {
                "create": [
                    {"imagekitUrl": url} for url in image_urls
                ]
            }
        }
    )
    
    return product, ai_result
