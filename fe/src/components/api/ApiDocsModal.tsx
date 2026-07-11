import { X } from "lucide-react";

export function ApiDocsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-[var(--shadow-elegant)] overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Oziktag API v1.0</p>
            <h3 className="mt-1 text-lg font-semibold flex items-center gap-2">API Documentation</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            Integrasikan pembuatan QR Code QC secara otomatis dari sistem ERP, POS, atau aplikasi kasir internal Anda. Gunakan API Key yang telah di-generate pada dashboard ini.
          </p>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold font-mono">POST</span>
              <code className="text-sm font-mono font-medium">/api/v1/qc</code>
            </div>
            <p className="text-muted-foreground mb-4">Endpoint ini digunakan untuk men-generate label QR Code QC baru beserta analisis AI otomatis.</p>
            
            <h4 className="font-semibold mb-2">Headers</h4>
            <div className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono border border-border/50 mb-4">
              <div className="flex justify-between mb-1"><span className="text-primary">Authorization:</span> <span>Bearer {'<YOUR_API_KEY>'}</span></div>
              <div className="flex justify-between"><span className="text-primary">Content-Type:</span> <span>application/json</span></div>
            </div>

            <h4 className="font-semibold mb-2">Request Body (JSON)</h4>
            <div className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono border border-border/50 mb-4">
              <pre>{`{
  "nama_produk": "String (Required)",
  "kategori": "String (Required)",
  "batch": "String (Optional)",
  "checklist": ["String", "String"] (Array of Strings, Required),
  "catatan_penjual": "String (Optional)",
  "image_urls": ["String"] (Array of HTTP URLs, max 5, Required)
}`}</pre>
            </div>

            <h4 className="font-semibold mb-2">Success Response (201 Created)</h4>
            <div className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono border border-border/50 mb-4">
              <pre>{`{
  "qr_url": "https://www.oziktag.my.id/scan/...",
  "product_id": "uuid-string"
}`}</pre>
            </div>

            <h4 className="font-semibold mb-2">Error Responses</h4>
            <ul className="text-muted-foreground list-disc list-inside space-y-1">
              <li><code className="text-xs bg-secondary px-1 py-0.5 rounded text-destructive">401 Unauthorized</code>: API Key tidak valid.</li>
              <li><code className="text-xs bg-secondary px-1 py-0.5 rounded text-destructive">402 Payment Required</code>: Saldo kredit API habis.</li>
              <li><code className="text-xs bg-secondary px-1 py-0.5 rounded text-destructive">400 Bad Request</code>: Format JSON tidak sesuai.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
