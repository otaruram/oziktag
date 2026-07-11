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

export function AdminSupaledger() {
  const { data: dataset, isLoading } = useQuery({
    queryKey: ["admin-dataset"],
    queryFn: async () => {
      return await apiFetch("/admin/dataset/export");
    },
  });

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
              ) : dataset && dataset.length > 0 ? (
                dataset.slice(0, 10).map((row: any, i: number) => (
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
          {dataset && dataset.length > 10 && (
            <p className="text-xs text-center p-2 text-muted-foreground">Menampilkan 10 data terbaru. Download CSV untuk melihat semua data.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
