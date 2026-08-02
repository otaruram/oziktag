import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

export function AdminApiRequests() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: apiRequests, isLoading: apiRequestsLoading } = useQuery({
    queryKey: ['admin-api-requests'],
    queryFn: async () => {
      const data = await apiFetch('/admin/api-requests');
      return data;
    },
  });

  const currentRequests = apiRequests ? apiRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];
  const totalPages = apiRequests ? Math.ceil(apiRequests.length / itemsPerPage) : 1;


  const approveApiRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const data = await apiFetch(`/admin/api-requests/${requestId}/approve`, { method: 'POST' });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-api-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal menyetujui request');
    },
  });

  const rejectApiRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const data = await apiFetch(`/admin/api-requests/${requestId}/reject`, { method: 'POST' });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-api-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal menolak request');
    },
  });

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            API Access Requests
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-api-requests'] })}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardTitle>
          <CardDescription>
            Tinjau permintaan pengguna untuk mendapatkan akses ke Developer API.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Waktu Request</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiRequestsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : currentRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada permintaan API.
                  </TableCell>
                </TableRow>
              ) : (
                currentRequests.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.nama}</TableCell>
                    <TableCell>{req.email}</TableCell>
                    <TableCell>
                      {new Date(req.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      {req.status === 'pending' ? (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>
                      ) : req.status === 'approved' ? (
                        <Badge className="bg-green-500">Approved</Badge>
                      ) : (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => approveApiRequestMutation.mutate(req.id)}
                            disabled={approveApiRequestMutation.isPending}
                          >
                            Terima
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => rejectApiRequestMutation.mutate(req.id)}
                            disabled={rejectApiRequestMutation.isPending}
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
        {totalPages > 1 && (
          <Pagination className="mt-4 pb-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(p => p - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <span className="text-sm text-muted-foreground mx-4">
                Halaman {currentPage} dari {totalPages}
              </span>
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(p => p + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}
