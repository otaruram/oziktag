import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

export function ImageUploader({
  photos,
  setPhotos,
  imageFiles,
  setImageFiles,
}: {
  photos: string[];
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  imageFiles: File[];
  setImageFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - photos.length;
    if (remaining <= 0) {
      toast.error("Maksimal 5 foto");
      return;
    }
    const picked = Array.from(files).slice(0, remaining);
    const dataUrls = picked.map((f) => URL.createObjectURL(f));

    setPhotos((p) => [...p, ...dataUrls].slice(0, 5));
    setImageFiles((p) => [...p, ...picked].slice(0, 5));
  };

  const removePhoto = (i: number) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setImageFiles((p) => p.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        Foto Produk <span className="text-destructive">*</span>{" "}
        <span className="text-xs font-normal text-muted-foreground">
          (min 1, maks 5 — {photos.length}/5)
        </span>
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {photos.map((src, i) => (
          <div
            key={i}
            className="group relative aspect-square overflow-hidden rounded-md border border-border bg-input/30"
          >
            <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground opacity-90 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              aria-label="Hapus foto"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < 5 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-input/20 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
            <ImagePlus className="h-5 w-5" />
            <span>Upload</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
