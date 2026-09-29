import React from 'react';
import {
  ShieldAlert,
  MapPin,
  Clock,
  User,
  Radio,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Ambulance,
  X,
} from 'lucide-react';
import { LocationPost } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';

interface Screen4EmergencyAlertProps {
  survivorId: string;
  survivorName: string;
  survivorAge?: number | string;
  survivorGender?: 'L' | 'P';
  posko: LocationPost;
  timestamp: string;
  emergencyReasons: string[];
  volunteerNotes?: string;
  onClose: () => void;
  onGoToHospitalPortal?: () => void;
}

export const Screen4EmergencyAlert: React.FC<Screen4EmergencyAlertProps> = ({
  survivorId,
  survivorName,
  survivorAge = 35,
  survivorGender = 'P',
  posko,
  timestamp,
  emergencyReasons,
  volunteerNotes,
  onClose,
  onGoToHospitalPortal,
}) => {
  const { isOnline } = useAssessment();

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-alert-title"
      className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col w-full text-slate-800 animate-in fade-in"
    >
      {/* 1. TOP CRITICAL URGENCY ACCENT BAR */}
      <div className="h-1.5 bg-red-600 w-full shrink-0" />

      {/* 2. EMERGENCY HEADER (PROFESSIONAL CLINICAL STATUS) */}
      <div className="p-4 sm:p-6 pb-3 border-b border-slate-100 flex items-start justify-between gap-3 bg-white">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold text-xs uppercase tracking-wider">
                T0 — SUSPECT
              </span>
              <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                Kegawatdaruratan Lapangan
              </span>
            </div>
            <h2
              id="emergency-alert-title"
              className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1"
            >
              Peringatan Kedaruratan & Rujukan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Protokol Keselamatan Cepat & Notifikasi Siaga Faskes / PSC 119
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 3. BODY CONTENT (SCROLLABLE ON MOBILE) */}
      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-160px)]">
        {/* A. STATUS TRANSMISI DATA (JUJUR & REALISTIS) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Status Transmisi Data Lapangan
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ONLINE · TERKIRIM</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>OFFLINE · TERSIMPAN LOKAL</span>
                </>
              )}
            </span>
          </div>

          <div className="space-y-1.5 font-medium">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Data T0 tercatat aman di IndexedDB perangkat lokal</span>
            </div>

            {isOnline ? (
              <>
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Sinyal rujukan terkirim ke Antrean Faskes / RS (Role 2)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-[11px] pl-0.5">
                  <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse shrink-0" />
                  <span>Notifikasi siaga PSC 119 diteruskan (Standby verifikasi Tele-Emergency)</span>
                </div>
              </>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Sinkronisasi Server Tertunda (Perangkat Sedang Offline)</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed font-normal">
                  Data kedaruratan tersimpan aman di antrean lokal. Segera lakukan koordinasi manual via Radio HT Posko atau panggilan seluler langsung ke PSC 119.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* B. IDENTITAS PENYINTAS & LOKASI POSKO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Identitas Penyintas
            </span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{survivorName}</span>
            </div>
            <div className="text-slate-600 text-xs pl-8">
              {survivorAge} Tahun · {survivorGender === 'L' ? 'Laki-laki' : 'Perempuan'}
            </div>
            <div className="font-mono text-[11px] text-slate-500 font-semibold pl-8">
              ID: {survivorId}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Posko & Waktu Pelaporan
            </span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{posko}</span>
            </div>
            <div className="pl-8 flex items-center gap-2">
              <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                GPS Terkunci
              </span>
            </div>
            <div className="font-mono text-xs text-slate-600 flex items-center gap-1.5 pl-8">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{timestamp} WIB</span>
            </div>
          </div>
        </div>

        {/* C. ALASAN & TRIGGER EMERGENCY */}
        <div className="p-3.5 sm:p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-red-950 font-bold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Indikator Alasan Emergency Terdeteksi:</span>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-red-950 font-medium leading-relaxed">
            {emergencyReasons.length > 0 ? (
              emergencyReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))
            ) : (
              <li>Pemicu kedaruratan Red Flag manual oleh relawan lapangan.</li>
            )}
          </ul>
          {volunteerNotes && (
            <div className="pt-2 text-xs text-red-900 border-t border-red-200/80 leading-relaxed font-normal">
              <span className="font-bold">Catatan Lapangan:</span> "{volunteerNotes}"
            </div>
          )}
        </div>

        {/* D. STANDAR OPERASIONAL KESELAMATAN WAJIB RELAWAN (SOP LAPANGAN) */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Instruksi Keselamatan Wajib Relawan (SOP):
            </span>
          </div>
          <ol className="space-y-2 text-xs text-slate-200 leading-relaxed pl-4 list-decimal">
            <li>
              <strong className="text-white">Dampingi tanpa jeda:</strong> Jangan pernah meninggalkan penyintas seorang diri dalam kondisi dan alasan apapun.
            </li>
            <li>
              <strong className="text-white">Amankan bahaya sekitar:</strong> Singkirkan benda tajam, obat-obatan posko, tali, dan jauhkan penyintas dari tepian jurang atau reruntuhan.
            </li>
            <li>
              <strong className="text-white">Siagakan HP Relawan:</strong> Tenaga medis Faskes/PSC 119 akan menghubungi Anda untuk verifikasi visual <em>Tele-Emergency</em> dalam 1–2 menit.
            </li>
          </ol>
        </div>
      </div>

      {/* 4. ACTIONS (MOBILE-FIRST 52-56px TOUCH TARGETS) */}
      <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center gap-3 bg-slate-50/60">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:flex-1 min-h-[52px] px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-300 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Kembali ke Pendampingan Penyintas</span>
        </button>

        {onGoToHospitalPortal && (
          <button
            type="button"
            onClick={onGoToHospitalPortal}
            className="w-full sm:flex-1 min-h-[52px] px-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-red-600/25 transition"
          >
            <Ambulance className="w-4 h-4 text-white" />
            <span>Buka Antrean Rujukan Faskes →</span>
          </button>
        )}
      </div>
    </div>
  );
};
