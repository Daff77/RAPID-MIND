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
  PhoneCall,
  ArrowLeft,
  Ambulance,
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
    <div className="bg-white border-2 border-red-600 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in">
      {/* SCREEN 4 HEADER */}
      <div className="flex items-center justify-between border-b border-red-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shadow-md shadow-red-600/30 animate-pulse">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest block">
              SCREEN 4 — T0 EMERGENCY ALERT
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono font-black text-xs uppercase tracking-wider">
                T0 — SUSPECT
              </span>
              <span className="text-xs text-red-900 font-bold">
                Kegawatdaruratan Psikiatri / Medis
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. ALASAN EMERGENCY */}
      <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>Indikator Alasan Emergency Terdeteksi:</span>
        </div>
        <ul className="space-y-1.5 pl-6 list-disc text-red-950 font-medium">
          {emergencyReasons.length > 0 ? (
            emergencyReasons.map((reason, idx) => (
              <li key={idx} className="leading-snug">{reason}</li>
            ))
          ) : (
            <li>Pemicu kedaruratan Red Flag manual oleh relawan.</li>
          )}
        </ul>
        {volunteerNotes && (
          <div className="pt-1 text-[11px] text-red-800 italic border-t border-red-200">
            <strong>Catatan Lapangan:</strong> "{volunteerNotes}"
          </div>
        )}
      </div>

      {/* 2. IDENTITAS PENYINTAS & LOKASI */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Identitas Penyintas
          </span>
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>{survivorName} ({survivorAge} th, {survivorGender === 'L' ? 'Laki-laki' : 'Perempuan'})</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 block font-semibold">
            ID: {survivorId}
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Posko & Waktu Kejadian
          </span>
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            <span>{posko} (GPS Terkunci)</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{timestamp} WIB</span>
          </div>
        </div>
      </div>

      {/* 3. STATUS PENGIRIMAN DATA (JUJUR & REALISTIS) */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            Status Pengiriman Data:
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span>ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span>OFFLINE</span>
              </>
            )}
          </span>
        </div>

        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>T0 recorded locally (IndexedDB / Local Storage)</span>
          </div>

          {isOnline ? (
            <>
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Sent to Central Database & Hospital Queue (Role 2)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-[10px]">
                <Radio className="w-3 h-3 text-red-600 animate-pulse shrink-0" />
                <span>[Simulasi Prototype]: Notifikasi Siaga PSC 119 Diteruskan</span>
              </div>
            </>
          ) : (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Pending Synchronization (Perangkat Sedang Offline)</span>
              </div>
              <p className="text-[10px] text-amber-800 leading-snug">
                Data tersimpan di antrean perangkat. Sinyal server belum terkirim. Segera lakukan koordinasi manual via radio HT posko atau telepon seluler langsung ke PSC 119.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. INSTRUKSI WAJIB UNTUK RELAWAN */}
      <div className="p-4 bg-red-600 text-white rounded-2xl space-y-2 text-xs shadow-md shadow-red-600/20">
        <span className="font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-white" />
          <span>Instruksi Keselamatan Wajib Relawan (Standard Operating Procedure):</span>
        </span>
        <ul className="space-y-1.5 text-[11px] leading-relaxed pl-5 list-disc">
          <li>
            <strong>Dampingi tanpa jeda:</strong> Jangan pernah meninggalkan penyintas seorang diri dalam kondisi apapun.
          </li>
          <li>
            <strong>Amankan benda berbahaya:</strong> Singkirkan benda tajam, obat-obatan posko, tali, dan jauhkan dari tepian jurang/reruntuhan.
          </li>
          <li>
            <strong>Siagakan HP Relawan:</strong> Tenaga medis Faskes/PSC 119 akan menghubungi Anda untuk verifikasi <em>Tele-Emergency</em> visual dalam 1–2 menit.
          </li>
        </ul>
      </div>

      {/* ACTIONS */}
      <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:flex-1 h-11 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Pendampingan Penyintas</span>
        </button>

        {onGoToHospitalPortal && (
          <button
            type="button"
            onClick={onGoToHospitalPortal}
            className="w-full sm:w-auto px-4 h-11 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Ambulance className="w-3.5 h-3.5 text-red-600" />
            <span>Simulasi Dashboard Faskes →</span>
          </button>
        )}
      </div>
    </div>
  );
};
