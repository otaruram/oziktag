import sys

with open('fe/src/routes/api-keys.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state
state_code = "  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);\n"
content = content.replace("  const [apiKeys, setApiKeys] = useState<any[]>([]);", "  const [apiKeys, setApiKeys] = useState<any[]>([]);\n" + state_code)

# Replace revokeKey
old_revoke = """  const revokeKey = async (id: string) => {
    if (!confirm("Yakin ingin menghapus key ini?")) return;
    try {
      await apiFetch(`/apikeys/${id}`, { method: "DELETE" });
      setApiKeys(apiKeys.filter(k => k.id !== id));
      toast.success("Key berhasil dihapus");
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus key");
    }
  };"""

new_revoke = """  const revokeKey = async (id: string) => {
    try {
      await apiFetch(`/apikeys/${id}`, { method: "DELETE" });
      setApiKeys(apiKeys.filter(k => k.id !== id));
      toast.success("Key berhasil dihapus");
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus key");
    } finally {
      setConfirmDelete(null);
    }
  };"""
content = content.replace(old_revoke, new_revoke)

# Replace the button onClick
content = content.replace("onClick={() => revokeKey(k.id)}", "onClick={() => setConfirmDelete(k.id)}")

# Replace p-6 with p-4 sm:p-6
content = content.replace('bg-card p-6', 'bg-card p-4 sm:p-6')
content = content.replace('bg-primary/5 p-5', 'bg-primary/5 p-4 sm:p-5')

# Add Confirm Modal at the end of ApiKeys return
modal_code = """      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Hapus API Key?</h3>
            <p className="text-sm text-muted-foreground mb-6">Tindakan ini tidak dapat dibatalkan. Key ini tidak akan bisa digunakan lagi.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-medium hover:bg-secondary transition-colors">Batal</button>
              <button onClick={() => revokeKey(confirmDelete)} className="flex-1 rounded-md bg-destructive py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}"""

content = content.replace("{showHistory && <ApiHistoryModal onClose={() => setShowHistory(false)} />}", "{showHistory && <ApiHistoryModal onClose={() => setShowHistory(false)} />}\n" + modal_code)

with open('fe/src/routes/api-keys.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("api-keys.tsx updated")
