import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
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
import { Link } from "@tanstack/react-router";
import { ExternalLink, MapPin } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PACKED: { label: "Dikemas", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  IN_TRANSIT: { label: "Dalam Perjalanan", color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  DELIVERED: { label: "Diterima", color: "bg-green-500/15 text-green-600 border-green-500/20" },
};

export function AdminTracking() {
  const [page, setPage] = useState(1);

  const { data: activities, isLoading } = useQuery({
    queryKey: ["admin-tracking", page],
    queryFn: async () => {
      return await apiFetch(`/admin/tracking-activities?page=${page}`);
    },
  });

  return (
    <Card className="mb-8 w-full min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Aktivitas Tracking Lite
        </CardTitle>
        <CardDescription>Daftar semua resi digital tracking yang dibuat oleh UMKM</CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">UMKM (Seller)</TableHead>
                <TableHead className="whitespace-nowrap">Produk</TableHead>
                <TableHead className="whitespace-nowrap">Status Terakhir</TableHead>
                <TableHead className="whitespace-nowrap">Waktu Dibuat</TableHead>
                <TableHead className="whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Memuat...</TableCell></TableRow>
              ) : activities?.length > 0 ? (
                activities.map((t: any) => {
                  const statusInfo = STATUS_MAP[t.current_status] || STATUS_MAP.PACKED;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">
                        <div className="font-medium whitespace-nowrap">{t.seller_name}</div>
                        <div className="text-muted-foreground whitespace-nowrap">{t.seller_email}</div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {t.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusInfo.color} whitespace-nowrap`}>
                          {statusInfo.label}
                        </span>
                        <div className="text-muted-foreground mt-1 truncate max-w-[150px]">{t.last_update}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.created_at).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Link
                          to="/tracking/$id"
                          params={{ id: t.id }}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
                        >
                          Cek URL <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Belum ada aktivitas Tracking.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {activities?.length > 0 && (
          <Pagination className="mt-4 pb-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(p => p - 1);
                  }}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <span className="text-xs text-muted-foreground mx-4">
                Halaman {page}
              </span>
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (activities.length === 10) setPage(p => p + 1);
                  }}
                  className={activities.length < 10 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}
