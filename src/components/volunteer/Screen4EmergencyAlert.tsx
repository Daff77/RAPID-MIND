import React, { useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  UserIcon,
} from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';
import {
  IconAmbulance,
  IconMapPin,
  IconBroadcast,
  IconWifi,
  IconWifiOff,
  IconMessage,
  IconAlertOctagon,
} from '@tabler/icons-react';
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
  // 1. Tactile Haptic Alert (Tier 3 Physical Feedback)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([250, 100, 250, 100, 450]);
      } catch {
        // Ignore vibration error
      }
    }
  }, []);

  // Tier 2: SMS Gateway Emergency Fallback URI (Sinyal 2G/GSM)
  const smsEmergencyPayload = `[SOS T0 RAPID-MIND] NIK/ID: ${survivorId}, Nama: ${survivorName}, Posko: ${posko}, Waktu: ${timestamp}, Alasan: ${emergencyReasons.join('; ')}`;
  const smsFallbackUri = `sms:119?body=${encodeURIComponent(smsEmergencyPayload)}`;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-alert-title"
      className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full text-slate-800 animate-in fade-in"
    >
      {/* 1. TOP CRITICAL URGENCY ACCENT BAR */}
      <div className="h-1.5 bg-red-600 w-full shrink-0" />

      {/* 2. EMERGENCY HEADER (PROFESSIONAL CLINICAL STATUS) */}
      <div className="p-4 sm:p-6 pb-3 border-b border-slate-100 flex items-start justify-between gap-3 bg-white">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldExclamationIcon className="w-6 h-6 text-red-600" />
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
              Protokol Keselamatan Cepat & Eskalasi Siaga PSC 119
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. BODY CONTENT (SCROLLABLE ON MOBILE) */}
      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-160px)]">
        {/* A. 3-TIER FALLBACK STRATEGY UNTUK TRANSMISI T0 (OFFLINE-FIRST) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200 pb-2.5">
            <div>
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Mekanisme 3-Tier Fallback Transmisi T0
              </span>
              <span className="text-[10px] text-slate-500">Offline-First Resilient Architecture</span>
            </div>
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
                  <IconWifi className="w-3.5 h-3.5 text-emerald-600" stroke={2.5} />
                  <span>ONLINE · TIER 1 AKTIF</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <IconWifiOff className="w-3.5 h-3.5 text-amber-600" stroke={2.5} />
                  <span>OFFLINE · TIER 2 & 3 SIAGA</span>
                </>
              )}
            </span>
          </div>

          <div className="space-y-2.5 font-medium">
            {/* Tier 1 Status */}
            <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${isOnline ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-100/70 border-slate-200 text-slate-500'}`}>
              <CheckCircleIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold block text-[11px]">Tier 1: WebSockets & Push Notification (Online)</span>
                <span className="text-[11px] block mt-0.5 opacity-90">
                  {isOnline
                    ? 'Sinyal darurat T0 telah diteruskan instan (<1 detik) ke Dashboard Faskes & PSC 119.'
                    : 'Koneksi data internet tidak terdeteksi. Sistem beralih ke strategi fallback Tier 2 & Tier 3.'}
                </span>
              </div>
            </div>

            {/* Tier 2 Status & SMS Trigger */}
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-950 space-y-2">
              <div className="flex items-start gap-2.5">
                <IconBroadcast className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" stroke={2} />
                <div className="flex-1 min-w-0">
                  <span className="font-bold block text-[11px]">Tier 2: Sinyal Seluler 2G/GSM Auto-Fallback (SMS Gateway)</span>
                  <span className="text-[11px] block mt-0.5 text-blue-900 leading-relaxed">
                    Jika internet mati namun HP relawan menangkap sinyal seluler biasa (2G/GSM), kirim SMS darurat terenkripsi berisi NIK, Red Flag, dan Titik GPS ke PSC 119.
                  </span>
                </div>
              </div>
              <a
                href={smsFallbackUri}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <IconMessage className="w-4 h-4 text-white" stroke={2} />
                <span>Kirim Format Darurat SMS Gateway ke 119</span>
                <PaperAirplaneIcon className="w-3.5 h-3.5 text-white/80" />
              </a>
            </div>

            {/* Tier 3 Status (IndexedDB, Local Alert & Background Sync) */}
            <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 space-y-1.5">
              <div className="flex items-start gap-2.5">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-[11px]">Tier 3: Sinyal Mati Total (Blank Spot) — Local Alert & Background Sync</span>
                  <span className="text-[11px] block mt-0.5 text-amber-900 leading-relaxed">
                    Data T0 dikunci di urutan teratas memori lokal (IndexedDB). Begitu HP relawan menangkap secuil sinyal, Service Worker akan otomatis menyinkronkan data tanpa perlu input ulang.
                  </span>
                </div>
              </div>
              <div className="p-2 bg-amber-100/70 rounded-lg text-[11px] text-amber-950 font-bold border border-amber-300 flex items-center gap-1.5">
                <span>⚠️ INSTRUKSI FISIK:</span>
                <span>Bawa & dampingi penyintas secara langsung ke Tenda Medis Posko Terdekat!</span>
              </div>
            </div>
          </div>
        </div>

        {/* B. IDENTITAS PENYINTAS & LOKASI POSKO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Identitas Penyintas
            </span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
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

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Posko & Waktu Pelaporan
            </span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <IconMapPin className="w-3.5 h-3.5 text-red-700" stroke={2} />
              </div>
              <span className="truncate">{posko}</span>
            </div>
            <div className="pl-8 flex items-center gap-2">
              <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                GPS Terkunci
              </span>
            </div>
            <div className="font-mono text-xs text-slate-600 flex items-center gap-1.5 pl-8">
              <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{timestamp} WIB</span>
            </div>
          </div>
        </div>

        {/* C. ALASAN & TRIGGER EMERGENCY */}
        <div className="p-3.5 sm:p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-red-950 font-bold">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
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
        <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200/90 rounded-xl space-y-2.5">
          <div className="flex items-center gap-2 text-amber-950">
            <ShieldExclamationIcon className="w-4 h-4 shrink-0 text-amber-700" />
            <span className="font-bold text-xs uppercase tracking-wider text-amber-950">
              Instruksi Keselamatan Wajib Relawan (SOP):
            </span>
          </div>
          <ol className="space-y-2 text-xs text-slate-800 leading-relaxed pl-4 list-decimal">
            <li>
              <strong className="text-slate-950 font-bold">Dampingi tanpa jeda:</strong> Jangan pernah meninggalkan penyintas seorang diri dalam kondisi dan alasan apapun.
            </li>
            <li>
              <strong className="text-slate-950 font-bold">Amankan bahaya sekitar:</strong> Singkirkan benda tajam, obat-obatan posko, tali, dan jauhkan penyintas dari tepian jurang atau reruntuhan.
            </li>
            <li>
              <strong className="text-slate-950 font-bold">Siagakan HP Relawan:</strong> Tenaga medis Faskes/PSC 119 akan menghubungi Anda untuk verifikasi visual <em className="font-semibold text-slate-900 not-italic">Tele-Emergency</em> dalam 1–2 menit.
            </li>
          </ol>
        </div>
      </div>

      {/* 4. ACTIONS (MOBILE-FIRST 56px TOUCH TARGETS) */}
      <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center gap-3 bg-slate-50/60">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:flex-1 min-h-[56px] px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-300 transition"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Kembali ke Pendampingan Penyintas</span>
        </button>

        {onGoToHospitalPortal && (
          <button
            type="button"
            onClick={onGoToHospitalPortal}
            className="w-full sm:flex-1 min-h-[56px] px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-red-600/25 transition"
          >
            <IconAmbulance className="w-5 h-5 text-white" stroke={2} />
            <span>Buka Antrean Rujukan Faskes →</span>
          </button>
        )}
      </div>
    </div>
  );
};
