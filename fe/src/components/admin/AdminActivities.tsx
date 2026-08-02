import { useState } from "react";
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
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

export function AdminActivities() {
  const [qrPage, setQrPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const itemsPerPage = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: async () => {
      return await apiFetch("/admin/activities");
    },
  });

  const qrs = data?.qrs || [];
  const currentQrs = qrs.slice((qrPage - 1) * itemsPerPage, qrPage * itemsPerPage);
  const qrTotalPages = Math.ceil(qrs.length / itemsPerPage) || 1;

  const logs = data?.credit_logs || [];
  const currentLogs = logs.slice((logPage - 1) * itemsPerPage, logPage * itemsPerPage);
  const logTotalPages = Math.ceil(logs.length / itemsPerPage) || 1;

  return (
    <div className="grid gap-6 lg:grid-cols-2 mb-8 min-w-0 w-full">
      {/* Latest QR Generations */}
      <Card className="min-w-0 w-full">
        <CardHeader>
          <CardTitle>QR Code Terbaru</CardTitle>
          <CardDescription>Aktivitas generate Trusted Label terakhir</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Produk</TableHead>
                  <TableHead className="whitespace-nowrap">Waktu</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Memuat...</TableCell></TableRow>
                ) : currentQrs.length > 0 ? (
                  currentQrs.map((qr: any) => (
                    <TableRow key={qr.id}>
                      <TableCell className="text-xs whitespace-nowrap">{qr.user_email}</TableCell>
                      <TableCell className="font-medium text-xs">
                        {qr.nama_produk}
                        <br/>
                        <span className="text-muted-foreground">{qr.kategori}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
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
          {qrTotalPages > 1 && (
            <Pagination className="mt-4 pb-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (qrPage > 1) setQrPage(p => p - 1);
                    }}
                    className={qrPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                <span className="text-xs text-muted-foreground mx-4">
                  {qrPage} / {qrTotalPages}
                </span>
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (qrPage < qrTotalPages) setQrPage(p => p + 1);
                    }}
                    className={qrPage === qrTotalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Latest Credit Logs */}
      <Card className="min-w-0 w-full">
        <CardHeader>
          <CardTitle>Log Kredit Terbaru</CardTitle>
          <CardDescription>Aktivitas pemakaian atau top-up kredit user</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Aksi</TableHead>
                  <TableHead className="whitespace-nowrap">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Memuat...</TableCell></TableRow>
                ) : currentLogs.length > 0 ? (
                  currentLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">{log.user_email}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={log.amount > 0 ? "default" : "destructive"} className="text-[10px]">
                          {log.amount > 0 ? `+${log.amount}` : log.amount} {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground min-w-[200px]" title={log.description}>
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
          {logTotalPages > 1 && (
            <Pagination className="mt-4 pb-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (logPage > 1) setLogPage(p => p - 1);
                    }}
                    className={logPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                <span className="text-xs text-muted-foreground mx-4">
                  {logPage} / {logTotalPages}
                </span>
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (logPage < logTotalPages) setLogPage(p => p + 1);
                    }}
                    className={logPage === logTotalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
