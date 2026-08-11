import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Play, MessageCircle, Lock, ArrowRight, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { EliteArticles } from "@/components/elite/EliteArticles";
import { EliteVideos } from "@/components/elite/EliteVideos";
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

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => await apiFetch("/auth/me")
  });

  const isEliteOrAdmin = me?.is_elite || me?.is_admin;
  const eliteExpires = me?.elite_expires_at || null;

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
    const successCount = me?.escrow_success_count || 0;
    const target = 50;
    const progress = Math.min((successCount / target) * 100, 100);

    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Oziktag Elite Hub Terkunci</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Elite Hub adalah komunitas eksklusif dan program loyalitas kami.
            Dapatkan akses ke pendanaan BNI KUR Fast-Track, kelas ekspor Xpora, dan bebas biaya MDR dengan mencapai target pengiriman sukses!
          </p>
          
          <div className="mt-8 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium">Progress Unlock</span>
              <span className="text-sm font-bold">{successCount} / {target} Transaksi</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Selesaikan {target - successCount > 0 ? target - successCount : 0} transaksi Escrow tanpa sengketa (retur) lagi untuk membuka fitur ini secara gratis selamanya.
            </p>
          </div>
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
      <EliteVideos isEliteOrAdmin={!!isEliteOrAdmin} isAdmin={!!me?.is_admin} />

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


    </AppShell>
  );
}
