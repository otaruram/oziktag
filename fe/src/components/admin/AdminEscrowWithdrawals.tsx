import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function AdminEscrowWithdrawals() {
  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: () => apiFetch("/wallet/admin/withdraws"),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/wallet/admin/withdraws/${id}/complete`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Penarikan berhasil diselesaikan!");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menyelesaikan penarikan");
    }
  });

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Penarikan Dana Escrow</CardTitle>
          <CardDescription>Memuat data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Penarikan Dana Escrow</CardTitle>
        <CardDescription>
          Kelola permintaan penarikan dana dari penjual (Admin transfer manual, lalu klik "Selesai").
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Tujuan Transfer</TableHead>
                <TableHead>Tarik Saldo</TableHead>
                <TableHead>Transfer Net (Admin)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada permintaan penarikan dana saat ini.
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals?.map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(w.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute:"2-digit" })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{w.user_name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{w.user_id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-primary">{w.bank_name}</div>
                      <div className="text-xs">{w.bank_account}</div>
                      <div className="text-xs text-muted-foreground">a.n {w.account_name}</div>
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      Rp {w.amount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="font-bold text-lg text-green-600 bg-green-50/30">
                      Rp {(w.amount - 2500).toLocaleString("id-ID")}
                      <div className="text-[10px] text-muted-foreground font-normal leading-tight mt-1">Potong biaya transfer Rp 2.500.<br/>Anda harus transfer sejumlah besar di atas.</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${w.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {w.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {w.status === "PENDING" && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            if (window.confirm("Pastikan Anda sudah transfer manual ke rekening tersebut. Lanjutkan?")) {
                              completeMutation.mutate(w.id);
                            }
                          }}
                          disabled={completeMutation.isPending}
                        >
                          Tandai Selesai
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
