import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

export function AdminActivities() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: async () => {
      return await apiFetch("/admin/activities");
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2 mb-8">
      {/* Latest QR Generations */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Terbaru</CardTitle>
          <CardDescription>Aktivitas generate Trusted Label terakhir</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Memuat...</TableCell></TableRow>
                ) : data?.qrs?.length > 0 ? (
                  data.qrs.slice(0, 10).map((qr: any) => (
                    <TableRow key={qr.id}>
                      <TableCell className="text-xs">{qr.user_email}</TableCell>
                      <TableCell className="font-medium text-xs">
                        {qr.nama_produk}
                        <br/>
                        <span className="text-muted-foreground">{qr.kategori}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(qr.created_at).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Link
                          to="/scan/$id"
                          params={{ id: qr.id }}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
                        >
                          Cek QR <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center">Belum ada QR.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Latest Credit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Log Kredit Terbaru</CardTitle>
          <CardDescription>Aktivitas pemakaian atau top-up kredit user</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Memuat...</TableCell></TableRow>
                ) : data?.credit_logs?.length > 0 ? (
                  data.credit_logs.slice(0, 10).map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{log.user_email}</TableCell>
                      <TableCell>
                        <Badge variant={log.amount > 0 ? "default" : "destructive"} className="text-[10px]">
                          {log.amount > 0 ? `+${log.amount}` : log.amount} {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={log.description}>
                        {log.description}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} className="text-center">Belum ada aktivitas.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
