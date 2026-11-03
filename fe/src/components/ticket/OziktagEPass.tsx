import { useEffect, useState } from 'react';
import * as QRCode from 'qrcode';
import { Ticket } from '@/types/ticketing';
import { TIER_CONFIGS, EVENT_DETAILS, computeEscrowBreakdown } from '@/lib/ticketing-store';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  User,
  Copy,
  Download,
  CheckCircle2,
  ScanLine,
  Lock,
  Wallet,
} from 'lucide-react';

interface OziktagEPassProps {
  ticket: Ticket;
  onSimulateScanAtGate?: (ticket: Ticket) => void;
}

export function OziktagEPass({ ticket, onSimulateScanAtGate }: OziktagEPassProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const generateCode = async () => {
      try {
        const url = await QRCode.toDataURL(ticket.qrPayload || ticket.id, {
          width: 512,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
        if (isMounted) setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate Oziktag E-Pass QR', err);
      }
    };
    generateCode();
    return () => {
      isMounted = false;
    };
  }, [ticket.qrPayload, ticket.id]);

  const tierCfg = TIER_CONFIGS[ticket.seatTier];
  const { netAmount, escrowFee } = computeEscrowBreakdown(ticket.price);
  const net = ticket.netAmount ?? netAmount;
  const fee = ticket.escrowFee ?? escrowFee;
  const escrowState =
    ticket.escrowStatus || (ticket.status === 'USED' ? 'RELEASED' : ticket.status === 'REVOKED' ? 'REFUNDED' : 'HELD');

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(ticket.qrPayload);
    toast.success('Payload Kriptografi HMAC-SHA256 disalin ke clipboard!', {
      description: 'Tempelkan di Gate Scanner untuk menguji validasi & pencairan Escrow.',
    });
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Oziktag-EPass-${ticket.seatId}-${ticket.id}.png`;
    link.click();
    toast.success(`QR E-Pass Kursi ${ticket.seatId} berhasil diunduh!`);
  };

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      {/* Top Navy Brand Header */}
      <div className="bg-slate-900 px-6 py-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/30">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight">OZIKTAG E-PASS</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                HMAC-SHA256 SIGNED
              </span>
            </div>
            <p className="text-xs text-slate-400">{EVENT_DETAILS.name}</p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {ticket.status === 'VALID' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold text-white shadow-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              VALID • UNUSED
            </span>
          )}
          {ticket.status === 'USED' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-extrabold text-white shadow-xs">
              <Clock className="h-3.5 w-3.5" />
              CHECKED-IN (USED)
            </span>
          )}
          {ticket.status === 'REVOKED' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-extrabold text-white shadow-xs">
              REVOKED / REFUNDED
            </span>
          )}
        </div>
      </div>

      {/* Main Ticket Body */}
      <div className="grid gap-6 p-6 sm:grid-cols-5 sm:p-8 items-center">
        {/* Left: Details (3 cols) */}
        <div className="sm:col-span-3 space-y-4">
          <div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
              {tierCfg?.label || ticket.seatTier}
            </span>
            <h3 className="mt-2 text-2xl font-extrabold text-slate-900">
              Kursi {ticket.seatId}
            </h3>
            <p className="text-xs font-mono text-slate-500">Pass ID: {ticket.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Pemegang Pass</p>
                <p className="font-bold text-slate-800">{ticket.attendee.fullName}</p>
                <p className="text-[11px] text-slate-500">{ticket.attendee.institution}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Lokasi & Gate</p>
                <p className="font-bold text-slate-800">{ticket.event.venue}</p>
                <p className="text-[11px] text-slate-500">{ticket.event.gate}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 col-span-2 pt-2 border-t border-slate-200/60">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Jadwal Acara</p>
                <p className="font-bold text-slate-800">
                  {ticket.event.date} • {ticket.event.time}
                </p>
              </div>
            </div>
          </div>

          {/* Escrow Status Box */}
          <div
            className={`rounded-2xl border p-3.5 text-xs ${
              escrowState === 'RELEASED'
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                : escrowState === 'REFUNDED'
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-amber-200 bg-amber-50/80 text-amber-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span className="flex items-center gap-1.5">
                {escrowState === 'RELEASED' ? (
                  <Wallet className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Lock className="h-4 w-4 text-amber-600" />
                )}
                Status Dana Oziktag Escrow:
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase shadow-2xs">
                {escrowState}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {escrowState === 'HELD' &&
                `Dana bersih Rp ${net.toLocaleString('id-ID')} (Fee Rp ${fee.toLocaleString('id-ID')}) sedang ditahan aman di Oziktag Escrow. Akan cair otomatis ke Dompet Penghasilan Organizer begitu QR di-scan di Gate.`}
              {escrowState === 'RELEASED' &&
                `Check-in terverifikasi! Dana bersih Rp ${net.toLocaleString('id-ID')} telah dicairkan otomatis ke Dompet Penghasilan Organizer.`}
              {escrowState === 'REFUNDED' &&
                `Tiket dibatalkan. Dana Rp ${ticket.price.toLocaleString('id-ID')} telah dikembalikan ke pembeli.`}
            </p>
          </div>
        </div>

        {/* Right: Cryptographic QR Pass (2 cols) */}
        <div className="sm:col-span-2 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="relative rounded-2xl border-2 border-slate-900 bg-white p-3 shadow-sm">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Pass ${ticket.id}`}
                className="h-44 w-44 object-contain"
              />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <p className="mt-2.5 font-mono text-[10px] font-bold text-slate-500 break-all">
            SIG: {ticket.cryptographicHash}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 w-full">
            <button
              type="button"
              onClick={handleCopyPayload}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <Copy className="h-3.5 w-3.5" /> Salin QR
            </button>
            <button
              type="button"
              onClick={handleDownloadQR}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <Download className="h-3.5 w-3.5" /> Unduh PNG
            </button>
          </div>

          {onSimulateScanAtGate && (
            <button
              type="button"
              onClick={() => onSimulateScanAtGate(ticket)}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-700 transition"
            >
              <ScanLine className="h-4 w-4" />
              Simulasikan Scan di Gate Panitia
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

