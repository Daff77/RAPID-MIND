import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  X,
  PhoneCall,
  MapPin,
  CheckCircle,
  Ambulance,
  Radio,
} from 'lucide-react';
import { LocationPost } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';

interface FloatingRedFlagButtonProps {
  currentVictimId?: string;
  currentVictimName?: string;
  currentLocation?: LocationPost;
  onEmergencyTriggered?: () => void;
}

export const FloatingRedFlagButton: React.FC<FloatingRedFlagButtonProps> = ({
  currentVictimId = 'VCT-EMERGENCY',
  currentVictimName = 'Penyintas Tanpa Nama',
  currentLocation = 'Posko A',
  onEmergencyTriggered,
}) => {
  const { addAssessment } = useAssessment();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gate1, setGate1] = useState(false);
  const [gate2, setGate2] = useState(false);
  const [gate3, setGate3] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [notes, setNotes] = useState('');

  const canSubmit = gate1 || gate2 || gate3;

  const handleOpen = () => {
    setIsModalOpen(true);
    setIsSubmitted(false);
  };

  const handleConfirmEmergency = () => {
    if (!canSubmit) return;

    const reasons: string[] = [];
    if (gate1) reasons.push('Ancaman bunuh diri / menyakiti orang lain');
    if (gate2) reasons.push('Psikosis akut / tidak merespons verbal');
    if (gate3) reasons.push('Kegawatdaruratan medis / cedera fisik berat');

    const now = new Date();
    const timeHours = String(now.getHours()).padStart(2, '0');
    const timeMins = String(now.getMinutes()).padStart(2, '0');

    // Create a T0-Suspect emergency record
    addAssessment({
      id: currentVictimId,
      timestamp: `${timeHours}:${timeMins}`,
      location: currentLocation,
      method: 'VERBAL',
      zone: 'RED',
      triageTier: 'T0',
      t0Status: 'T0-Suspect',
      score: 5,
      indicators: reasons,
      criticalTriggered: true,
      victimName: currentVictimName,
      recommendedAction:
        'T0 EMERGENCY (RED FLAG): Peringatan dini instan terkirim ke PSC 119 dan RS Rujukan. Dampingi tanpa jeda!',
      volunteerNotes: `RED FLAG TRIGGERED: ${notes || 'Kondisi kegawatdaruratan di lapangan'}. Lokasi GPS terkunci.`,
      volunteerId: 'VOL-RED-ALERT',
    });

    setIsSubmitted(true);
    if (onEmergencyTriggered) {
      onEmergencyTriggered();
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsSubmitted(false);
    setGate1(false);
    setGate2(false);
    setGate3(false);
    setNotes('');
  };

  return (
    <>
      {/* 🚨 ALWAYS-ON FLOATING SHORTCUT: RED FLAG EMERGENCY */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50 animate-bounce">
        <button
          type="button"
          onClick={handleOpen}
          className="group flex items-center gap-2 px-3.5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-2xl shadow-red-600/50 border-2 border-white transition-all transform hover:scale-105 active:scale-95 select-none"
          title="Tekan untuk kasus darurat T0 (Bunuh diri, Psikosis, Agitasi berat)"
        >
          <div className="relative">
            <ShieldAlert className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-300 rounded-full animate-ping"></span>
          </div>
          <span className="hidden sm:inline tracking-wider uppercase text-[11px]">
            Red Flag Emergency
          </span>
          <span className="sm:hidden font-bold">EMERGENCY</span>
        </button>
      </div>

      {/* MODAL: 3 VERIFICATION GATES & ALERT RUJUKAN DARURAT (SCREEN 4) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-2 border-red-600 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-red-600 flex items-center justify-center font-black shadow-xs">
                  🚨
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight uppercase">
                    Red Flag Emergency (T0)
                  </h3>
                  <span className="text-[11px] text-red-100 font-medium">
                    Protokol Kegawatdaruratan Psikiatri & Medis Bencana
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-red-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              {!isSubmitted ? (
                <>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-950">
                    <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-[11px]">
                        Konfirmasi "3 Verification Gates"
                      </span>
                      <p className="text-[11px] text-red-800">
                        Pilih minimal 1 indikator kondisi darurat di bawah ini untuk memicu sinyal T0-Suspect ke PSC 119 dan Faskes.
                      </p>
                    </div>
                  </div>

                  {/* Context Snapshot */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase">Penyintas</span>
                      <span className="font-bold text-slate-800 font-mono">{currentVictimId} · {currentVictimName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block font-semibold uppercase">Lokasi Posko</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-600" />
                        {currentLocation}
                      </span>
                    </div>
                  </div>

                  {/* 3 Verification Gate Checkboxes */}
                  <div className="space-y-2 pt-1">
                    <label
                      onClick={() => setGate1(!gate1)}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition ${
                        gate1
                          ? 'bg-red-50 border-red-500 text-red-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={gate1}
                        onChange={() => {}}
                        className="mt-0.5 accent-red-600 w-4 h-4 rounded shrink-0 pointer-events-none"
                      />
                      <div>
                        <span className="block text-xs font-bold text-red-900">
                          1. Ancaman Membahayakan Diri / Orang Lain
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                          Penyintas menunjukkan ideasi bunuh diri eksplisit, mencoba melukai diri, atau agresi fisik ekstrem.
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => setGate2(!gate2)}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition ${
                        gate2
                          ? 'bg-red-50 border-red-500 text-red-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={gate2}
                        onChange={() => {}}
                        className="mt-0.5 accent-red-600 w-4 h-4 rounded shrink-0 pointer-events-none"
                      />
                      <div>
                        <span className="block text-xs font-bold text-red-900">
                          2. Psikosis Akut / Mutisme & Unresponsive
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                          Halusinasi visual/auditori parah, disorientasi ruang akut, atau pembekuan syok (tidak merespons kontak).
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => setGate3(!gate3)}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition ${
                        gate3
                          ? 'bg-red-50 border-red-500 text-red-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={gate3}
                        onChange={() => {}}
                        className="mt-0.5 accent-red-600 w-4 h-4 rounded shrink-0 pointer-events-none"
                      />
                      <div>
                        <span className="block text-xs font-bold text-red-900">
                          3. Kegawatdaruratan Medis / Cedera Fisik Berat
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                          Sesak napas akut, kejang, perdarahan hebat, atau ketidakstabilan tanda vital yang menyertai distres psikologis.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Catatan Singkat Relawan di Lapangan (Opsional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Contoh: Korban mencoba berlari ke jurang reruntuhan, ditahan 2 warga..."
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  {/* Send Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmEmergency}
                      disabled={!canSubmit}
                      className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition uppercase tracking-wider"
                    >
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>Kirim Sinyal Darurat T0-Suspect</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-1">
                      Mengunci GPS Posko & Menyiagakan PSC 119 serta Rumah Sakit
                    </p>
                  </div>
                </>
              ) : (
                /* SCREEN 4: ALERT & NOTIFIKASI RUJUKAN DARURAT (T0 - EMERGENCY) */
                <div className="py-4 text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border-4 border-red-500/20">
                    <Ambulance className="w-8 h-8 animate-pulse" />
                  </div>

                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold text-xs uppercase tracking-wider">
                      Status Terkunci: T0-SUSPECT
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-2">
                      Sinyal Rujukan Darurat Berhasil Dikirim!
                    </h4>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      Notifikasi darurat dan koordinat <strong>{currentLocation}</strong> telah disiarkan ke <strong>PSC 119</strong>, <strong>Dinas Kesehatan</strong>, dan <strong>Rumah Sakit Rujukan</strong>.
                    </p>
                  </div>

                  {/* Immediate Action Checklist for Volunteer */}
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-left space-y-1.5 text-xs text-red-950">
                    <span className="font-bold block uppercase text-[11px] text-red-900">
                      Tindakan Wajib Relawan Sekarang:
                    </span>
                    <ul className="space-y-1 text-[11px] list-disc list-inside">
                      <li><strong>Dampingi tanpa jeda:</strong> Jangan pernah tinggalkan penyintas seorang diri.</li>
                      <li><strong>Amankan benda berbahaya:</strong> Jauhkan benda tajam, tali, atau tepian jurang reruntuhan.</li>
                      <li><strong>Siapkan HP:</strong> Tenaga medis Faskes/PSC 119 akan menghubungi Anda untuk verifikasi Tele-Emergency dalam 1-2 menit.</li>
                    </ul>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Kembali & Lanjutkan Pendampingan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
