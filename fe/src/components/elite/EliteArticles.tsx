import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, ImagePlus, Loader2, Edit, Trash2 } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";

export function EliteArticles({ isEliteOrAdmin, isAdmin }: { isEliteOrAdmin: boolean; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);

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

  const saveArticleMutation = useMutation({
    mutationFn: async (data: { title: string; preview: string; content: string }) => {
      const url = editingArticle ? `/elite/articles/${editingArticle.id}` : "/elite/articles";
      const method = editingArticle ? "PUT" : "POST";
      return await apiFetch(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success(editingArticle ? "Artikel berhasil diupdate" : "Artikel berhasil ditambahkan");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["elite-articles"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menyimpan artikel");
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiFetch(`/elite/articles/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Artikel berhasil dihapus");
      setIsDeleteModalOpen(false);
      setEditingArticle(null);
      queryClient.invalidateQueries({ queryKey: ["elite-articles"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menghapus artikel");
    },
  });

  const resetForm = () => {
    setNewTitle("");
    setNewPreview("");
    setNewContent("");
    setEditingArticle(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (article: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingArticle(article);
    setNewTitle(article.title);
    setNewPreview(article.preview);
    setNewContent(article.content);
    setIsModalOpen(true);
  };

  const openDeleteModal = (article: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingArticle(article);
    setIsDeleteModalOpen(true);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPreview || !newContent) {
      return toast.error("Semua field harus diisi");
    }
    saveArticleMutation.mutate({ title: newTitle, preview: newPreview, content: newContent });
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
              onClick={openAddModal}
              className="gap-2 h-8 px-3 rounded-md text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Artikel
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
                className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors cursor-pointer"
              >
                {isAdmin && (
                  <div className="absolute top-4 right-4 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-7 w-7 bg-white/80 hover:bg-white text-black backdrop-blur-sm" onClick={(e) => openEditModal(a, e)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={(e) => openDeleteModal(a, e)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <div className="pr-16">
                  <p className="text-sm font-semibold">{a.title.replace(/\*/g, '')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.preview.replace(/\*/g, '')}</p>
                </div>
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
            className="prose prose-base dark:prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-p:mb-6 prose-img:rounded-xl prose-img:shadow-lg prose-img:mb-8 prose-headings:font-bold font-sans"
            dangerouslySetInnerHTML={{ __html: selectedArticle?.content?.replace(/\*/g, '') || "" }}
          />
        </DialogContent>
      </Dialog>

      {/* Form Add/Edit Article Modal (Admin Only) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingArticle ? "Edit Artikel" : "Tambah Artikel Tips QC"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveArticle} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saveArticleMutation.isPending}>
                {saveArticleMutation.isPending ? "Menyimpan..." : "Simpan Artikel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Artikel?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Artikel ini akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteArticleMutation.isPending}
              onClick={() => deleteArticleMutation.mutate(editingArticle?.id)}
            >
              {deleteArticleMutation.isPending ? "Menghapus..." : "Hapus Artikel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
