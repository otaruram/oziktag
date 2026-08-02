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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { Eye, CheckCircle, XCircle } from "lucide-react";

export function AdminEscrowRequests() {
  const queryClient = useQueryClient();
  const [selectedReq, setSelectedReq] = useState<any>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-escrow-requests"],
    queryFn: () => apiFetch("/admin/escrow-requests"),
  });

  const approveMutation = useMutation({
    mutationFn: (reqId: string) => apiFetch(`/admin/approve-escrow/${reqId}`, { method: "POST" }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-escrow-requests"] });
      setSelectedReq(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menyetujui akses");
    }
  });

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Permintaan Akses Escrow</CardTitle>
          <CardDescription>Memuat data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Permintaan Akses Escrow</CardTitle>
        <CardDescription>
          Kelola UMKM yang mengajukan fitur Payment Link Escrow.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tanggal Pengajuan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Tidak ada permintaan akses escrow saat ini.
                  </TableCell>
                </TableRow>
              ) : (
                requests?.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      {req.nama_toko || "Tanpa Nama"}
                    </TableCell>
                    <TableCell>{req.email}</TableCell>
                    <TableCell>
                      {new Date(req.created_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReq(req)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Permintaan Escrow</DialogTitle>
            <DialogDescription>
              Tinjau data UMKM sebelum menyetujui fitur Escrow.
            </DialogDescription>
          </DialogHeader>

          {selectedReq && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nama Toko</p>
                  <p className="font-medium">{selectedReq.nama_toko}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email User</p>
                  <p className="font-medium">{selectedReq.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nama Bank</p>
                  <p className="font-medium">{selectedReq.nama_bank}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nomor Rekening</p>
                  <p className="font-medium">{selectedReq.nomor_rekening}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Nama Pemilik Rekening</p>
                  <p className="font-medium">{selectedReq.nama_pemilik}</p>
                </div>
                {selectedReq.link_umkm && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Link UMKM / Sosmed</p>
                    <a href={selectedReq.link_umkm} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                      {selectedReq.link_umkm}
                    </a>
                  </div>
                )}
                <div className="col-span-2 p-3 bg-muted/50 rounded-md">
                  <p className="text-muted-foreground mb-1">Catatan Produk</p>
                  <p className="font-medium whitespace-pre-wrap">{selectedReq.catatan_produk}</p>
                </div>
                <div className="col-span-2 p-3 bg-muted/50 rounded-md">
                  <p className="text-muted-foreground mb-1">Tujuan Penggunaan Escrow</p>
                  <p className="font-medium whitespace-pre-wrap">{selectedReq.tujuan_escrow}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedReq(null)}>
                  Batal
                </Button>
                <Button 
                  onClick={() => approveMutation.mutate(selectedReq.id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Setujui Akses
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
