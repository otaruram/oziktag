import asyncio
import os
import sys

# Add parent dir to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import db, connect_db, disconnect_db

ARTICLES = [
    {
        "title": "5 Kesalahan QC yang Sering Dilakukan Pengrajin Pemula",
        "preview": "Dari tidak mengecek sudut anyaman hingga lupa foto detail — hindari kesalahan ini.",
        "content": "<p>Sebagai pengrajin pemula, sering kali kita terburu-buru mengirim barang tanpa melakukan <strong>Quality Control (QC)</strong> yang memadai. Berikut 5 kesalahan yang sering terjadi:</p><ul><li><strong>Tidak Mengecek Sudut Anyaman:</strong> Sudut adalah bagian paling rawan terlepas. Pastikan ikatan kuat.</li><li><strong>Mengabaikan Foto Detail:</strong> Pembeli sering komplain karena barang tidak sesuai gambar. Selalu sediakan foto resolusi tinggi dari berbagai sisi.</li><li><strong>Lupa Mengecek Bau:</strong> Beberapa lem atau bahan pelapis (varnish) meninggalkan bau menyengat. Jemur terlebih dahulu sebelum di-packing.</li><li><strong>Tidak Menguji Ketahanan:</strong> Tarik sedikit bagian sambungan untuk memastikan lem atau paku menempel sempurna.</li><li><strong>Asal Packing:</strong> Kemasan yang buruk merusak barang yang sudah bagus. Gunakan bubble wrap berlapis untuk barang pecah belah.</li></ul>"
    },
    {
        "title": "Cara Mengurangi Retur Produk Kerajinan Tangan",
        "preview": "Retur bisa ditekan 40% dengan bubble wrap ekstra di bagian sudut dan tepi produk.",
        "content": "<p>Tingkat retur yang tinggi tidak hanya membuang waktu, tetapi juga merusak reputasi toko Anda. Berikut cara menekannya:</p><ul><li><strong>Gunakan Bubble Wrap Ekstra di Sudut:</strong> 80% kerusakan akibat benturan terjadi di bagian sudut produk.</li><li><strong>Kartu Petunjuk Perawatan (Care Card):</strong> Banyak pelanggan merusak barang karena salah perawatan (misal: mencuci tas anyaman dengan mesin cuci). Sertakan panduan perawatan.</li><li><strong>Transparansi Kekurangan:</strong> Jika produk Anda <em>handmade</em> dan memiliki warna yang tidak 100% rata, tuliskan di deskripsi agar ekspektasi pelanggan terjaga.</li></ul>"
    },
    {
        "title": "Meningkatkan Skor Kredit UMKM Anda",
        "preview": "Isi data finansial, konsisten generate QR, dan jaga nol komplain untuk skor maksimal.",
        "content": "<p>Di platform Oziktag, Skor Kredit Bisnis (Credit Score) Anda sangat penting untuk menarik investor atau mendapatkan pinjaman modal. <strong>Bagaimana cara meningkatkannya?</strong></p><ul><li><strong>Konsisten Menggunakan Trusted Label (QR):</strong> Semakin banyak barang Anda yang dilabeli, semakin tinggi rekam jejak digital Anda.</li><li><strong>Isi Data Finansial dengan Jujur:</strong> Sistem AI kami dapat mendeteksi margin profit yang tidak wajar. Kejujuran adalah kunci.</li><li><strong>Verifikasi KYC:</strong> Akun yang telah melewati KYC otomatis mendapatkan boost skor kredit.</li></ul>"
    },
    {
        "title": "Standar Kualitas Keramik dan Gerabah",
        "preview": "Cara memastikan keramik bebas retak rambut dan aman untuk makanan (food grade).",
        "content": "<p>Keramik yang terlihat sempurna bisa saja memiliki cacat tersembunyi. Lakukan ini saat QC:</p><ul><li><strong>Tes Ketukan (Tapping Test):</strong> Ketuk perlahan dengan pensil kayu. Bunyi 'denting' yang nyaring menandakan keramik padat, sedangkan bunyi 'breat' atau redup menandakan adanya retak rambut di dalam.</li><li><strong>Uji Kebocoran:</strong> Isi dengan air dan diamkan 24 jam di atas kertas tisu.</li><li><strong>Glaze Flaw:</strong> Pastikan lapisan glasir merata tanpa ada gelembung tajam yang bisa melukai pengguna.</li></ul>"
    },
    {
        "title": "Menghitung HPP (Harga Pokok Penjualan) Kerajinan Tangan",
        "preview": "Jangan sampai rugi! Ini rumus sederhana menghitung biaya tenaga kerja dan bahan.",
        "content": "<p>Banyak pengrajin hanya menghitung harga bahan baku, namun lupa menghitung biaya tenaga kerja dan *overhead*. <strong>Rumus HPP Sederhana:</strong><br><br><code>HPP = Biaya Bahan Baku + Biaya Tenaga Kerja Langsung + Biaya Overhead (Listrik, sewa, lem, paku, dll)</code><br><br>Ingat, bayar diri Anda sendiri! Jangan pernah memberikan nilai Rp 0 pada tenaga Anda.</p>"
    },
    {
        "title": "Teknik Finishing Kayu Anti-Rayap",
        "preview": "Lindungi karya kayu Anda dengan teknik finishing yang benar agar awet puluhan tahun.",
        "content": "<p>Produk kayu sangat rentan terhadap rayap dan jamur, terutama jika diekspor ke negara lembap. <strong>Langkah Wajib:</strong></p><ol><li>Keringkan kayu hingga kadar air (MC) di bawah 12%.</li><li>Gunakan <em>wood preserver</em> berbasis air (water-based) sebelum pernis.</li><li>Lakukan pengecatan minimal 3 lapis tipis, bukan 1 lapis tebal.</li></ol>"
    },
    {
        "title": "Tips Fotografi Produk dengan HP untuk UMKM",
        "preview": "Hanya pakai HP? Anda tetap bisa mendapatkan foto sekelas studio dengan pencahayaan alami.",
        "content": "<p>Foto yang bagus meningkatkan nilai jual hingga 300%. Anda tidak butuh kamera mahal, cukup gunakan HP Anda:</p><ul><li><strong>Gunakan Cahaya Jendela (Window Light):</strong> Foto produk Anda di samping jendela pada pukul 08:00 - 10:00 pagi. Matikan lampu ruangan agar cahaya tidak bentrok.</li><li><strong>Gunakan Kertas HVS sebagai Reflektor:</strong> Pantulkan cahaya dari sisi gelap produk menggunakan kertas HVS putih.</li><li><strong>Fokus dan Exposure:</strong> Ketuk layar HP pada bagian produk, lalu turunkan sedikit <em>exposure</em> agar warna lebih pekat.</li></ul>"
    },
    {
        "title": "Panduan Ekspor Kerajinan ke Pasar Eropa",
        "preview": "Sertifikasi dan standar kualitas yang wajib Anda penuhi jika ingin menembus pasar global.",
        "content": "<p>Eropa memiliki standar yang ketat untuk barang kerajinan, terutama yang bersentuhan dengan makanan atau mainan anak. Beberapa sertifikasi yang sering diminta:</p><ul><li><strong>CE Marking:</strong> Wajib untuk produk mainan anak (seperti boneka rajut atau mainan kayu).</li><li><strong>FSC Certification:</strong> Untuk produk kayu, membuktikan kayu berasal dari hutan yang dikelola secara lestari.</li><li><strong>Bebas Bahan Kimia Berbahaya:</strong> Pastikan pewarna (dye) Anda bebas dari Azo dan logam berat.</li></ul>"
    },
    {
        "title": "Memanfaatkan Limbah untuk Kerajinan (Upcycling)",
        "preview": "Tren eco-friendly sedang naik daun. Ubah sampah menjadi karya bernilai tinggi.",
        "content": "<p><em>Upcycling</em> berbeda dengan <em>Recycling</em>. Upcycling berarti memberikan nilai tambah pada barang bekas tanpa menghancurkannya terlebih dahulu. Contoh: Mengubah celana jeans bekas menjadi tas <em>tote bag</em> premium.</p><p>Kunci sukses upcycling adalah <strong>kebersihan dan higienitas</strong>. Pastikan material limbah dicuci dan disterilisasi sebelum diolah menjadi kerajinan baru.</p>"
    },
    {
        "title": "Cara Menangani Komplain Pelanggan dengan Elegan",
        "preview": "Pelanggan marah? Jangan panik, ini skrip balasan yang membuat mereka kembali membeli.",
        "content": "<p>Komplain adalah kesempatan untuk menunjukkan pelayanan prima Anda. Gunakan metode <strong>HEART</strong>:</p><ul><li><strong>H</strong>ear: Dengarkan tanpa memotong.</li><li><strong>E</strong>mpathize: Tunjukkan simpati (\"Saya mengerti kekecewaan Kakak\").</li><li><strong>A</strong>pologize: Meminta maaf meski bukan 100% salah Anda (misal karena kurir).</li><li><strong>R</strong>esolve: Berikan solusi konkret (Ganti barang / Refund sebagian).</li><li><strong>T</strong>hank: Berterima kasih atas masukannya.</li></ul>"
    },
    {
        "title": "Memilih Kurir yang Tepat untuk Barang Fragile",
        "preview": "Tidak semua ekspedisi ramah terhadap barang pecah belah. Ini tips memilihnya.",
        "content": "<p>Untuk produk seperti kaca rias kayu, keramik, atau patung, pemilihan kurir sangat krusial. <strong>Tips:</strong></p><ul><li>Gunakan layanan kargo untuk barang besar (lebih murah, penanganan lebih baik karena tidak dilempar-lempar di ban berjalan).</li><li>Wajibkan asuransi dan packing kayu untuk barang di atas Rp 500.000.</li><li>Tempelkan stiker <em>Fragile</em> berwarna merah terang di setiap sisi kardus.</li></ul>"
    },
    {
        "title": "Pentingnya Brand Story untuk Kerajinan Tangan",
        "preview": "Orang tidak hanya membeli produk Anda, mereka membeli cerita di baliknya.",
        "content": "<p>Kerajinan tangan kalah murah dibanding barang pabrik. Lalu apa keunggulannya? <strong>Cerita (Story)</strong>.</p><p>Ceritakan siapa pembuatnya, dari mana inspirasinya, dan berapa lama proses pembuatannya. Tempelkan Oziktag QR pada produk Anda, lalu isikan deskripsi yang menceritakan perjalanan produk tersebut dari bahan mentah hingga menjadi karya seni.</p>"
    },
    {
        "title": "Tips Menyimpan Bahan Baku Rotan agar Tidak Berjamur",
        "preview": "Rotan sangat rentan terhadap cuaca. Begini cara menyimpannya di gudang.",
        "content": "<p>Rotan yang berjamur akan sulit dibersihkan dan meninggalkan noda hitam (blue stain). <strong>Cara penyimpanan:</strong></p><ul><li>Letakkan di atas palet, jangan menyentuh lantai semen secara langsung.</li><li>Pastikan sirkulasi udara di gudang lancar (pasang exhaust fan).</li><li>Gunakan <em>silica gel</em> raksasa atau *dehumidifier* jika gudang Anda berada di daerah lembap.</li></ul>"
    },
    {
        "title": "Cara Mendaftarkan Merek Dagang (HAKI) untuk UMKM",
        "preview": "Lindungi brand Anda sebelum dicuri orang lain. Prosesnya ternyata mudah dan terjangkau.",
        "content": "<p>Banyak UMKM kerajinan yang sukses, tiba-tiba mereknya didaftarkan oleh kompetitor nakal. Segera daftarkan merek Anda ke DJKI (Direktorat Jenderal Kekayaan Intelektual).</p><p>Untuk UMKM binaan dinas, biayanya jauh lebih murah (sekitar Rp 500.000). Persyaratannya: Surat Keterangan UKM, Logo, Tanda Tangan, dan KTP.</p>"
    },
    {
        "title": "Teknik Jahit Tangan (Hand-Stitching) pada Kerajinan Kulit",
        "preview": "Jahitan tangan lebih kuat dari jahit mesin. Pelajari teknik Saddle Stitch.",
        "content": "<p>Dalam kerajinan kulit asli (Genuine Leather), teknik <em>Saddle Stitch</em> adalah standar industri tertinggi. Mengapa?</p><p>Karena jika satu benang putus, jahitan sebelahnya tidak akan ikut terurai (berbeda dengan jahitan mesin/lock stitch). Gunakan benang lilin (waxed thread) dan jarum tumpul untuk hasil maksimal.</p>"
    },
    {
        "title": "Pewarnaan Alam (Natural Dye) pada Kain Tenun",
        "preview": "Meningkatkan nilai jual kain tenun dengan kembali ke pewarna alami seperti Indigo dan Secang.",
        "content": "<p>Pasar internasional sangat menyukai kain dengan pewarna alami karena ramah lingkungan. Beberapa bahan populer:</p><ul><li><strong>Daun Nila (Indigofera):</strong> Menghasilkan warna biru gelap.</li><li><strong>Kayu Secang:</strong> Menghasilkan warna merah.</li><li><strong>Kulit Manggis:</strong> Menghasilkan warna ungu kecokelatan.</li></ul><p>Warna alam cenderung lebih pudar, edukasi pelanggan Anda bahwa ini adalah seni, bukan cacat produksi.</p>"
    },
    {
        "title": "Strategi Bundling untuk Menghabiskan Stok Lama (Dead Stock)",
        "preview": "Barang numpuk di gudang? Gunakan teknik bundling cerdas tanpa merusak harga pasar.",
        "content": "<p>Jangan terburu-buru melakukan diskon besar-besaran (cuci gudang), karena akan merusak citra eksklusif *brand* Anda. Gunakan strategi <strong>Bundling</strong>.</p><p>Gabungkan 1 produk <em>Best Seller</em> dengan 1 produk <em>Dead Stock</em>. Jual dengan harga sedikit lebih murah dari total harga normal. Pelanggan merasa untung, stok Anda bersih!</p>"
    },
    {
        "title": "Memahami Pentingnya Toleransi Ukuran dalam Kerajinan",
        "preview": "Barang handmade tidak akan pernah 100% identik. Berikan disclaimer kepada pembeli.",
        "content": "<p>Sering mendapat komplain karena ukuran keranjang rotan meleset 1-2 cm dari deskripsi? Ini adalah hal wajar dalam produk buatan tangan.</p><p><strong>Solusi:</strong> Selalu tuliskan *disclaimer* di bio atau deskripsi toko: <em>\"Karena produk ini 100% buatan tangan, harap maklum jika terdapat perbedaan ukuran 1-2 cm dan perbedaan gradasi warna.\"</em></p>"
    },
    {
        "title": "Cara Mengurus Sertifikasi Halal untuk Kerajinan yang Terkait Makanan",
        "preview": "Produksi piring kayu atau sendok bambu? Sertifikasi halal/food-grade meningkatkan kepercayaan pembeli.",
        "content": "<p>Peralatan makan (cutlery) dari bahan alami perlu dipastikan tidak menggunakan pelapis (coating) yang mengandung najis atau bahan kimia beracun.</p><p>Gunakan <strong>Beeswax (Lilin Lebah)</strong> atau <strong>Food Grade Mineral Oil</strong> sebagai finishing piring/sendok kayu Anda.</p>"
    },
    {
        "title": "Kolaborasi dengan Influencer Lokal: Barter atau Bayar?",
        "preview": "Tidak punya budget marketing? Teknik barter produk dengan Micro-Influencer bisa jadi jalan ninja Anda.",
        "content": "<p>Untuk UMKM, jangan mengincar selebgram dengan jutaan followers. Incar <strong>Micro-Influencer</strong> (10k - 50k followers) yang *niche*-nya sesuai (contoh: akun dekorasi rumah).</p><p>Tawarkan barter: Anda kirimkan produk gratis (misal cermin macrame), mereka me-review jujur di Story/Feed mereka. Tingkat *engagement* mereka jauh lebih tinggi dan tertarget!</p>"
    }
]

async def seed_articles():
    await connect_db()
    
    try:
        count = 0
        for article in ARTICLES:
            await db.elitearticle.create(
                data={
                    "title": article["title"],
                    "preview": article["preview"],
                    "content": article["content"]
                }
            )
            count += 1
            
        print(f"Successfully inserted {count} QC articles into the Elite Hub database.")
        
    except Exception as e:
        print(f"Error seeding articles: {e}")
    finally:
        await disconnect_db()

if __name__ == "__main__":
    asyncio.run(seed_articles())
