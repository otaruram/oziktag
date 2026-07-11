import { CheckCircle2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_QC_OPTIONS } from "./GeneratorConstants";
import { useState } from "react";

export function QcChecklist({
  qc,
  setQc,
  qcOptions,
  setQcOptions,
}: {
  qc: string[];
  setQc: React.Dispatch<React.SetStateAction<string[]>>;
  qcOptions: string[];
  setQcOptions: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [customQc, setCustomQc] = useState("");

  const toggleQc = (item: string) =>
    setQc((arr) => (arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]));

  const addCustomQc = () => {
    const v = customQc.trim();
    if (!v) return;
    if (qcOptions.includes(v)) {
      toast.error("Item QC sudah ada");
      return;
    }
    setQcOptions((arr) => [...arr, v]);
    setQc((arr) => [...arr, v]);
    setCustomQc("");
    toast.success("Item QC custom ditambahkan");
  };

  const removeQcOption = (item: string) => {
    setQcOptions((arr) => arr.filter((x) => x !== item));
    setQc((arr) => arr.filter((x) => x !== item));
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Checklist Quality Control</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {qcOptions.map((opt) => {
          const active = qc.includes(opt);
          const isCustom = !DEFAULT_QC_OPTIONS.includes(opt);
          return (
            <div
              key={opt}
              className={`group flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border bg-input/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleQc(opt)}
                className="flex flex-1 items-center gap-2 text-left focus:outline-none"
              >
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground/60"}`}
                />
                <span>{opt}</span>
              </button>
              {isCustom && (
                <button
                  type="button"
                  onClick={() => removeQcOption(opt)}
                  className="opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
                  aria-label="Hapus item"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={customQc}
          onChange={(e) => setCustomQc(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomQc();
            }
          }}
          placeholder="Tambah item QC custom (mis. Sudah dicek warna)"
          className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={addCustomQc}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20 transition-colors focus:outline-none"
          aria-label="Tambah QC"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
