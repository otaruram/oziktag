import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Loader2, Copy, Award, Flame } from "lucide-react";
import { toast } from "sonner";
import { type Qrtag } from "@/lib/oziktag-store";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/scan/$id")({
  head: () => ({
    meta: [
      { title: "Sertifikat Keaslian Produk — Oziktag Trust Seal" },
      { name: "description", content: "Verifikasi keaslian dan Quality Control karya budaya & produk UMKM via Oziktag." },
    ],
  }),
  component: Scan,
});

function Scan() {
  const { id } = Route.useParams();
  const [tag, setTag] = useState<Qrtag | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiFetch(`/scan/${id}`)
      .then((data: any) => {
        const mappedTag: Qrtag = {
          id: data.id,
          productName: data.nama_produk,
          category: data.kategori,
          batch: data.batch,
          qc: data.checklist || [],
          brand: data.brand,
          createdAt: data.created_at,
          notes: data.catatan_penjual,
          photos: data.images,
          aiInsight: data.ai_insight,
          aiSolution: data.ai_solution,
          isElite: data.is_elite,
        };
        setTag(mappedTag);
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load tag", err);
        setErrorMsg(err.message);
        setTag(null);
        setLoaded(true);
      });
  }, [id]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] text-[#f4ecdd]">
        <div className="flex items-center gap-2 font-mono text-xs text-[#bdbdbd]">
          <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
          Memverifikasi sertifikat QR...
        </div>
      </div>
    );
  }

  if (errorMsg) {
    const isDeactivated = errorMsg.includes("dinonaktifkan sementara");
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] px-4 text-[#f4ecdd]">
        <div className="max-w-sm rounded-2xl border border-[#383838] bg-[#1c1c1c] p-8 text-center shadow-[var(--shadow-werkstatt-lg)]">
          <AlertCircle className={`mx-auto h-12 w-12 ${isDeactivated ? "text-[#fac603]" : "text-red-500"}`} />
          <h1 className="mt-4 text-xl font-bold">{isDeactivated ? "QR Dinonaktifkan" : "QR Tidak Ditemukan"}</h1>
          <p className="mt-2 text-sm text-[#bdbdbd]">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!tag) return null;

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-10 text-[#f4ecdd] font-sans relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none werkstatt-grid opacity-60" />

      <div className="relative z-10 mx-auto max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xs font-mono text-[#bdbdbd] hover:text-[#f4ecdd]">
          <ShieldCheck className="h-4 w-4 text-orange-600" />
          <span>OZIKTAG · DIGITAL TRUST SEAL NUSANTARA</span>
        </Link>

        <div className="overflow-hidden rounded-2xl border border-[#383838] bg-[#1c1c1c] shadow-[var(--shadow-werkstatt-lg)]">
          <div className="flex flex-col items-center border-b border-[#383838] bg-[#161616] px-6 py-9 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2ea4a9]/40 bg-[#2ea4a9]/15">
              <CheckCircle2 className="h-9 w-9 text-[#2ea4a9]" />
            </div>
            <span className="kiln-stamp mt-4 px-2.5 py-0.5 bg-[#fac603]/15 text-[#fac603] border border-[#fac603]/30">
              TERVERIFIKASI ASLI
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#f4ecdd]">
              Sertifikat Kualitas Karya
            </h1>
            <p className="mt-1.5 text-xs text-[#bdbdbd]">
              Produk telah melalui inspeksi Quality Control oleh
            </p>
            <p className="mt-1 text-base font-bold text-[#ff792f]">{tag.brand}</p>
            {tag.isElite && (
              <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#fac603]/40 bg-[#fac603]/15 px-3 py-1 text-[11px] font-mono font-bold text-[#fac603]">
                <Award className="h-3.5 w-3.5" />
                Oziktag Master Artisan
              </span>
            )}
          </div>

          <div className="space-y-3 px-6 py-5 text-sm">
            <Row label="Nama Produk" value={tag.productName} />
            <Row label="Kategori Budaya / UMKM" value={tag.category} />
            <Row label="Kode Batch Studio" value={tag.batch || "—"} />
            <Row
              label="Tanggal QC"
              value={new Date(tag.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          </div>

          {tag.notes && (
            <div className="border-t border-[#383838] px-6 py-4 bg-[#171717]">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#bdbdbd] mb-1.5">
                Catatan Pengrajin / Studio
              </p>
              <p className="text-xs sm:text-sm text-[#f4ecdd]/90 leading-relaxed">{tag.notes}</p>
            </div>
          )}

          <div className="border-t border-[#383838] px-6 py-5">
            <p className="mb-3 text-[11px] font-mono uppercase tracking-wider text-[#bdbdbd]">
              Checklist Uji Kualitas
            </p>
            <ul className="space-y-2">
              {tag.qc.map((q) => (
                <li key={q} className="flex items-center gap-2.5 text-sm text-[#f4ecdd]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2ea4a9]" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {tag.photos && tag.photos.length > 0 && <PhotoGallery photos={tag.photos} />}

        <AiSummary tag={tag} />

        <p className="mt-6 text-center text-[11px] font-mono text-[#bdbdbd]">
          Validasi kriptografis oleh Protokol Oziktag.
          <br />
          ID Sertifikat: <span className="text-[#f4ecdd]">{tag.id}</span>
        </p>
      </div>
    </div>
  );
}

function AiSummary({ tag }: { tag: Qrtag }) {
  return <AiSummaryInner tag={tag} />;
}

function PhotoGallery({ photos }: { photos: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#383838] bg-[#1c1c1c] p-4 shadow-[var(--shadow-werkstatt)]">
      <p className="mb-3 text-[11px] font-mono uppercase tracking-wider text-[#bdbdbd]">
        Dokumentasi Foto Riil ({photos.length})
      </p>
      <div className="snap-x snap-mandatory overflow-x-auto">
        <div className="flex gap-2.5">
          {photos.map((src, i) => (
            <div key={i} className="relative group shrink-0 snap-center w-full max-w-[280px]">
              <img
                src={src}
                alt={`Foto produk ${i + 1}`}
                onClick={() => setActive(i)}
                className={`aspect-square w-full rounded-xl border object-cover transition-all cursor-pointer ${
                  active === i ? "border-orange-600" : "border-[#383838]"
                }`}
              />
              <div
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl cursor-pointer backdrop-blur-[1px]"
                onClick={() => {
                  navigator.clipboard.writeText(src);
                  toast.success("Link foto disalin!");
                }}
              >
                <div className="flex flex-col items-center gap-1.5 bg-[#1c1c1c] border border-[#383838] text-[#f4ecdd] px-4 py-2 rounded-lg shadow-lg">
                  <Copy className="h-4 w-4 text-[#ff792f]" />
                  <span className="text-xs font-medium">Salin Link Foto</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                active === i ? "w-6 bg-orange-600" : "w-1.5 bg-[#383838]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AiSummaryInner({ tag }: { tag: Qrtag }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const insight =
    tag.aiInsight ||
    `Produk ini telah lolos seluruh checklist Quality Control oleh ${tag.brand} dan berada dalam kondisi prima serta autentik.`;
  const tip = tag.aiSolution || "Simpan di tempat aman, kering, dan ikuti panduan perawatan bahan tradisional.";

  const generate = () => {
    setStatus("loading");
    setTimeout(() => setStatus("ready"), 1200);
  };

  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#383838] bg-[#1c1c1c] p-5 shadow-[var(--shadow-werkstatt)]">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600/20 text-[#ff792f]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#f4ecdd]">Analisis &amp; Tips Perawatan AI</p>
        </div>
        <span className="kiln-stamp ml-auto px-2 py-0.5 bg-[#2ea4a9]/15 text-[#2ea4a9] border border-[#2ea4a9]/30 text-[9px]">
          Oziktag AI
        </span>
      </div>

      {status === "idle" && (
        <>
          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#bdbdbd]">
            Buka ringkasan inspeksi visual AI serta cara merawat material produk karya budaya ini agar awet.
          </p>
          <button
            onClick={generate}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-sm font-bold text-white hover:bg-orange-700 transition"
          >
            <Flame className="h-4 w-4" /> Tampilkan Insight &amp; Perawatan AI
          </button>
        </>
      )}

      {status === "loading" && (
        <div className="mt-5 flex flex-col items-center justify-center gap-2 py-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <p className="text-xs font-mono text-[#bdbdbd]">Memuat analisis kurasi AI…</p>
        </div>
      )}

      {status === "ready" && (
        <>
          <p className="mt-3 text-sm leading-relaxed text-[#f4ecdd]/95">{insight}</p>
          <div className="mt-4 rounded-xl border border-[#383838] bg-[#121212] p-3.5">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#fac603]">
              Solusi &amp; Tips Pelestarian Produk
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-[#f4ecdd]/90 leading-relaxed">{tip}</p>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#2b2b2b] pb-2.5 last:border-b-0 last:pb-0">
      <span className="text-xs text-[#bdbdbd]">{label}</span>
      <span className="text-xs sm:text-sm font-semibold text-right text-[#f4ecdd]">{value}</span>
    </div>
  );
}
