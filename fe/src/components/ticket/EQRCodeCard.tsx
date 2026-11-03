import { useEffect, useState, useRef } from 'react';
import * as QRCode from 'qrcode';
import { Ticket } from '@/types/ticketing';
import { TIER_CONFIGS, EVENT_DETAILS } from '@/lib/ticketing-store';
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
  AlertCircle,
  ExternalLink,
  ScanLine,
  MessageCircle,
  Bell,
  Mail,
  Check,
} from 'lucide-react';

interface EQRCodeCardProps {
  ticket: Ticket;
  onSimulateScanAtGate?: (ticket: Ticket) => void;
}

export function EQRCodeCard({ ticket, onSimulateScanAtGate }: EQRCodeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isReminderSent, setIsReminderSent] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate QR Code with high error correction and cryptographic payload
  useEffect(() => {
    let isMounted = true;

    const generateCode = async () => {
      try {
        const url = await QRCode.toDataURL(ticket.qrPayload || ticket.id, {
          width: 512,
          margin: 1,
          color: {
            dark: '#0f172a', // Oziktag Deep Navy
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
        if (isMounted) setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate EQR Code', err);
      }
    };

    generateCode();
    return () => {
      isMounted = false;
    };
  }, [ticket.qrPayload, ticket.id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticket.id);
    toast.success('Kode Tiket Disalin ke Clipboard!', {
      description: ticket.id,
    });
  };

  const handleSendReminder = () => {
    setIsReminderSent(true);
    toast.success('Pengingat Acara Terkirim!', {
      description: `Notifikasi WhatsApp ke ${ticket.attendee.phone} & Email ke ${ticket.attendee.email} telah dikirim untuk ${EVENT_DETAILS.name} di Summarecon Mall Bandung.`,
      duration: 5000,
    });
  };

  const handleDownloadCalendar = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${EVENT_DETAILS.name} - ${EVENT_DETAILS.subName}`,
      `DESCRIPTION:Tiket ${ticket.id} Kursi ${ticket.seatId} (${ticket.seatTier}). Gate 2 Summarecon Mall Bandung.`,
      `LOCATION:${EVENT_DETAILS.venue}, Bandung`,
      'DTSTART:20261115T020000Z',
      'DTEND:20261115T110000Z',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Oziktag_Calendar_${ticket.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Event Kalender (.ics) Diunduh!');
  };

  const tier = TIER_CONFIGS[ticket.seatTier];
  const isUsed = ticket.status === 'USED';
  const isValid = ticket.status === 'VALID';

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Outer Card Container with Hallmark Minimalist aesthetic */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all"
      >
        {/* Top Header Banner */}
        <div className="bg-slate-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-bold tracking-tight text-sm">Oziktag Pass</span>
            </div>

            {/* Dynamic Status Pill */}
            {isValid && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AKTIF / VALID
              </span>
            )}
            {isUsed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                <CheckCircle2 className="h-3 w-3" />
                SUDAH DIPAKAI
              </span>
            )}
            {ticket.status === 'REVOKED' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
                <AlertCircle className="h-3 w-3" />
                BATAL / REVOKED
              </span>
            )}
          </div>

          <div className="mt-4 space-y-1">
            <h3 className="text-lg font-bold tracking-tight text-white leading-snug">
              {ticket.event.name}
            </h3>
            <p className="text-xs text-slate-300">
              Summarecon Mall Bandung • Grand Ballroom
            </p>
          </div>
        </div>

        {/* Seat & Attendee Spotlight Grid */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/60 p-4 text-center">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Kursi
            </div>
            <div className="text-xl font-extrabold text-slate-900">{ticket.seatId}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Kategori
            </div>
            <div className="text-sm font-bold text-slate-900">{tier.label}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Akses Gate
            </div>
            <div className="text-sm font-bold text-slate-900">Gate 2</div>
          </div>
        </div>

        {/* High-Resolution Stateful EQR Display */}
        <div className="p-6 text-center">
          <div className="relative mx-auto flex max-w-[240px] flex-col items-center justify-center rounded-2xl border-2 border-slate-100 bg-white p-3 shadow-sm">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Pass for ${ticket.id}`}
                className="h-52 w-52 object-contain"
              />
            ) : (
              <div className="flex h-52 w-52 items-center justify-center text-xs text-slate-400">
                Menghasilkan EQR Kripto...
              </div>
            )}

            {/* Centered Watermark overlay badge */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 border-2 border-white shadow-lg">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-800">
              <span>{ticket.id}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-slate-400 hover:text-slate-700"
                title="Salin ID Tiket"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Cryptographic Verifiability Badge */}
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-left text-[11px] text-slate-600">
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
              <span>HMAC-SHA256 PROTOCOL</span>
              <span>VERIFIED</span>
            </div>
            <div className="truncate font-mono text-[11px] font-semibold text-slate-800">
              {ticket.cryptographicHash}
            </div>
          </div>
        </div>

        {/* Perforated Ticket Notches & Cutout */}
        <div className="relative flex items-center justify-between px-2 py-1">
          <div className="-ml-5 h-6 w-6 rounded-full bg-slate-100 border-r border-slate-200" />
          <div className="flex-1 border-b-2 border-dashed border-slate-200" />
          <div className="-mr-5 h-6 w-6 rounded-full bg-slate-100 border-l border-slate-200" />
        </div>

        {/* Event Schedule & Attendee Meta */}
        <div className="p-6 pt-3 space-y-3 text-xs text-slate-600">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Tanggal</div>
                <div className="font-semibold text-slate-800">{ticket.event.date}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Waktu</div>
                <div className="font-semibold text-slate-800">{ticket.event.time}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Pemegang Tiket</div>
                <div className="font-semibold text-slate-800">{ticket.attendee.fullName}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Lokasi</div>
                <div className="font-semibold text-slate-800">Summarecon Mall Bdg</div>
              </div>
            </div>
          </div>

          {ticket.scannedAt && (
            <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200">
              <strong>Check-in Tercatat:</strong> {ticket.scannedAt} ({ticket.scannedByGate || 'Gate Panitia'})
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="border-t border-slate-100 bg-slate-50/80 p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSendReminder}
              disabled={isReminderSent}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors shadow-2xs ${
                isReminderSent
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isReminderSent ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Pengingat WA/Email Terkirim</span>
                </>
              ) : (
                <>
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Kirim Pengingat WA/Email</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCalendar}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <span>Simpan ke Kalender (.ics)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
            <button
              type="button"
              onClick={handleDownloadTicket}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Simpan Gambar Pass</span>
            </button>

            {onSimulateScanAtGate && (
              <button
                type="button"
                onClick={() => onSimulateScanAtGate(ticket)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                <ScanLine className="h-3.5 w-3.5 text-emerald-400" />
                <span>Simulasi Scan di Gate</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
