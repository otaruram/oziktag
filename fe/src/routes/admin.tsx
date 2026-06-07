import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Users, Activity, ShieldAlert, CreditCard, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, FileText } from 'lucide-react';

export const Route = createFileRoute('/admin')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditType, setCreditType] = useState<string>("QR");
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;

  // Queries
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const data = await apiFetch('/auth/me');
      return data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const data = await apiFetch('/admin/stats');
      return data;
    },
    enabled: !!user?.is_admin,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const data = await apiFetch('/admin/users');
      return data;
    },
    enabled: !!user?.is_admin,
  });

  const { data: apiRequests, isLoading: apiRequestsLoading } = useQuery({
    queryKey: ['admin-api-requests'],
    queryFn: async () => {
      const data = await apiFetch('/admin/api-requests');
      return data;
    },
    enabled: !!user?.is_admin,
  });

  const { data: kycRequests, isLoading: kycRequestsLoading, refetch: refetchKyc } = useQuery({
    queryKey: ['admin-kyc-requests'],
    queryFn: async () => {
      const data = await apiFetch('/admin/kyc-requests');
      return data;
    },
    enabled: !!user?.is_admin,
  });

  // Mutations
  const addCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount, tipe_kredit }: { userId: string; amount: number; tipe_kredit: string }) => {
      const data = await apiFetch('/admin/credits/add', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, amount: amount, tipe_kredit: tipe_kredit }),
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setIsCreditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan kredit');
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, banned }: { userId: string; banned: boolean }) => {
      const data = await apiFetch('/admin/users/ban', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, banned: banned }),
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal mengubah status ban');
    },
  });

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

  if (!user?.is_admin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Akses Ditolak</h2>
          <p className="text-gray-500 mt-2">Halaman ini khusus untuk Administrator.</p>
        </div>
      </div>
    );
  }

  const handleAddCredits = () => {
    if (!selectedUser || creditAmount === 0) return;
    addCreditsMutation.mutate({ userId: selectedUser.id, amount: creditAmount, tipe_kredit: creditType });
  };

  const handleBanToggle = (usr: any) => {
    banUserMutation.mutate({ userId: usr.id, banned: !usr.is_banned });
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <Link to="/dashboard" className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '-' : stats?.total_users || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Online (15m)</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '-' : stats?.online_users || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '-' : stats?.total_products || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '-' : stats?.banned_users || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Access Requests */}
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
                ) : !apiRequests || apiRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Belum ada permintaan API.
                    </TableCell>
                  </TableRow>
                ) : (
                  apiRequests.map((req: any) => (
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
        </CardContent>
      </Card>

      {/* KYC Verification Requests */}
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
                      <TableCell className="font-medium">{req.nama_toko}</TableCell>
                      <TableCell>
                        <div className="text-xs">NIK: <span className="font-medium">{req.nik}</span></div>
                        {req.npwp && <div className="text-xs mt-1">NPWP: <span className="font-medium">{req.npwp}</span></div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {req.foto_ktp ? (
                            <a href={req.foto_ktp} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-500 hover:underline">
                              <FileText className="mr-1 h-3 w-3" /> Lihat KTP
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">KTP -</span>
                          )}
                          {req.foto_npwp ? (
                            <a href={req.foto_npwp} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-500 hover:underline">
                              <FileText className="mr-1 h-3 w-3" /> Lihat NPWP
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">NPWP -</span>
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Manajemen User</CardTitle>
          <CardDescription>
            Kelola data user, kredit, dan status akun.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nama</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[150px]">Kredit (QR/API)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-[150px]">Terakhir Aktif</TableHead>
                  <TableHead className="text-right min-w-[200px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada user terdaftar.
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE).map((usr: any) => (
                    <TableRow key={usr.id}>
                      <TableCell className="font-medium whitespace-nowrap">{usr.nama}</TableCell>
                      <TableCell>{usr.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <span><Badge variant="outline" className="mr-1">QR</Badge> {usr.sisa_kredit}</span>
                          <span><Badge variant="outline" className="mr-1 border-primary text-primary">API</Badge> {usr.is_admin ? "∞" : usr.api_kredit}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {usr.is_banned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : usr.is_admin ? (
                          <Badge className="bg-purple-500">Admin</Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {usr.last_seen_at
                          ? new Date(usr.last_seen_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(usr);
                              setCreditAmount(0);
                              setIsCreditModalOpen(true);
                            }}
                            disabled={usr.is_admin}
                          >
                            Atur Kredit
                          </Button>
                          <Button
                            variant={usr.is_banned ? 'outline' : 'destructive'}
                            size="sm"
                            onClick={() => handleBanToggle(usr)}
                            disabled={usr.is_admin} // Don't ban admins
                          >
                            {usr.is_banned ? 'Unban' : 'Ban'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          {users && users.length > USERS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Menampilkan {(currentPage - 1) * USERS_PER_PAGE + 1} - {Math.min(currentPage * USERS_PER_PAGE, users.length)} dari {users.length} user
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(users.length / USERS_PER_PAGE), prev + 1))}
                  disabled={currentPage === Math.ceil(users.length / USERS_PER_PAGE)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Modal */}
      <Dialog open={isCreditModalOpen} onOpenChange={setIsCreditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Atur Kredit User</DialogTitle>
            <DialogDescription>
              Tambahkan atau kurangi (gunakan angka minus) kredit untuk {selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="creditType" className="text-right">Tipe Kredit</Label>
              <select
                id="creditType"
                value={creditType}
                onChange={(e) => setCreditType(e.target.value)}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="QR">Kredit QR</option>
                <option value="API">Kredit API</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Jumlah
              </Label>
              <Input
                id="amount"
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
            <div className="text-sm text-gray-500 text-right">
              Saldo saat ini: <span className="font-bold">{creditType === "API" ? selectedUser?.api_kredit : selectedUser?.sisa_kredit}</span>
              <br />
              Saldo setelah diubah: <span className="font-bold">{(creditType === "API" ? selectedUser?.api_kredit : selectedUser?.sisa_kredit) + creditAmount}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleAddCredits}
              disabled={addCreditsMutation.isPending || creditAmount === 0}
            >
              {addCreditsMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
