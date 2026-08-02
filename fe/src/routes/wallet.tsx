import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, ArrowDownRight, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { EscrowRequestForm } from "@/components/escrow/EscrowRequestForm";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Dompet — Oziktag" }] }),
  component: WalletPage,
});

function WalletPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number | "">("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  
  // Need Admin status? No, this is for Sellers. Wait, the user asked to restrict this to admin for now?
  // User request: "atau diimplementasi hanya admin yg bisa akses gitu"
  // So we will just show it to everyone, but the user is admin anyway.
  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiFetch('/auth/me'),
  });
  
  const { data: balanceData, isLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => apiFetch("/wallet/balance"),
  });

  const requestWithdrawMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    }),
    onSuccess: () => {
      toast.success("Permintaan penarikan berhasil dibuat!");
      setAmount("");
      setBankCode("");
      setAccountNumber("");
      setAccountName("");
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal melakukan penarikan");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 50000) return toast.error("Minimal penarikan Rp 50.000");
    if (!bankCode || !accountNumber || !accountName) return toast.error("Lengkapi data rekening");
    
    requestWithdrawMutation.mutate({
      amount: Number(amount),
      bank_code: bankCode,
      account_number: accountNumber,
      account_name: accountName
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"><Clock className="h-3 w-3"/> Diproses</span>;
      case "COMPLETED": return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"><CheckCircle2 className="h-3 w-3"/> Selesai</span>;
      case "REJECTED": return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"><AlertCircle className="h-3 w-3"/> Ditolak</span>;
      default: return status;
    }
  };

  if (me && !me.can_use_escrow) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto py-12 space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Akses Escrow [BETA]</h1>
            <p className="text-muted-foreground">
              Fitur Escrow saat ini dibatasi. Silakan ajukan akses dengan mengisi form di bawah ini.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl border bg-card shadow-sm">
            {me.escrow_request_status === "pending" ? (
              <div className="text-center py-8 space-y-4">
                <Clock className="h-12 w-12 text-yellow-500 mx-auto opacity-80" />
                <div>
                  <h3 className="text-lg font-medium">Pengajuan Sedang Direview</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tim kami sedang meninjau permintaan Anda. Mohon tunggu maksimal 1x24 jam.
                  </p>
                </div>
              </div>
            ) : me.escrow_request_status === "rejected" ? (
              <div className="space-y-6">
                <div className="bg-red-50 text-red-800 p-4 rounded-lg flex gap-3 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>Pengajuan Anda sebelumnya <b>ditolak</b>. Silakan perbaiki data dan ajukan kembali.</p>
                </div>
                <EscrowRequestForm />
              </div>
            ) : (
              <EscrowRequestForm />
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dompet Penghasilan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola dan tarik dana hasil penjualan Escrow Anda.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="col-span-1 md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="h-24 w-24" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Saldo Aktif</h3>
              <p className="text-4xl font-bold text-foreground">Rp {balanceData?.balance?.toLocaleString("id-ID") || 0}</p>
              
              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="font-semibold mb-4 text-sm flex items-center gap-2"><ArrowDownRight className="h-4 w-4 text-primary"/> Tarik Saldo</h4>
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                  <div>
                    <label className="block text-xs font-medium mb-1">Jumlah Tarik (Min 50rb)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={e => setAmount(e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="Rp"
                      min={50000}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Bank Tujuan</label>
                    <select 
                      value={bankCode}
                      onChange={e => setBankCode(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="">Pilih Bank</option>
                      <option value="BCA">BCA</option>
                      <option value="MANDIRI">Mandiri</option>
                      <option value="BRI">BRI</option>
                      <option value="BNI">BNI</option>
                      <option value="BSI">BSI</option>
                      <option value="SEABANK">SeaBank</option>
                      <option value="JAGO">Bank Jago</option>
                      <option value="GOPAY">GoPay</option>
                      <option value="DANA">DANA</option>
                      <option value="OVO">OVO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Nomor Rekening</label>
                    <input 
                      type="text" 
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="No. Rekening"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Nama Pemilik Rekening</label>
                    <input 
                      type="text" 
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="Atas Nama"
                    />
                  </div>
                  
                  <div className="bg-primary/5 rounded-lg p-3 text-xs text-muted-foreground border border-primary/10">
                    <p>Biaya admin penarikan: <span className="font-semibold text-foreground">Rp 2.500 flat</span>. Akan memotong saldo Anda.</p>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={requestWithdrawMutation.isPending}
                    className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70 flex justify-center"
                  >
                    {requestWithdrawMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ajukan Penarikan"}
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          {/* History */}
          <div className="col-span-1 md:col-span-2">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold text-lg">Riwayat Penarikan</h3>
              </div>
              
              {balanceData?.withdraws?.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  Belum ada riwayat penarikan dana.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-3">Tanggal</th>
                        <th className="px-6 py-3">Jumlah</th>
                        <th className="px-6 py-3">Tujuan</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {balanceData?.withdraws?.map((w: any) => (
                        <tr key={w.id} className="hover:bg-muted/30">
                          <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                            {new Date(w.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            Rp {w.amount.toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{w.bankCode}</div>
                            <div className="text-xs text-muted-foreground">{w.accountNumber} a.n {w.accountName}</div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(w.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
