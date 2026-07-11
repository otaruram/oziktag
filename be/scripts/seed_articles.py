import asyncio
import os
import sys

# Add parent dir to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import db, connect_db, disconnect_db

# Helper to generate medium style content
def make_content(seed: int, p1: str, p2: str, p3: str = ""):
    img = f'<img src="https://picsum.photos/seed/oziktag{seed}/800/400" alt="Article Cover" style="width:100%; border-radius:12px; margin: 20px 0; object-fit:cover; aspect-ratio:2/1;" />'
    content = f'<p>{p1}</p>{img}<p>{p2}</p>'
    if p3:
        content += f'<p>{p3}</p>'
    return content

ARTICLES = [
    {
        "title": "5 Kesalahan QC yang Sering Dilakukan Pengrajin Pemula",
        "preview": "Dari tidak mengecek sudut anyaman hingga lupa foto detail — hindari kesalahan ini.",
        "content": make_content(1, 
            "Sebagai pengrajin pemula, sering kali kita terburu-buru mengirim barang tanpa melakukan Quality Control (QC) yang memadai. Semangat untuk segera melihat produk sampai di tangan pelanggan sering menutupi ketelitian kita dalam mengecek detail terkecil seperti sudut anyaman atau sisa lem yang menempel.",
            "Salah satu kesalahan paling fatal adalah mengabaikan foto detail sebelum pengiriman. Pembeli sering mengajukan komplain karena barang tidak sesuai gambar. Selalu sediakan foto resolusi tinggi dari berbagai sisi, serta biasakan melakukan tes ketahanan ringan pada sambungan lem atau paku sebelum barang dibungkus.",
            "Terakhir, jangan lupakan aspek pengemasan. Kemasan yang buruk dapat menghancurkan produk yang sudah Anda buat dengan susah payah. Gunakan bubble wrap berlapis untuk barang pecah belah dan pastikan kemasan tahan terhadap guncangan selama perjalanan kurir."
        )
    },
    {
        "title": "Cara Mengurangi Retur Produk Kerajinan Tangan",
        "preview": "Retur bisa ditekan 40% dengan bubble wrap ekstra di bagian sudut dan tepi produk.",
        "content": make_content(2,
            "Tingkat retur yang tinggi tidak hanya membuang waktu, tetapi juga merusak reputasi toko Anda di mata pelanggan. Banyak pengrajin yang belum menyadari bahwa sebagian besar kerusakan terjadi bukan karena kualitas barang yang buruk, melainkan karena benturan di bagian sudut saat proses ekspedisi.",
            "Untuk mengatasinya, selalu gunakan bubble wrap ekstra di bagian sudut dan tepi produk Anda. Secara statistik, metode ini terbukti mampu menekan angka kerusakan hingga 40%. Jangan pelit dalam memberikan lapisan pengaman, karena biaya pengembalian barang jauh lebih mahal daripada beberapa meter bubble wrap tambahan.",
            "Selain itu, sertakan Kartu Petunjuk Perawatan (Care Card) di dalam paket. Banyak pelanggan yang tanpa sadar merusak barang karena salah perawatan, seperti mencuci tas anyaman di mesin cuci. Edukasi pelanggan Anda dengan cara yang elegan."
        )
    },
    {
        "title": "Meningkatkan Skor Kredit UMKM Anda Bersama Oziktag",
        "preview": "Isi data finansial, konsisten generate QR, dan jaga nol komplain untuk skor maksimal.",
        "content": make_content(3,
            "Di era digital saat ini, memiliki jejak rekam yang baik sangatlah krusial. Di platform Oziktag, Skor Kredit Bisnis (Credit Score) Anda menjadi indikator utama untuk menarik perhatian investor atau mendapatkan akses pinjaman modal yang lebih besar. Namun, bagaimana cara tepat untuk meningkatkannya secara organik?",
            "Langkah pertama adalah konsistensi. Semakin banyak produk Anda yang dilabeli dengan Trusted Label (QR) Oziktag, semakin tebal rekam jejak digital Anda. Hal ini membuktikan bahwa bisnis Anda aktif dan memiliki volume produksi yang stabil. Setiap pindaian QR oleh pelanggan juga akan memberikan sinyal positif ke dalam sistem AI kami.",
            "Langkah kedua adalah transparansi finansial dan verifikasi KYC. Isi data margin dan harga produksi Anda dengan jujur, karena sistem kami dapat mendeteksi anomali harga. Akun yang telah lolos proses KYC juga secara otomatis akan mendapatkan suntikan skor kredit sebagai bentuk kepercayaan platform."
        )
    },
    {
        "title": "Standar Kualitas Keramik dan Gerabah Premium",
        "preview": "Cara memastikan keramik bebas retak rambut dan aman untuk makanan (food grade).",
        "content": make_content(4,
            "Keramik yang terlihat mengkilap dan sempurna di bagian luar bisa saja menyimpan cacat tersembunyi yang berbahaya bagi pengguna. Sebagai pembuat keramik, Anda wajib memastikan bahwa produk akhir Anda benar-benar solid dan bebas dari retakan rambut di lapisan dalamnya.",
            "Salah satu metode paling klasik dan akurat adalah Tes Ketukan (Tapping Test). Ketuk perlahan dinding keramik dengan pensil kayu; bunyi 'denting' yang nyaring menandakan keramik tersebut padat sempurna, sedangkan bunyi redup atau serak menandakan adanya rongga atau retak tersembunyi.",
            "Selain itu, untuk produk peralatan makan, pastikan lapisan glasir Anda sepenuhnya aman dan food-grade. Lakukan uji kebocoran dengan mengisi keramik menggunakan air dan mendiamkannya selama 24 jam di atas kertas tisu untuk mendeteksi rembesan mikroskopis."
        )
    },
    {
        "title": "Menghitung HPP (Harga Pokok Penjualan) dengan Cerdas",
        "preview": "Jangan sampai rugi! Ini rumus sederhana menghitung biaya tenaga kerja dan bahan.",
        "content": make_content(5,
            "Banyak pengrajin UMKM yang merasa dagangannya laris manis, namun pada akhir bulan menyadari bahwa keuntungan bersihnya sangat kecil atau bahkan merugi. Kesalahan paling umum adalah mereka hanya menghitung harga bahan baku, namun lupa mengkalkulasi biaya tenaga kerja dan overhead.",
            "Rumus dasar HPP yang benar harus selalu mencakup tiga elemen utama: Biaya Bahan Baku, Biaya Tenaga Kerja Langsung, dan Biaya Overhead seperti listrik, sewa tempat, lem, atau kemasan. Ingatlah prinsip ini: Anda harus selalu membayar diri Anda sendiri. Jangan pernah menghargai waktu dan tenaga Anda dengan nilai nol.",
            "Setelah HPP yang akurat didapatkan, barulah Anda bisa menentukan margin keuntungan yang sehat. Transparansi dalam pencatatan inilah yang nantinya akan diolah oleh SupaLedger Oziktag untuk mencarikan pendanaan terbaik bagi Anda."
        )
    },
    {
        "title": "Teknik Finishing Kayu Anti-Rayap untuk Ekspor",
        "preview": "Lindungi karya kayu Anda dengan teknik finishing yang benar agar awet puluhan tahun.",
        "content": make_content(6,
            "Produk berbahan dasar kayu memiliki daya tarik estetik yang tak lekang oleh waktu, namun sangat rentan terhadap serangan rayap dan jamur, terutama jika dikirim ke negara dengan tingkat kelembapan tinggi. Persiapan kayu mentah adalah langkah pertama yang tidak boleh dilewati.",
            "Sebelum memulai proses pernis atau pengecatan, pastikan kayu telah dikeringkan secara maksimal hingga kadar air (Moisture Content) berada di bawah 12%. Setelah itu, aplikasikan wood preserver berbahan dasar air secara merata agar meresap ke dalam pori-pori kayu sebagai benteng pertahanan utama melawan hama.",
            "Pada tahap akhir, selalu terapkan teknik pelapisan tipis secara berulang. Mengaplikasikan tiga lapis cat tipis yang dibiarkan mengering sempurna di setiap lapisannya jauh lebih kuat dan awet dibandingkan satu lapisan cat yang sangat tebal."
        )
    },
    {
        "title": "Tips Fotografi Produk dengan Smartphone yang Estetik",
        "preview": "Hanya pakai HP? Anda tetap bisa mendapatkan foto sekelas studio dengan pencahayaan alami.",
        "content": make_content(7,
            "Tahukah Anda bahwa kualitas foto yang baik dapat meningkatkan nilai jual produk Anda hingga tiga kali lipat? Anda tidak selalu membutuhkan kamera DSLR yang mahal atau perlengkapan studio yang memakan banyak biaya. Dengan sebuah smartphone modern, Anda sudah memiliki alat yang cukup mumpuni.",
            "Kunci utama dari fotografi smartphone adalah pencahayaan. Manfaatkan 'Window Light' atau cahaya jendela alami pada pukul 8 hingga 10 pagi untuk mendapatkan pencahayaan yang lembut namun merata. Matikan lampu ruangan (neon) agar warnanya tidak bentrok dengan cahaya matahari alami.",
            "Sebagai tambahan, gunakan alat sederhana seperti kertas HVS putih sebagai reflektor untuk memantulkan cahaya ke area produk yang gelap. Ketuk layar HP Anda pada objek untuk mengunci fokus, lalu turunkan sedikit tingkat eksposur agar detail dan warna produk semakin pekat."
        )
    },
    {
        "title": "Panduan Ekspor Kerajinan ke Pasar Eropa",
        "preview": "Sertifikasi dan standar kualitas yang wajib Anda penuhi jika ingin menembus pasar global.",
        "content": make_content(8,
            "Menembus pasar Eropa adalah impian banyak pengrajin karena daya beli mereka yang tinggi dan apresiasi mereka terhadap produk buatan tangan. Namun, benua ini juga dikenal memiliki regulasi impor dan standar kualitas yang sangat ketat, terutama untuk barang yang bersentuhan dengan tubuh manusia atau makanan.",
            "Sertifikasi seperti CE Marking adalah sebuah kewajiban mutlak jika produk Anda adalah mainan anak (seperti boneka rajut atau mainan edukasi kayu). Sementara untuk produk dekorasi berbahan kayu, sertifikat FSC sangat diminati karena membuktikan bahwa bahan baku Anda berasal dari hutan yang dikelola secara lestari.",
            "Pastikan juga seluruh proses pewarnaan produk Anda bebas dari bahan kimia berbahaya. Negara-negara Eropa memiliki larangan ketat terhadap penggunaan pewarna Azo dan pelapis yang mengandung logam berat. Riset yang matang adalah investasi terbaik sebelum Anda mengekspor produk."
        )
    },
    {
        "title": "Seni Upcycling: Mengubah Limbah Menjadi Emas",
        "preview": "Tren eco-friendly sedang naik daun. Ubah sampah menjadi karya bernilai tinggi.",
        "content": make_content(9,
            "Dalam dunia kerajinan, Upcycling kini telah bergeser dari sekadar hobi menjadi sebuah tren bisnis global (eco-friendly) yang sangat menguntungkan. Berbeda dengan Recycling yang menghancurkan material ke bentuk dasar, Upcycling justru mengangkat derajat barang bekas tanpa menghilangkan karakter aslinya.",
            "Contoh penerapan yang sukses adalah mengubah celana jeans bekas menjadi tas jinjing premium, atau menyulap sisa palet kayu menjadi furnitur bergaya industrial. Produk semacam ini memiliki nilai eksklusivitas yang tinggi karena tidak ada dua barang yang 100% sama persis.",
            "Namun, kunci keberhasilan bisnis upcycling terletak pada kebersihan material. Sebelum diolah menjadi karya baru yang indah, material limbah wajib melalui proses pencucian dan sterilisasi yang menyeluruh agar konsumen merasa aman saat menggunakannya."
        )
    },
    {
        "title": "Metode HEART untuk Menangani Komplain Pelanggan",
        "preview": "Pelanggan marah? Jangan panik, ini skrip balasan yang membuat mereka kembali membeli.",
        "content": make_content(10,
            "Komplain dari pelanggan yang kecewa memang menakutkan, tetapi jika ditangani dengan profesional, ini adalah momen terbaik untuk mengubah mereka menjadi pelanggan loyal seumur hidup. Kesalahan terbesar UMKM adalah langsung bersikap defensif atau menyalahkan pihak ekspedisi.",
            "Gunakan metode HEART: Hear (dengarkan tanpa memotong), Empathize (tunjukkan simpati terhadap rasa frustrasi mereka), Apologize (minta maaf terlepas dari siapa yang salah), Resolve (tawarkan solusi konkret seperti pengembalian dana atau penggantian barang), dan Thank (berterima kasih atas masukannya).",
            "Pelanggan seringkali hanya ingin didengar dan divalidasi kekecewaannya. Dengan bahasa yang tenang dan solusi yang memihak mereka, reputasi toko Anda akan semakin harum melalui pemasaran dari mulut ke mulut."
        )
    },
    {
        "title": "Memilih Kurir Ekspedisi yang Tepat untuk Barang Fragile",
        "preview": "Tidak semua ekspedisi ramah terhadap barang pecah belah. Ini tips memilihnya.",
        "content": make_content(11,
            "Menjual produk kerajinan yang rapuh seperti kaca hias, keramik, atau patung pahatan tanah liat memiliki risiko tinggi saat pengiriman. Banyak pengrajin yang kapok berjualan online hanya karena barang mereka hancur berkeping-keping saat tiba di tangan pembeli.",
            "Kunci utama untuk menghindari mimpi buruk ini adalah dengan selektif memilih mitra ekspedisi. Untuk barang berdimensi besar dan berat, lebih baik menggunakan layanan kargo alih-alih kurir reguler. Penanganan di sistem kargo umumnya lebih manual sehingga barang Anda tidak dilempar ke sabuk berjalan.",
            "Selalu tawarkan dan wajibkan opsi packing kayu serta asuransi pengiriman untuk produk yang nilainya di atas batas wajar. Dan jangan pernah lupa untuk menempelkan stiker peringatan berwarna terang di semua sisi kardus untuk memberi tahu kurir bahwa isi paket tersebut butuh penanganan ekstra."
        )
    },
    {
        "title": "Kekuatan Brand Story di Balik Karya Tangan Anda",
        "preview": "Orang tidak hanya membeli produk Anda, mereka membeli cerita di baliknya.",
        "content": make_content(12,
            "Jika kita hanya bersaing dalam hal harga murah, kerajinan tangan lokal tidak akan pernah bisa mengalahkan produksi massal pabrikan asing. Keunggulan absolut yang dimiliki oleh pengrajin UMKM adalah nilai personalitas dan sentuhan manusia di setiap produknya.",
            "Konsumen modern rela membayar lebih mahal untuk sebuah barang yang memiliki jiwa. Ceritakanlah perjalanan Anda: siapa sosok di balik karya tersebut, dari mana inspirasi motifnya berasal, dan berapa jam keringat yang dibutuhkan untuk merajut satu buah tas tersebut hingga tuntas.",
            "Gunakan fitur Oziktag QR pada produk Anda untuk menyematkan cerita ini. Biarkan pelanggan memindai labelnya dan tenggelam dalam romansa proses kreatif yang membuat produk Anda tidak sekadar barang mati, melainkan sebuah karya seni bernilai tinggi."
        )
    },
    {
        "title": "Cara Mencegah Serangan Jamur pada Bahan Baku Rotan",
        "preview": "Rotan sangat rentan terhadap cuaca. Begini cara menyimpannya di gudang.",
        "content": make_content(13,
            "Bagi para pengrajin furnitur dan dekorasi, rotan adalah primadona karena sifatnya yang lentur namun kuat. Sayangnya, rotan alami sangat peka terhadap perubahan suhu dan kelembapan, membuatnya mudah diserang oleh jamur perusak yang meninggalkan noda hitam membandel.",
            "Kesalahan umum dalam penyimpanan rotan adalah meletakkannya langsung bersentuhan dengan lantai semen yang dingin dan lembap. Solusinya, gunakan palet kayu plastik sebagai alas untuk memastikan udara bisa mengalir di bagian bawah tumpukan bahan baku Anda.",
            "Selain itu, sirkulasi udara di dalam gudang harus terus mengalir bebas. Jika gudang Anda berada di area tropis yang tertutup, investasikan dana untuk memasang exhaust fan yang mumpuni, atau letakkan beberapa wadah penyerap kelembapan di sudut-sudut ruangan."
        )
    },
    {
        "title": "Pentingnya Mendaftarkan Merek Dagang (HAKI) Sejak Dini",
        "preview": "Lindungi brand Anda sebelum dicuri orang lain. Prosesnya ternyata mudah dan terjangkau.",
        "content": make_content(14,
            "Banyak UMKM yang berpikir bahwa mendaftarkan merek dagang (HAKI) hanya diperuntukkan bagi perusahaan multinasional berskala raksasa. Anggapan ini sangat berbahaya, mengingat banyaknya kasus pembajakan merek dari bisnis lokal yang sedang naik daun.",
            "Proses pendaftaran merek ke Direktorat Jenderal Kekayaan Intelektual (DJKI) di era digital ini sebenarnya sangat transparan dan bisa dilakukan secara online. Jika Anda mengantongi surat keterangan binaan UMKM dari dinas terkait, biaya administrasinya bahkan mendapat potongan yang signifikan.",
            "Jangan tunggu sampai toko Anda memiliki ratusan ribu pengikut untuk mulai mengurusnya. Lindungi nama usaha Anda sedini mungkin agar Anda bisa fokus berkarya tanpa bayang-bayang tuntutan hukum dari kompetitor yang curang."
        )
    },
    {
        "title": "Rahasia Kekuatan Saddle Stitch pada Kerajinan Kulit",
        "preview": "Jahitan tangan lebih kuat dari jahit mesin. Pelajari teknik Saddle Stitch.",
        "content": make_content(15,
            "Dalam ekosistem kerajinan kulit asli bermutu tinggi, teknik jahitan tangan yang dikenal dengan nama Saddle Stitch adalah standar emas yang tak tertandingi oleh mesin canggih manapun. Teknik ini diwariskan dari pembuat pelana kuda tradisional sejak berabad-abad lalu.",
            "Rahasia kekuatan Saddle Stitch terletak pada persilangan dua utas benang yang saling mengunci secara independen di setiap lubang. Artinya, jika suatu saat salah satu sisi benang terputus karena gesekan, sisi benang lainnya akan tetap menahan struktur kulit sehingga jahitan tidak akan terurai panjang seperti efek domino.",
            "Untuk menguasai teknik ini, Anda membutuhkan dedikasi, sepasang jarum tumpul berkualitas, serta benang berlilin (waxed thread) yang tahan terhadap kelembapan. Sentuhan manual inilah yang membuat dompet atau tas kulit Anda memiliki aura kemewahan klasik."
        )
    },
    {
        "title": "Eksplorasi Pewarnaan Alam pada Kain Tenun Tradisional",
        "preview": "Meningkatkan nilai jual kain tenun dengan kembali ke pewarna alami seperti Indigo dan Secang.",
        "content": make_content(16,
            "Kesadaran global terhadap isu lingkungan telah memicu kebangkitan kembali tren pakaian berkonsep 'slow fashion' yang mengandalkan material organik. Bagi pengrajin kain tenun atau batik, peralihan dari pewarna sintetis kembali ke pewarna alam adalah peluang emas untuk menembus pasar premium.",
            "Bahan-bahan dari alam menyediakan spektrum warna yang menenangkan. Ekstrak daun nila (Indigofera) mampu menghasilkan gradasi biru pekat yang memesona, sementara rebusan kayu secang dapat memancarkan warna merah merona. Semuanya didapatkan dari alam tanpa meninggalkan limbah beracun bagi tanah kita.",
            "Meskipun pewarna alam cenderung memudar seiring berjalannya waktu, namun lunturnya warna ini justru menambah karakter vintage pada kain. Edukasi konsumen Anda bahwa karakteristik tersebut adalah ciri khas keaslian dari proses pewarnaan tradisional yang eksotis."
        )
    },
    {
        "title": "Strategi Cerdas Menghabiskan Dead Stock di Gudang",
        "preview": "Barang numpuk di gudang? Gunakan teknik bundling cerdas tanpa merusak harga pasar.",
        "content": make_content(17,
            "Setiap pelaku usaha pasti pernah mengalami fase di mana beberapa varian produknya gagal diserap pasar dan akhirnya menumpuk berdebu di sudut gudang (Dead Stock). Reaksi spontan yang sering dilakukan adalah mengadakan diskon besar-besaran, yang tanpa disadari justru merusak nilai brand Anda di mata konsumen.",
            "Daripada banting harga, terapkan strategi 'Bundling' silang. Pasangkan satu buah produk andalan Anda (Best Seller) dengan satu buah produk yang lambat terjual, lalu tawarkan paket tersebut dengan harga yang sedikit lebih miring dibandingkan jika dibeli terpisah.",
            "Strategi psikologis ini membuat konsumen merasa seperti sedang mendapatkan penawaran eksklusif yang sangat menguntungkan. Di saat yang sama, Anda berhasil mengkonversi barang mati di gudang menjadi arus kas segar untuk operasional."
        )
    },
    {
        "title": "Edukasi Konsumen Mengenai Toleransi Ukuran Produk Handmade",
        "preview": "Barang handmade tidak akan pernah 100% identik. Berikan disclaimer kepada pembeli.",
        "content": make_content(18,
            "Berapa kali Anda menerima ulasan bintang satu hanya karena keranjang rotan Anda meleset satu sentimeter dari deskripsi di e-commerce? Konsumen yang terbiasa dengan produk cetakan pabrik sering menuntut tingkat presisi mikroskopis yang mustahil dicapai oleh tangan manusia.",
            "Sebagai pengrajin, Anda harus bersikap proaktif dalam memberikan edukasi. Tidak ada produk buatan tangan yang benar-benar identik, dan ketidaksempurnaan itulah yang membuat setiap potongan karya menjadi unik. Ini adalah nilai tambah, bukan kekurangan.",
            "Biasakan diri untuk menuliskan kalimat disclaimer yang jelas dan sopan di setiap kotak deskripsi produk Anda. Jelaskan bahwa karena proses pengerjaan dilakukan 100% secara manual, akan ada toleransi ukuran dan sedikit gradasi warna alami yang tidak bisa dihindari."
        )
    },
    {
        "title": "Urgensi Sertifikasi Food-Grade untuk Kerajinan Kayu",
        "preview": "Produksi piring kayu atau sendok bambu? Sertifikasi food-grade meningkatkan kepercayaan pembeli.",
        "content": make_content(19,
            "Tren gaya hidup ramah lingkungan telah melambungkan permintaan akan peralatan makan berbahan dasar kayu dan bambu (wooden cutlery). Namun, ada satu aspek vital yang sering luput dari perhatian pembuatnya: keamanan lapisan penyelesaian (finishing).",
            "Piring atau sendok yang akan bersentuhan langsung dengan makanan panas tidak boleh dilapisi oleh pernis atau bahan kimia beracun yang dapat luntur dan tertelan. Gunakan hanya lapisan pelindung alami seperti Beeswax (lilin lebah) organik atau Mineral Oil yang telah diakui keamanannya oleh badan pangan.",
            "Jika produk Anda telah memenuhi standar ini, jangan ragu untuk mengajukan sertifikasi dan menempelkannya dengan bangga sebagai alat pemasaran. Logo Food-Grade adalah jaminan ketenangan batin bagi setiap ibu rumah tangga yang membeli karya Anda."
        )
    },
    {
        "title": "Strategi Barter dengan Micro-Influencer Lokal",
        "preview": "Tidak punya budget marketing? Teknik barter produk dengan Micro-Influencer bisa jadi jalan ninja Anda.",
        "content": make_content(20,
            "Anggaran pemasaran yang terbatas seringkali menjadi dinding tebal yang menghalangi laju pertumbuhan UMKM. Mengontrak influencer papan atas dengan jutaan pengikut jelas bukan pilihan yang realistis bagi kantong Anda. Lalu apa solusinya? Beralihlah ke Micro-Influencer.",
            "Micro-Influencer adalah mereka yang memiliki pengikut di kisaran 10.000 hingga 50.000, namun memiliki tingkat interaksi (engagement rate) yang sangat militan dan terfokus pada topik spesifik, misalnya dekorasi rumah estetik. Anda bisa menawarkan sistem kolaborasi barter.",
            "Anda mengirimkan produk terbaik Anda secara gratis, dan sebagai gantinya mereka akan memberikan ulasan yang jujur kepada komunitas mereka. Pendekatan organik semacam ini sering kali memberikan rasio konversi penjualan yang jauh melampaui iklan berbayar."
        )
    }
]

async def seed_articles():
    await connect_db()
    
    try:
        await db.elitearticle.delete_many()
        
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
            
        print(f"Successfully inserted {count} Medium-style QC articles into the Elite Hub database.")
        
    except Exception as e:
        print(f"Error seeding articles: {e}")
    finally:
        await disconnect_db()

if __name__ == "__main__":
    asyncio.run(seed_articles())
