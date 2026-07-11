import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, ImagePlus, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function EliteArticles({ isEliteOrAdmin, isAdmin }: { isEliteOrAdmin: boolean; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPreview, setNewPreview] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["elite-articles"],
    queryFn: async () => await apiFetch("/elite/articles"),
    enabled: !!isEliteOrAdmin,
  });

  const addArticleMutation = useMutation({
    mutationFn: async (data: { title: string; preview: string; content: string }) => {
      return await apiFetch("/elite/articles", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Artikel berhasil ditambahkan");
      setIsAddModalOpen(false);
      setNewTitle("");
      setNewPreview("");
      setNewContent("");
      queryClient.invalidateQueries({ queryKey: ["elite-articles"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menambahkan artikel");
    },
  });

  const handleAddArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPreview || !newContent) {
      return toast.error("Semua field harus diisi");
    }
    addArticleMutation.mutate({ title: newTitle, preview: newPreview, content: newContent });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await apiFetch("/upload/image", {
        method: "POST",
        body: formData,
      });
      if (data.url) {
        setNewContent((prev) => prev + `\n<img src="${data.url}" alt="Article Image" style="max-width:100%; border-radius:8px;" />\n`);
        toast.success("Gambar berhasil ditambahkan");
      }
    } catch (err: any) {
      toast.error("Gagal mengupload gambar");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Tips QC Kerajinan Tangan
            </h2>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Tambah Artikel
            </Button>
          )}
        </div>

        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat artikel...</p>
          ) : articles && articles.length > 0 ? (
            articles.map((a: any) => (
              <div
                key={a.id}
                onClick={() => setSelectedArticle(a)}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors cursor-pointer"
              >
                <p className="text-sm font-semibold">{a.title.replace(/\*/g, '')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.preview.replace(/\*/g, '')}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada artikel.</p>
          )}
        </div>
      </section>

      {/* Article Reader Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl mb-2">{selectedArticle?.title.replace(/\*/g, '')}</DialogTitle>
          </DialogHeader>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: selectedArticle?.content?.replace(/\*/g, '') || "" }}
          />
        </DialogContent>
      </Dialog>

      {/* Add Article Dialog (Admin Only) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah Artikel Tips QC</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddArticle} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Artikel</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Teknik QC Anyaman"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Preview / Ringkasan Singkat</Label>
              <Textarea
                value={newPreview}
                onChange={(e) => setNewPreview(e.target.value)}
                placeholder="Muncul di list halaman depan"
                rows={2}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Isi Konten (HTML diperbolehkan)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                  Sisipkan Gambar
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="<p>Isi artikel...</p>"
                rows={6}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addArticleMutation.isPending}>
                {addArticleMutation.isPending ? "Menyimpan..." : "Simpan Artikel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
