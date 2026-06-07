import sys

with open('fe/src/routes/dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state
state_code = "  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);\n"
content = content.replace("  const [logs, setLogs] = useState<any[]>([]);", "  const [logs, setLogs] = useState<any[]>([]);\n" + state_code)

# Replace handleDelete
old_delete = """  const handleDelete = async (id: string) => {
    if (!confirm("Hapus QR Code ini?")) return;
    try {
      await apiFetch(`/qc/${id}`, { method: "DELETE" });
      toast.success("Produk berhasil dihapus");
      setTags(tags.filter(t => t.id !== id));
      setTotalProducts(prev => prev - 1);
    } catch (e) {
      toast.error("Gagal menghapus produk");
    }
  };"""

new_delete = """  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/qc/${id}`, { method: "DELETE" });
      toast.success("Produk berhasil dihapus");
      setTags(tags.filter(t => t.id !== id));
      setTotalProducts(prev => prev - 1);
    } catch (e) {
      toast.error("Gagal menghapus produk");
    } finally {
      setConfirmDelete(null);
    }
  };"""
content = content.replace(old_delete, new_delete)

# Replace the button onClick
content = content.replace("onClick={() => handleDelete(t.id)}", "onClick={() => setConfirmDelete(t.id)}")

# Add Confirm Modal at the end of Dashboard return
modal_code = """      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Hapus QR Code?</h3>
            <p className="text-sm text-muted-foreground mb-6">Tindakan ini tidak dapat dibatalkan. Label ini tidak akan bisa dipindai lagi.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-medium hover:bg-secondary transition-colors">Batal</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 rounded-md bg-destructive py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}"""

content = content.replace("    </AppShell>", modal_code + "\n    </AppShell>")

with open('fe/src/routes/dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("dashboard.tsx updated")
