import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export function AdminKycRequests() {
  const queryClient = useQueryClient();

  const { data: kycRequests, isLoading: kycRequestsLoading, refetch: refetchKyc } = useQuery({
    queryKey: ['admin-kyc-requests'],
    queryFn: async () => {
      const data = await apiFetch('/admin/kyc-requests');
      return data;
    },
  });

  const approveKycMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const data = await apiFetch(`/admin/kyc-requests/${requestId}/approve`, { method: 'POST' });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal menyetujui KYC');
    },
  });

  const rejectKycMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const data = await apiFetch(`/admin/kyc-requests/${requestId}/reject`, { method: 'POST' });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal menolak KYC');
    },
  });

  return (
    <Card className="mb-8 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-primary/5 rounded-t-xl">
        <div>
          <CardTitle className="flex items-center gap-2 text-primary">
            KYC Verification Requests
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-primary hover:text-primary/80" onClick={() => refetchKyc()}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardTitle>
          <CardDescription>
            Tinjau dokumen identitas pengguna (KYC) secara manual.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama / Email</TableHead>
                <TableHead>Toko</TableHead>
                <TableHead>Identitas</TableHead>
                <TableHead>Dokumen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kycRequestsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : !kycRequests || kycRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada permintaan KYC.
                  </TableCell>
                </TableRow>
              ) : (
                kycRequests.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.nama}</div>
                      <div className="text-xs text-muted-foreground">{req.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{req.nama_toko}</div>
                      {req.website && <div className="text-xs text-blue-500 hover:underline"><a href={req.website.startsWith('http') ? req.website : `https://${req.website}`} target="_blank" rel="noreferrer">{req.website}</a></div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">NIK: <span className="font-medium">{req.nik}</span></div>
                      {req.npwp && <div className="text-xs mt-1">NPWP: <span className="font-medium">{req.npwp}</span></div>}
                      {req.deskripsi_produk && <div className="text-xs mt-2 text-muted-foreground line-clamp-2" title={req.deskripsi_produk}>{req.deskripsi_produk}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {req.foto_ktp ? (
                          <a href={req.foto_ktp} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-500 hover:underline">
                            <FileText className="mr-1 h-3 w-3" /> KTP
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">KTP -</span>
                        )}
                        {req.foto_npwp && (
                          <a href={req.foto_npwp} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-500 hover:underline">
                            <FileText className="mr-1 h-3 w-3" /> NPWP
                          </a>
                        )}
                        {req.foto_produk_1 && (
                          <a href={req.foto_produk_1} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-500 hover:underline">
                            <FileText className="mr-1 h-3 w-3" /> Prod 1
                          </a>
                        )}
                        {req.foto_produk_2 && (
                          <a href={req.foto_produk_2} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-500 hover:underline">
                            <FileText className="mr-1 h-3 w-3" /> Prod 2
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.status === 'pending' ? (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>
                      ) : req.status === 'verified' || req.status === 'approved' ? (
                        <Badge className="bg-green-500">Approved</Badge>
                      ) : (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status !== 'rejected' && req.status !== 'approved' && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => approveKycMutation.mutate(req.id)}
                            disabled={approveKycMutation.isPending}
                          >
                            Terima
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => rejectKycMutation.mutate(req.id)}
                            disabled={rejectKycMutation.isPending}
                          >
                            Tolak
                          </Button>
                        </div>
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
