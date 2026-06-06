import { createFileRoute } from '@tanstack/react-router';
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
import { Users, Activity, ShieldAlert, CreditCard } from 'lucide-react';

export const Route = createFileRoute('/admin')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

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

  // Mutations
  const addCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const data = await apiFetch('/admin/credits/add', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, amount: amount }),
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
    addCreditsMutation.mutate({ userId: selectedUser.id, amount: creditAmount });
  };

  const handleBanToggle = (usr: any) => {
    banUserMutation.mutate({ userId: usr.id, banned: !usr.is_banned });
  };

  return (
    <div className="container mx-auto py-8">
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Manajemen User</CardTitle>
          <CardDescription>
            Kelola data user, kredit, dan status akun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Kredit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terakhir Aktif</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Belum ada user terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((usr: any) => (
                  <TableRow key={usr.id}>
                    <TableCell className="font-medium">{usr.nama}</TableCell>
                    <TableCell>{usr.email}</TableCell>
                    <TableCell>{usr.sisa_kredit}</TableCell>
                    <TableCell>
                      {usr.is_banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : usr.is_admin ? (
                        <Badge className="bg-purple-500">Admin</Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {usr.last_seen_at
                        ? new Date(usr.last_seen_at).toLocaleString('id-ID')
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
              Saldo saat ini: <span className="font-bold">{selectedUser?.sisa_kredit}</span>
              <br />
              Saldo setelah diubah: <span className="font-bold">{selectedUser?.sisa_kredit + creditAmount}</span>
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
