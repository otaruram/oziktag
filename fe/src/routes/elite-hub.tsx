import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Play, MessageCircle, Lock, ArrowRight, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { EliteArticles } from "@/components/elite/EliteArticles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/elite-hub")({
  head: () => ({ meta: [{ title: "Elite Hub — Oziktag" }] }),
  component: EliteHub,
});

// We now fetch from YouTube API
// const TRAINING_VIDEOS = [...]

// The TIPS_ARTICLES constant has been moved to EliteArticles.tsx (dynamic)

function EliteHub() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => await apiFetch("/auth/me")
  });

  const isEliteOrAdmin = me?.is_elite || me?.is_admin;
  const eliteExpires = me?.elite_expires_at || null;

  const { data: trainingVideos, isLoading: videosLoading } = useQuery({
    queryKey: ["elite-videos"],
    queryFn: async () => await apiFetch("/elite/videos"),
    enabled: !!isEliteOrAdmin
  });

  if (meLoading) {
    return (
      <AppShell>
        <div className="flex h-60 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!isEliteOrAdmin) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Konten Eksklusif</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Elite Hub hanya tersedia untuk member Artisan Elite.
            Berlangganan untuk mengakses video pelatihan, tips QC kerajinan tangan, dan forum diskusi.
          </p>
          <Link
            to="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Lihat Paket Langganan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Crown className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Elite Hub</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Komunitas UMKM Kerajinan Tangan Pilihan</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Award className="h-3.5 w-3.5" />
          Artisan Elite
          {eliteExpires && (
            <span className="text-muted-foreground ml-1">
              · s/d {new Date(eliteExpires).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </span>
          )}
        </span>
      </div>

      {/* Video Pelatihan */}
      <section className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <Play className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Video Pelatihan</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videosLoading ? (
            <p className="text-sm text-muted-foreground">Memuat video realtime dari YouTube...</p>
          ) : trainingVideos && trainingVideos.length > 0 ? (
            trainingVideos.map((v: any) => (
              <div
                key={v.id}
                onClick={() => setSelectedVideo(v)}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 block cursor-pointer"
              >
                <div className="relative flex aspect-video items-center justify-center rounded-lg bg-secondary/60 mb-4 overflow-hidden">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                      <Play className="h-5 w-5 text-primary ml-0.5" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm group-hover:scale-110 transition-transform">
                       <Play className="h-5 w-5 text-white ml-0.5" />
                     </div>
                  </div>
                </div>
                <p className="text-sm font-semibold line-clamp-2" dangerouslySetInnerHTML={{ __html: v.title }} />
                <p className="mt-1 text-xs text-muted-foreground">{v.category}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">{v.duration}</p>
              </div>
            ))
          ) : (
             <p className="text-sm text-muted-foreground">Tidak ada video tersedia.</p>
          )}
        </div>
      </section>

      {/* Tips & Artikel */}
      <EliteArticles isEliteOrAdmin={!!isEliteOrAdmin} isAdmin={!!me?.is_admin} />

      {/* Forum Diskusi — Coming Soon */}
      <section className="mt-10 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Forum Diskusi</h2>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Coming Soon</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Forum diskusi sesama pengrajin sedang dalam pengembangan.
          </p>
        </div>
      </section>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
          <DialogHeader className="p-4 bg-background">
            <DialogTitle dangerouslySetInnerHTML={{ __html: selectedVideo?.title || "" }} />
          </DialogHeader>
          {selectedVideo && (
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              ></iframe>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
