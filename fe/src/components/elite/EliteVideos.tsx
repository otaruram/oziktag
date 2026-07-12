import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Plus, Edit, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export function EliteVideos({ isEliteOrAdmin, isAdmin }: { isEliteOrAdmin: boolean; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingVideo, setEditingVideo] = useState<any>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("");

  const { data: trainingVideos, isLoading } = useQuery({
    queryKey: ["elite-videos"],
    queryFn: async () => await apiFetch("/elite/videos"),
    enabled: !!isEliteOrAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingVideo ? `/elite/videos/${editingVideo.id}` : "/elite/videos";
      const method = editingVideo ? "PUT" : "POST";
      return await apiFetch(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success(editingVideo ? "Video berhasil diupdate" : "Video berhasil ditambahkan");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["elite-videos"] });
    },
    onError: (err: any) => toast.error(err.message || "Gagal menyimpan video"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiFetch(`/elite/videos/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Video berhasil dihapus");
      setIsDeleteModalOpen(false);
      setEditingVideo(null);
      queryClient.invalidateQueries({ queryKey: ["elite-videos"] });
    },
    onError: (err: any) => toast.error(err.message || "Gagal menghapus video"),
  });

  const resetForm = () => {
    setTitle("");
    setYoutubeUrl("");
    setThumbnail("");
    setDuration("");
    setCategory("");
    setEditingVideo(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (video: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVideo(video);
    setTitle(video.title);
    setYoutubeUrl(video.youtubeUrl || video.youtubeUrl);
    setThumbnail(video.thumbnail);
    setDuration(video.duration);
    setCategory(video.category);
    setIsModalOpen(true);
  };

  const openDeleteModal = (video: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVideo(video);
    setIsDeleteModalOpen(true);
  };

  const extractYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    const videoId = extractYoutubeId(url);
    if (videoId && !thumbnail) {
      setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !youtubeUrl || !thumbnail || !duration || !category) {
      return toast.error("Semua field harus diisi");
    }
    
    let finalYoutubeUrl = youtubeUrl;
    const videoId = extractYoutubeId(youtubeUrl);
    if (videoId) {
       finalYoutubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }

    saveMutation.mutate({ title, youtubeUrl: finalYoutubeUrl, thumbnail, duration, category });
  };

  const extractYoutubeIdForPlayer = (url: string) => {
      if (!url) return null;
      if (url.length === 11) return url;
      return extractYoutubeId(url) || url;
  };

  return (
    <>
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Video Pelatihan</h2>
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={openAddModal} className="h-8 rounded-md px-3 text-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Video
            </Button>
          )}
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat video...</p>
          ) : trainingVideos && trainingVideos.length > 0 ? (
            trainingVideos.map((v: any) => (
              <div
                key={v.id}
                onClick={() => setSelectedVideo(v)}
                className="group relative rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 block cursor-pointer"
              >
                {isAdmin && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-7 w-7 bg-white/80 hover:bg-white text-black backdrop-blur-sm" onClick={(e) => openEditModal(v, e)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={(e) => openDeleteModal(v, e)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
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
             <p className="text-sm text-muted-foreground">Belum ada video tersedia.</p>
          )}
        </div>
      </section>

      {/* Video Player Modal - Beautified */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black/95 border-border shadow-2xl sm:rounded-2xl">
          <DialogHeader className="p-5 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10 pointer-events-none">
            <DialogTitle className="text-white text-lg font-medium drop-shadow-md pointer-events-auto w-fit" dangerouslySetInnerHTML={{ __html: selectedVideo?.title || "" }} />
            <DialogDescription className="text-white/70 drop-shadow-md pointer-events-auto w-fit">
               {selectedVideo?.category} • {selectedVideo?.duration}
            </DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="aspect-video w-full bg-black flex items-center justify-center mt-12 mb-4">
              <iframe
                src={`https://www.youtube.com/embed/${extractYoutubeIdForPlayer(selectedVideo.youtubeUrl || selectedVideo.id)}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
              ></iframe>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Add/Edit Video Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Edit Video" : "Tambah Video Pelatihan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Judul Video</Label>
              <Input
                placeholder="Contoh: Strategi Marketing Jitu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>URL YouTube</Label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={handleYoutubeUrlChange}
                required
              />
              <p className="text-[10px] text-muted-foreground">Thumbnail otomatis terisi jika URL valid.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input
                  placeholder="Contoh: Marketing"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Durasi</Label>
                <Input
                  placeholder="Contoh: 15:20"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL Thumbnail</Label>
              <Input
                placeholder="https://img.youtube.com/vi/.../maxresdefault.jpg"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Video?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Video ini akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(editingVideo?.id)}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
