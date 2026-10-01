import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  X,
  MapPin,
  Radio,
} from 'lucide-react';
import { LocationPost } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';
import { Screen4EmergencyAlert } from './Screen4EmergencyAlert';

interface FloatingRedFlagButtonProps {
  currentVictimId?: string;
  currentVictimName?: string;
  currentLocation?: LocationPost;
  onEmergencyTriggered?: () => void;
}

export const FloatingRedFlagButton: React.FC<FloatingRedFlagButtonProps> = ({
  currentVictimId = 'VCT-EMERGENCY',
  currentVictimName = 'Penyintas Lapangan',
  currentLocation = 'Posko A',
  onEmergencyTriggered,
}) => {
  const { addAssessment } = useAssessment();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 4 Specific Emergency Protocols from Full Paper
  const [indicator1, setIndicator1] = useState(false); // Suicidal & Self-Harm
  const [indicator2, setIndicator2] = useState(false); // Acute Psychosis & Dissociation
  const [indicator3, setIndicator3] = useState(false); // Severe Agitation & Panic
  const [indicator4, setIndicator4] = useState(false); // Acute Somatic / Medical Crisis

  // Survivor identity confirmation
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [customName, setCustomName] = useState(currentVictimName);
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emergencyReasons, setEmergencyReasons] = useState<string[]>([]);
  const [recordedTimestamp, setRecordedTimestamp] = useState<string>('');

  const canSubmit = indicator1 || indicator2 || indicator3 || indicator4;

  const handleOpen = () => {
    setIsModalOpen(true);
    setIsSubmitted(false);
    setCustomName(currentVictimName);
    setIsAnonymous(false);
  };

  const handleConfirmEmergency = () => {
    if (!canSubmit) return;

    const reasons: string[] = [];
    if (indicator1) {
      reasons.push(
        '1. Risiko Keamanan Jiwa Spesifik: Ideasi/ungkapan ingin mati (SRQ #17) atau tindakan menyakiti diri aktif'
      );
    }
    if (indicator2) {
      reasons.push(
        '2. Gejala Psikotik Akut Bencana: Halusinasi visual/auditorik, waham paranoid, atau disosiasi/mutisme katatonia'
      );
    }
    if (indicator3) {
      reasons.push(
        '3. Perilaku Agitasi & Gangguan Kendali Impuls: Amuk/agresi fisik merusak atau serangan panik ekstrem tak terkendali'
      );
    }
    if (indicator4) {
      reasons.push(
        '4. Kegawatdaruratan Medis & Somatik Akut: Penurunan kesadaran/pingsan berulang, hiperventilasi spasme kram, atau nyeri dada psikosomatik berat'
      );
    }

    const now = new Date();
    const timeHours = String(now.getHours()).padStart(2, '0');
    const timeMins = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${timeHours}:${timeMins}`;

    setEmergencyReasons(reasons);
    setRecordedTimestamp(timeString);

    const displayName = isAnonymous ? 'Penyintas Tanpa Nama (Krisis Akut)' : customName.trim() || currentVictimName;

    // Create a T0-Suspect emergency record (Bypassing Score Engine)
    addAssessment({
      id: currentVictimId,
      victimId: currentVictimId,
      timestamp: timeString,
      location: currentLocation,
      method: 'VERBAL',
      zone: 'RED',
      triageTier: 'T0',
      t0Status: 'T0-Suspect',
      score: 5,
      indicators: reasons,
      criticalTriggered: true,
      victimName: displayName,
      recommendedAction:
        'T0 EMERGENCY (RED FLAG OVERRIDE): Sinyal SOS darurat aktif ke PSC 119 dan Faskes. Dampingi fisik tanpa jeda (JANGAN ditinggalkan sendirian), amankan benda tajam/bahaya, dan siagakan panggilan Tele-Emergency.',
      volunteerNotes: `RED FLAG TRIGGERED (T0-SUSPECT): ${notes || 'Kondisi kegawatdaruratan psikiatri/medis di lapangan'}. Lokasi GPS Posko terkunci di ${currentLocation}.`,
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
    setIndicator1(false);
    setIndicator2(false);
    setIndicator3(false);
    setIndicator4(false);
    setNotes('');
  };

  return (
    <>
      {/* 🚨 COMPACT TACTICAL EMERGENCY CONTROL: RED FLAG T0 */}
      <aside
        aria-label="Kontrol Darurat Lapangan"
        className="fixed z-40 right-3.5 sm:right-6 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 pointer-events-auto"
      >
        <button
          type="button"
          onClick={handleOpen}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs shadow-lg shadow-red-950/25 border-2 border-white transition-all transform hover:scale-[1.02] select-none min-h-[52px] cursor-pointer"
          title="Tekan untuk kasus darurat T0 (Ideasi Bunuh Diri, Psikosis, Agitasi, Krisis Medis)"
        >
          <ShieldAlert className="w-5 h-5 text-white shrink-0" />
          <span className="tracking-wide uppercase text-xs font-black">
            SOS T0
          </span>
          <span className="hidden sm:inline text-[11px] font-bold text-red-100 pl-0.5">
            · Emergency
          </span>
        </button>
      </aside>

      {/* MODAL: PROTOKOL EMERGENCY RED FLAG T0 (SCREEN 4) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          {!isSubmitted ? (
            <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold text-[10px] tracking-wide">
                        T0 — PROTOKOL
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Sinyal Red Flag Darurat
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5">
                      Verifikasi Kedaruratan Lapangan
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
                <>
                  {/* Step Aksi Relawan Guidance Alert */}
                  <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-1.5 text-red-950">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                      <strong className="text-xs font-bold">
                        Instruksi Wajib Garda Depan (Protokol T0):
                      </strong>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-red-900 leading-relaxed pl-1">
                      <li><strong>Tetap Tenang & Mendampingi:</strong> JANGAN meninggalkan penyintas sendirian secara fisik.</li>
                      <li><strong>Konfirmasi Sinyal:</strong> Pilih minimal 1 indikator bahaya di bawah dan kirim.</li>
                      <li><strong>Tunggu Bantuan:</strong> Sinyal T0-Suspect beserta koordinat GPS Posko langsung terkirim ke Tim Medis/PSC 119.</li>
                    </ol>
                  </div>

                  {/* Context Snapshot & Identity Selection */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                          Penyintas Terpilih
                        </span>
                        <span className="font-bold text-slate-800 font-mono">
                          {currentVictimId} · {isAnonymous ? 'Tanpa Nama' : customName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                          Lokasi Posko
                        </span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 justify-end">
                          <MapPin className="w-3 h-3 text-red-600" />
                          {currentLocation}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="accent-red-600 w-4 h-4 rounded"
                        />
                        <span>Centang jika <strong>"Tanpa Nama"</strong> (Penyintas belum diketahui identitasnya)</span>
                      </label>
                    </div>
                  </div>

                  {/* 4 Clinical Indicators from Full Paper */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 block text-xs">
                      Pilih Indikator Kondisi Darurat (Minimal 1):
                    </span>

                    {/* Indicator 1 */}
                    <label
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 cursor-pointer select-none transition min-h-[56px] ${
                        indicator1
                          ? 'bg-red-50 border-red-500 text-red-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={indicator1}
                        onChange={(e) => setIndicator1(e.target.checked)}
                        className="mt-0.5 accent-red-600 w-4 h-4 rounded shrink-0 cursor-pointer"
                      />
                      <div>
                        <span className="block text-xs font-bold text-red-900">
                          1. Risiko Keamanan Jiwa Spesifik (Suicidal & Self-Harm)
                        </span>
                        <span className="text-[11px] text-slate-600 font-normal block mt-0.5 leading-relaxed">
                          Ideasi/ungkapan ingin mati ("Lebih baik saya mati saja", "Mau nyusul") atau perilaku aktif menyakiti diri sendiri.
                        </span>
                      </div>
                    </label>

                    {/* Indicator 2 */}
                    <label
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 cursor-pointer select-none transition min-h-[56px] ${
                        indicator2
                          ? 'bg-red-50 border-red-500 text-red-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={indicator2}
                        onChange={(e) => setIndicator2(e.target.checked)}
                        className="mt-0.5 accent-red-600 w-4 h-4 rounded shrink-0 cursor-pointer"
                      />
                      <div>
                        <span className="block text-xs font-bold text-red-900">
                          2. Gejala Psikotik Akut Bencana (Psychosis / Dissociation)
                        </span>
                        <span className="text-[11px] text-slate-600 font-normal block mt-0.5 leading-relaxed">
                          Halusinasi visual/auditorik, waham paranoid, disosiasi berat, atau mutisme akut (mematung & tidak merespons).
                        </span>
                      </div>
                    </label>

                    {/* Indicator 3 */}
                    <label
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 cursor-pointer select-none transition min-h-[56px] ${
                        indicator3
                          ? 'bg-red-50 border-red-500 text-red-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={indicator3}
                        onChange={(e) => setIndicator3(e.target.checked)}
                        className="mt-0.5 accent-red-600 w-4 h-4 rounded shrink-0 cursor-pointer"
                      />
                      <div>
                        <span className="block text-xs font-bold text-red-900">
                          3. Perilaku Agitasi & Gangguan Kendali Impuls
                        </span>
                        <span className="text-[11px] text-slate-600 font-normal block mt-0.5 leading-relaxed">
                          Amuk, perilaku merusak/menyerang orang lain, atau panik parah tak terkendali (jeritan histeris menetap).
                        </span>
                      </div>
                    </label>

                    {/* Indicator 4 */}
                    <label
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 cursor-pointer select-none transition min-h-[56px] ${
                        indicator4
                          ? 'bg-red-50 border-red-500 text-red-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={indicator4}
                        onChange={(e) => setIndicator4(e.target.checked)}
                        className="mt-0.5 accent-red-600 w-4 h-4 rounded shrink-0 cursor-pointer"
                      />
                      <div>
                        <span className="block text-xs font-bold text-red-900">
                          4. Kegawatdaruratan Medis & Somatik Akut
                        </span>
                        <span className="text-[11px] text-slate-600 font-normal block mt-0.5 leading-relaxed">
                          Penurunan kesadaran/pingsan berulang, sindrom hiperventilasi (kram jari-jari), atau nyeri dada psikosomatik akut.
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
                      placeholder="Contoh: Penyintas mencoba berlari ke arah reruntuhan, ditahan relawan..."
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none leading-relaxed"
                    />
                  </div>

                  {/* Send Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmEmergency}
                      disabled={!canSubmit}
                      className="w-full min-h-[56px] rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/40 transition uppercase tracking-wider"
                    >
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>Kirim Sinyal Darurat T0-Suspect</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-1">
                      Mengunci GPS Posko & Mengirim Peringatan Dini Instan ke PSC 119 dan RS
                    </p>
                  </div>
                </>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto">
              {/* SCREEN 4: ALERT & NOTIFIKASI RUJUKAN DARURAT (T0 - EMERGENCY) */}
              <Screen4EmergencyAlert
                survivorId={currentVictimId}
                survivorName={isAnonymous ? 'Penyintas Tanpa Nama (Krisis Akut)' : customName}
                posko={currentLocation}
                timestamp={recordedTimestamp || 'Sekarang'}
                emergencyReasons={emergencyReasons}
                volunteerNotes={notes}
                onClose={handleClose}
                onGoToHospitalPortal={() => {
                  handleClose();
                  window.location.hash = '/hospital';
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
