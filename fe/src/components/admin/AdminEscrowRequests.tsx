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
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export function AdminEscrowRequests() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-escrow-requests"],
    queryFn: () => apiFetch("/admin/escrow-requests"),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => apiFetch(`/admin/approve-escrow/${userId}`, { method: "POST" }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-escrow-requests"] });
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
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Tidak ada permintaan akses escrow saat ini.
                  </TableCell>
                </TableRow>
              ) : (
                requests?.map((usr: any) => (
                  <TableRow key={usr.id}>
                    <TableCell className="font-medium">
                      {usr.nama || "Tanpa Nama"}
                    </TableCell>
                    <TableCell>{usr.email}</TableCell>
                    <TableCell>
                      {new Date(usr.createdAt).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(usr.id)}
                        disabled={approveMutation.isPending}
                      >
                        Setujui Akses
                      </Button>
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
