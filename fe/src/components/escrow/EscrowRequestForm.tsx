import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface EscrowRequestFormProps {
  onSuccess?: () => void;
  defaultValues?: {
    nama_bank: string;
    nomor_rekening: string;
    nama_pemilik: string;
    link_umkm: string;
    catatan_produk: string;
    tujuan_escrow: string;
  };
}

export function EscrowRequestForm({ onSuccess, defaultValues }: EscrowRequestFormProps) {
  const [form, setForm] = useState({
    nama_bank: defaultValues?.nama_bank || "",
    nomor_rekening: defaultValues?.nomor_rekening || "",
    nama_pemilik: defaultValues?.nama_pemilik || "",
    link_umkm: defaultValues?.link_umkm || "",
    catatan_produk: defaultValues?.catatan_produk || "",
    tujuan_escrow: defaultValues?.tujuan_escrow || "",
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: typeof form) => apiFetch("/wallet/escrow-request", { 
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast.success("Permintaan akses berhasil dikirim!");
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal mengirim permintaan");
    }
  });

  const update = (field: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_bank || !form.nomor_rekening || !form.nama_pemilik || !form.catatan_produk || !form.tujuan_escrow) {
      return toast.error("Mohon lengkapi semua field yang wajib");
    }
    mutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Bank (Wajib)</Label>
        <Input 
          placeholder="BCA / Mandiri / BRI / dll" 
          value={form.nama_bank}
          onChange={(e) => update("nama_bank", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Nomor Rekening (Wajib)</Label>
        <Input 
          placeholder="0987654321" 
          type="number"
          value={form.nomor_rekening}
          onChange={(e) => update("nomor_rekening", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Nama Pemilik Rekening (Wajib)</Label>
        <Input 
          placeholder="Sesuai KTP / Buku Tabungan" 
          value={form.nama_pemilik}
          onChange={(e) => update("nama_pemilik", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Link UMKM / Media Sosial / Toko (Opsional)</Label>
        <Input 
          placeholder="https://instagram.com/toko_saya" 
          type="url"
          value={form.link_umkm}
          onChange={(e) => update("link_umkm", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Catatan / Jenis Produk (Wajib)</Label>
        <Textarea 
          placeholder="Jelaskan produk apa yang akan dijual melalui Escrow ini (misal: Sepatu Kulit Handmade)" 
          value={form.catatan_produk}
          onChange={(e) => update("catatan_produk", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Tujuan Penggunaan Escrow (Wajib)</Label>
        <Textarea 
          placeholder="Jelaskan mengapa Anda butuh fitur Escrow (misal: Pembeli dari luar kota minta sistem rekber aman)" 
          value={form.tujuan_escrow}
          onChange={(e) => update("tujuan_escrow", e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Kirim Pengajuan Akses
      </Button>
    </form>
  );
}
