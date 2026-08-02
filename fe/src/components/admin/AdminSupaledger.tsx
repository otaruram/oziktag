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
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

export function AdminSupaledger() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: dataset, isLoading } = useQuery({
    queryKey: ["admin-dataset"],
    queryFn: async () => {
      return await apiFetch("/admin/dataset/export");
    },
  });

  const currentData = dataset ? dataset.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];
  const totalPages = dataset ? Math.ceil(dataset.length / itemsPerPage) : 1;

  const handleExportDataset = () => {
    if (!dataset || dataset.length === 0) {
      toast.error("Tidak ada data");
      return;
    }
    const headers = Object.keys(dataset[0]).join(",");
    const csvRows = dataset.map((row: any) =>
      Object.values(row)
        .map((val: any) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvString = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `supaledger_dataset_${new Date().getTime()}.csv`;
    link.click();
    toast.success("Dataset CSV diunduh!");
  };

  return (
    <Card className="mb-8 border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            SupaLedger Database
          </CardTitle>
          <CardDescription className="max-w-2xl mt-1">
            Data mentah finansial UMKM untuk pelatihan AI Model (SupaLedger).
          </CardDescription>
        </div>
        <Button onClick={handleExportDataset} className="flex items-center gap-2">
          <FileText className="h-4 w-4" /> Download CSV
        </Button>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto w-full rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead>Status KYC</TableHead>
                <TableHead>Harga Produksi</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Margin (%)</TableHead>
                <TableHead>Total Scan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">Memuat data...</TableCell>
                </TableRow>
              ) : currentData.length > 0 ? (
                currentData.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.kategori}</TableCell>
                    <TableCell>{row.kyc_status}</TableCell>
                    <TableCell>Rp {row.harga_produksi.toLocaleString("id-ID")}</TableCell>
                    <TableCell>Rp {row.harga_jual.toLocaleString("id-ID")}</TableCell>
                    <TableCell>{row.margin_persen}%</TableCell>
                    <TableCell>{row.total_scan}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">Belum ada data finansial.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
        </div>
      </CardContent>
    </Card>
  );
}
