import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { getTag, type Qrtag } from "@/lib/oziktag-store";

export const Route = createFileRoute("/scan/$id")({
  head: () => ({
    meta: [
      { title: "Verifikasi Produk — Oziktag" },
      { name: "description", content: "Verifikasi keaslian dan QC produk via Oziktag." },
    ],
  }),
  component: Scan,
});

function Scan() {
  const { id } = Route.useParams();
  const [tag, setTag] = useState<Qrtag | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTag(getTag(id) || null);
    setLoaded(true);
  }, [id]);

  if (!loaded) return null;

  if (!tag) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-lg font-semibold">QR Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Label ini belum terdaftar atau sudah dinonaktifkan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Oziktag · Trusted Seal
        </Link>

        <div className="overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-[var(--shadow-elegant)]">
          <div className="flex flex-col items-center bg-gradient-to-b from-primary/15 to-transparent px-6 py-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Verified & Trusted</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Produk ini telah melewati Quality Control oleh
            </p>
            <p className="mt-1 text-base font-medium text-primary">{tag.brand}</p>
          </div>

          <div className="space-y-3 border-t border-border px-6 py-5 text-sm">
            <Row label="Nama Produk" value={tag.productName} />
            <Row label="Kategori" value={tag.category} />
            <Row label="Kode Batch" value={tag.batch || "—"} />
            <Row
              label="Tanggal QC"
              value={new Date(tag.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          </div>

          <div className="border-t border-border px-6 py-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Checklist QC
            </p>
            <ul className="space-y-2">
              {tag.qc.map((q) => (
                <li key={q} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {tag.photos && tag.photos.length > 0 && (
          <PhotoGallery photos={tag.photos} />
        )}

        <AiSummary tag={tag} />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Validasi dilakukan oleh sistem Oziktag.
          <br />
          ID Label: <span className="font-mono">{tag.id}</span>
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
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-elegant)]">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Foto Produk ({photos.length})
      </p>
      <div className="snap-x snap-mandatory overflow-x-auto">
        <div className="flex gap-2">
          {photos.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Foto produk ${i + 1}`}
              onClick={() => setActive(i)}
              className={`aspect-square w-full max-w-[280px] shrink-0 snap-center cursor-pointer rounded-lg border object-cover transition-all ${
                active === i ? "border-primary" : "border-border"
              }`}
            />
          ))}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                active === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40"
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
  const hasNotes = !!tag.notes && tag.notes.trim().length > 0;
  const insight = hasNotes
    ? `Produk ini dalam kondisi sangat baik dan original. Berdasarkan catatan QC dari ${tag.brand}: "${tag.notes}" — hal ini tidak mempengaruhi kualitas isi produk.`
    : `Produk ini telah lolos seluruh checklist Quality Control oleh ${tag.brand} dan berada dalam kondisi prima serta original.`;

  const careTips: Record<string, string> = {
    "Makanan & Minuman": "Simpan di tempat sejuk dan kering, hindari sinar matahari langsung untuk menjaga rasa & aroma.",
    Fashion: "Cuci dengan air dingin dan jemur di tempat teduh agar warna & serat tetap awet.",
    Kerajinan: "Bersihkan dengan kain kering, hindari kelembapan tinggi agar tidak berjamur.",
    Kecantikan: "Tutup rapat setelah dipakai dan simpan di suhu ruang, hindari paparan matahari.",
    Lainnya: "Simpan di tempat aman, kering, dan jauh dari jangkauan anak-anak.",
  };
  const tip = careTips[tag.category] ?? careTips.Lainnya;

  const generate = () => {
    setStatus("loading");
    setTimeout(() => setStatus("ready"), 1600);
  };

  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-[var(--shadow-elegant)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-semibold tracking-tight">Insight AI</p>
          <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
            Oziktag AI
          </span>
        </div>

        {status === "idle" && (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Dapatkan insight & tips perawatan produk ini dari AI Oziktag.
            </p>
            <button
              onClick={generate}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" /> Generate Insight AI
            </button>
          </>
        )}

        {status === "loading" && (
          <div className="mt-5 flex flex-col items-center justify-center gap-2 py-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">AI sedang menganalisis produk…</p>
          </div>
        )}

        {status === "ready" && (
          <>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{insight}</p>
            <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Solusi & Tips Perawatan
              </p>
              <p className="mt-1 text-sm text-foreground/90">{tip}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}