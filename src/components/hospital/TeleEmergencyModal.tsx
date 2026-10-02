import React from 'react';
import {
  X,
  ArrowDownRight,
  User,
  Power,
} from 'lucide-react';
import {
  ShieldExclamationIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import {
  IconPhoneCall,
  IconVideo,
  IconBroadcast,
  IconMapPin,
  IconHeartRateMonitor,
} from '@tabler/icons-react';
import { AssessmentRecord, TriageTier } from '../../types/assessment';

interface TeleEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRecord: AssessmentRecord | null;
  activeTier: TriageTier;
  callActive: boolean;
  onToggleCall: () => void;
  teleNotes: string;
  onTeleNotesChange: (notes: string) => void;
  onConfirmEmergency: (recordId: string) => void;
  onDowngradeStatus: (recordId: string, tier: 'T1' | 'T2') => void;
}

export const TeleEmergencyModal: React.FC<TeleEmergencyModalProps> = ({
  isOpen,
  onClose,
  activeRecord,
  activeTier,
  callActive,
  onToggleCall,
  teleNotes,
  onTeleNotesChange,
  onConfirmEmergency,
  onDowngradeStatus,
}) => {
  if (!isOpen || !activeRecord) return null;

  const rmId = activeRecord.rmCode || activeRecord.recordId || activeRecord.id;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-rose-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <IconVideo className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  Tele-Emergency & Validasi Klinis Sekunder
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-900/60 text-[10px] font-mono font-bold uppercase tracking-wider border border-white/20">
                  {activeTier} Kritis
                </span>
              </div>
              <p className="text-xs text-rose-100/90 mt-0.5">
                Koneksi audio-visual terenkripsi langsung ke relawan penapisan posko bencana.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-800 flex-1">
          {/* Audio/Video Call Screen Simulation */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 text-white relative min-h-[220px] flex flex-col justify-between p-4 shadow-inner">
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    callActive ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                  }`}
                />
                <span className="font-mono text-xs font-semibold">
                  {callActive ? 'SALURAN TERHUBUNG (128 kbps OPUS)' : 'STANDBY · KANAL AMAN POSKO'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg text-[10px] font-mono">
                <IconBroadcast className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kanal Medis #01</span>
              </div>
            </div>

            {/* Middle simulation graphic */}
            <div className="text-center py-6 space-y-2 z-10">
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mx-auto text-slate-400 shadow-lg">
                <User className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">{activeRecord.victimName || 'Penyintas'}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {rmId} · {activeRecord.location}
                </p>
              </div>
            </div>

            {/* Bottom Call Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 z-10">
              <span className="text-[11px] text-slate-400">
                Relawan: <strong>{activeRecord.volunteerId || 'Relawan Posko'}</strong>
              </span>
              <button
                type="button"
                onClick={onToggleCall}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                  callActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {callActive ? (
                  <>
                    <Power className="w-3.5 h-3.5" />
                    <span>Akhiri Panggilan</span>
                  </>
                ) : (
                  <>
                    <IconPhoneCall className="w-3.5 h-3.5" />
                    <span>Mulai Panggilan Tele-Medis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Clinical Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Keluhan / Transkrip Posko</span>
              <p className="italic text-slate-700 line-clamp-3">"{activeRecord.transcript || 'Tidak ada catatan.'}"</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Skor SRQ-20 & Risiko</span>
              <p className="font-black text-slate-900 text-sm">
                {activeRecord.score} / 20 <span className="text-xs font-normal text-slate-500">(Risiko: {activeRecord.riskFactorScore ?? 0})</span>
              </p>
              <span className="text-[10px] text-rose-600 font-semibold block">Indikasi Bahaya Akut Terdeteksi</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Lokasi & Armada PSC</span>
              <p className="font-bold text-slate-900">{activeRecord.location}</p>
              <p className="text-[10px] text-emerald-700 font-semibold">Armada Ambulans Terdekat: 4 Menit</p>
            </div>
          </div>

          {/* Doctor Assessment Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block text-xs">
              Catatan Observasi Dokter DPJP (Tele-Emergency):
            </label>
            <textarea
              value={teleNotes}
              onChange={(e) => onTeleNotesChange(e.target.value)}
              rows={3}
              placeholder="Tuliskan temuan hasil wawancara langsung dengan relawan dan kondisi kesadaran/afek penyintas..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition"
            />
          </div>

          {/* Clinical Decision Buttons: Confirm vs Downgrade */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
              Keputusan Triase Klinis Dokter Spesialis (DPJP):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Confirm T0 */}
              <button
                type="button"
                onClick={() => onConfirmEmergency(activeRecord.id)}
                className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-xs transition cursor-pointer text-center"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                  <span className="text-xs">Konfirmasi T0-Confirmed</span>
                </div>
                <span className="text-[10px] font-normal opacity-90">Kirim Armada Ambulans PSC 119</span>
              </button>

              {/* Option 2: Downgrade to T1 */}
              <button
                type="button"
                onClick={() => onDowngradeStatus(activeRecord.id, 'T1')}
                className="p-3.5 rounded-2xl bg-white hover:bg-orange-50 text-orange-950 font-bold border border-orange-300 shadow-2xs flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center"
              >
                <div className="flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-orange-600" />
                  <span className="text-xs">Downgrade ke T1</span>
                </div>
                <span className="text-[10px] font-normal text-orange-800">Risiko Tinggi Non-Kritis Posko</span>
              </button>

              {/* Option 3: Downgrade to T2 */}
              <button
                type="button"
                onClick={() => onDowngradeStatus(activeRecord.id, 'T2')}
                className="p-3.5 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 font-bold border border-amber-300 shadow-2xs flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center"
              >
                <div className="flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-amber-600" />
                  <span className="text-xs">Downgrade ke T2</span>
                </div>
                <span className="text-[10px] font-normal text-amber-800">Distres Sedang (Dampingi PFA)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
