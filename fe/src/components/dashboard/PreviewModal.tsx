import { Link } from "@tanstack/react-router";
import { Eye, ArrowRight, X } from "lucide-react";

export function PreviewModal({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const scanUrl = `/scan/${id}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl animate-in zoom-in-95 duration-200 flex flex-col"
        style={{ height: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
              <Eye className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Preview Scan</p>
              <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/scan/$id"
              params={{ id }}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
            >
              Buka <ArrowRight className="h-3 w-3" />
            </Link>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Browser chrome mockup */}
        <div className="px-4 py-2 bg-secondary/30 border-b border-border shrink-0 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 rounded-md bg-background/70 border border-border px-3 py-1 text-[10px] font-mono text-muted-foreground">
            {window.location.origin}{scanUrl}
          </div>
        </div>

        {/* iframe */}
        <div className="flex-1 overflow-hidden rounded-b-2xl">
          <iframe
            src={scanUrl}
            title={`Preview: ${name}`}
            className="w-full h-full border-0"
            style={{ background: "white" }}
          />
        </div>
      </div>
    </div>
  );
}
