import React, { useState, useMemo } from 'react';
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  FileEdit,
  Save,
  AlertTriangle,
  Power,
  User,
  Calendar,
  ArrowDownRight,
} from 'lucide-react';
import {
  ShieldExclamationIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';
import {
  IconMapPin,
  IconStethoscope,
  IconActivityHeartbeat,
  IconAmbulance,
  IconBuildingHospital,
  IconBed,
} from '@tabler/icons-react';
import { AssessmentRecord, TriageTier, T0EmergencyStatus } from '../../types/assessment';

export type WorkspaceTab = 'ringkasan' | 'asesmen' | 'catatan' | 'tindakan' | 'riwayat';

interface AssessmentDetailProps {
  record: AssessmentRecord | null;
  activeTier: TriageTier;
  activeT0Status?: T0EmergencyStatus;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onOpenTeleEmergency: () => void;
  onAdvanceTransport: () => void;
  transportStage: 'dispatch' | 'on_site' | 'en_route_hospital' | 'admitted';
  allocatedBed?: string;
  onSelectBed: (bed: string) => void;
  onOpenSuratRujukan: () => void;
  doctorNote: string;
  onSaveDoctorNote: (note: string) => void;
  allAssessments: AssessmentRecord[];
  onSelectAssessmentFromHistory: (id: string) => void;
  onConfirmT0: () => void;
  onDowngradeTier: (tier: 'T1' | 'T2') => void;
}

export const AssessmentDetail: React.FC<AssessmentDetailProps> = ({
  record,
  activeTier,
  activeT0Status,
  onPrevRecord,
  onNextRecord,
  hasPrev,
  hasNext,
  onOpenTeleEmergency,
  onAdvanceTransport,
  transportStage = 'dispatch',
  allocatedBed = 'IGD Psikiatri Bed 01',
  onSelectBed,
  onOpenSuratRujukan,
  doctorNote,
  onSaveDoctorNote,
  allAssessments,
  onSelectAssessmentFromHistory,
  onConfirmT0,
  onDowngradeTier,
}) => {
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('ringkasan');
  const [noteInput, setNoteInput] = useState(doctorNote);

  const formatMaskedNik = (nik?: string) => {
    if (!nik || nik.length < 10) return 'Belum Tercatat';
    return `${nik.slice(0, 6)}********${nik.slice(-2)}`;
  };

  const survivorHistory = useMemo(() => {
    if (!record) return [];
    const name = (record.victimName || '').toLowerCase().trim();
    const nik = record.nik;
    const survId = record.survivorId;

    return allAssessments
      .filter((r) => {
        if (nik && r.nik && r.nik === nik) return true;
        if (survId && r.survivorId && r.survivorId === survId) return true;
        if (name && r.victimName && r.victimName.toLowerCase().trim() === name) return true;
        return false;
      })
      .sort((a, b) => (b.id || '').localeCompare(a.id || ''));
  }, [record, allAssessments]);

  if (!record) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 shadow-xs">
        <p className="font-bold text-slate-700 text-sm">Belum ada assessment terpilih</p>
        <p className="text-xs mt-1">Pilih pasien dari antrean korban di sebelah kiri.</p>
      </div>
    );
  }

  const rmId = record.rmCode || record.recordId || record.id;
  const indicatorsLower = (record.indicators || []).map((i) => i.toLowerCase());
  const transcriptLower = (record.transcript || '').toLowerCase();

  const redFlag1Detected =
    indicatorsLower.some(
      (i) =>
        i.includes('keamanan jiwa') ||
        i.includes('ingin mati') ||
        i.includes('melukai diri') ||
        i.includes('menyakiti diri') ||
        i.includes('suisida')
    ) ||
    record.srq20YesList?.includes(17) ||
    transcriptLower.includes('menyakiti diri') ||
    transcriptLower.includes('bunuh diri');

  const redFlag2Detected = indicatorsLower.some(
    (i) =>
      i.includes('psikotik') ||
      i.includes('halusinasi') ||
      i.includes('waham') ||
      i.includes('disorganisasi')
  );

  const redFlag3Detected = indicatorsLower.some(
    (i) =>
      i.includes('agresif') ||
      i.includes('amuk') ||
      i.includes('kontrol impuls') ||
      i.includes('merusak')
  );

  const redFlag4Detected = indicatorsLower.some(
    (i) =>
      i.includes('somatik') ||
      i.includes('penurunan kesadaran') ||
      i.includes('kejang') ||
      i.includes('hipertermia') ||
      i.includes('cedera berat')
  );
  return (
    <div className="space-y-4">
      {/* 1. Detail Header Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Top Row: Back + Next + RM ID + Badge + Emergency Button */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={onPrevRecord}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-600 flex items-center justify-center transition cursor-pointer"
                title="Pasien Sebelumnya"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={onNextRecord}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-600 flex items-center justify-center transition cursor-pointer"
                title="Pasien Selanjutnya"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Canonical RM Assessment Identifier - NEVER SURV, NEVER PB! */}
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              {rmId}
            </span>

            {/* Triage Tier Badge */}
            {activeTier === 'T0' ? (
              <span className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <span>●</span>
                <span>{activeT0Status === 'T0-Confirmed' ? 'T0-CONFIRMED' : 'T0-SUSPECT'}</span>
              </span>
            ) : activeTier === 'T1' ? (
              <span className="bg-orange-50 text-orange-800 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-orange-200">
                ▲ T1 - HIGH RISK
              </span>
            ) : activeTier === 'T2' ? (
              <span className="bg-amber-50 text-amber-800 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-amber-200">
                ⚡ T2 - MODERATE RISK
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-emerald-200">
                ♥ T3 - LOW RISK
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Big Red Emergency Action CTA */}
            <button
              type="button"
              onClick={onOpenTeleEmergency}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition"
            >
              <ShieldExclamationIcon className="w-4 h-4 text-white" />
              <span>Mulai Tindakan Darurat</span>
            </button>
          </div>
        </div>

        {/* Survivor Header: Name & Demographics Subtitle */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
            {record.victimName || 'Penyintas Tanpa Nama'}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            NIK: {formatMaskedNik(record.nik)} · Kelompok: {record.victimCategory || 'Dewasa'}
          </p>
        </div>

        {/* 4 Quick Demographic Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Box 1: Lokasi Posko */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-600">
              <IconMapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                Lokasi Posko
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate">
              {record.location}
            </p>
          </div>

          {/* Box 2: Demografi */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600">
              <User className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                Demografi
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate">
              {record.victimAge ? `${record.victimAge} th` : '-'} /{' '}
              {record.victimGender === 'P' ? 'Perempuan' : 'Laki-laki'}
            </p>
          </div>

          {/* Box 3: Waktu Laporan */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                Waktu Laporan
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate">
              {record.timestamp} WIB
            </p>
          </div>

          {/* Box 4: Status */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                Status
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate">
              {activeT0Status || (activeTier === 'T0' ? 'Menunggu Validasi' : `${activeTier} Terpantau`)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Workspace Navigation Tabs */}
      <div className="bg-white border border-slate-100 rounded-2xl px-5 pt-3 shadow-xs">
        <div className="flex items-center gap-6 overflow-x-auto text-xs border-b border-slate-100">
          <button
            type="button"
            onClick={() => setWorkspaceTab('ringkasan')}
            className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
              workspaceTab === 'ringkasan'
                ? 'text-rose-600 border-b-2 border-rose-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ringkasan</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceTab('asesmen')}
            className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
              workspaceTab === 'asesmen'
                ? 'text-rose-600 border-b-2 border-rose-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Asesmen</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceTab('catatan')}
            className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
              workspaceTab === 'catatan'
                ? 'text-rose-600 border-b-2 border-rose-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Catatan</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceTab('tindakan')}
            className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
              workspaceTab === 'tindakan'
                ? 'text-rose-600 border-b-2 border-rose-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <IconStethoscope className="w-3.5 h-3.5" />
            <span>Tindakan</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceTab('riwayat')}
            className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
              workspaceTab === 'riwayat'
                ? 'text-rose-600 border-b-2 border-rose-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <ClockIcon className="w-3.5 h-3.5" />
            <span>Riwayat</span>
          </button>
        </div>
      </div>
      {/* 3. Tab Content Area */}
      {workspaceTab === 'ringkasan' && (
        <div className="space-y-4 animate-in fade-in">
          {/* A. Status Banner */}
          {activeTier === 'T0' ? (
            <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-black">
                <Power className="w-4 h-4 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-950">
                  Status Kritis: {activeT0Status || 'T0-Suspect'}
                </h3>
                <p className="text-xs text-rose-900/90 leading-relaxed">
                  Kasus terdeteksi memiliki sinyal kegawatdaruratan psikiatri/medis aktif dari posko. Segera
                  lakukan validasi sekunder melalui sambungan Tele-Emergency dengan relawan.
                </p>
              </div>
            </div>
          ) : activeTier === 'T1' ? (
            <div className="bg-orange-50/80 border border-orange-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-black">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-orange-950">
                  Status Peringatan: T1 - Risiko Tinggi
                </h3>
                <p className="text-xs text-orange-900/90 leading-relaxed">
                  Skor SRQ-20 mengindikasikan distres psikologis berat ({record.score}/20). Jadwalkan konsultasi rujukan spesialis kejiwaan / psikolog klinis.
                </p>
              </div>
            </div>
          ) : activeTier === 'T2' ? (
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-black">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-950">
                  Status Pantauan: T2 - Risiko Sedang
                </h3>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  Penyintas memerlukan pendampingan PFA lanjutan dan intervensi krisis posko oleh relawan terlatih.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-black">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-950">
                  Status Terkendali: T3 - Risiko Rendah
                </h3>
                <p className="text-xs text-emerald-900/90 leading-relaxed">
                  Penyintas dalam batas adaptif pascabencana. Berikan psikoedukasi dan pemenuhan kebutuhan dasar di posko.
                </p>
              </div>
            </div>
          )}

          {/* B. Indikator Bahaya (Red Flag Kegawatdaruratan) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Indikator Bahaya (Red Flag Kegawatdaruratan)</span>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceTab('asesmen')}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Penjelasan Detail →
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* Item 1 */}
              <div
                className={`p-3 rounded-xl border leading-relaxed flex items-start justify-between gap-3 ${
                  redFlag1Detected
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-slate-50/50 border-slate-100 text-slate-600'
                }`}
              >
                <div>
                  <strong className={redFlag1Detected ? 'text-rose-950' : 'text-slate-900'}>
                    1. Risiko keamanan jiwa spesifik:
                  </strong>{' '}
                  <span>rencana/ungkapan ingin mati (SRQ-17) atau tindakan menyakiti diri aktif</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                    redFlag1Detected
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {redFlag1Detected ? '✓ Terdeteksi' : '— Tidak Terdeteksi'}
                </span>
              </div>

              {/* Item 2 */}
              <div
                className={`p-3 rounded-xl border leading-relaxed flex items-start justify-between gap-3 ${
                  redFlag2Detected
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-slate-50/50 border-slate-100 text-slate-600'
                }`}
              >
                <div>
                  <strong className={redFlag2Detected ? 'text-rose-950' : 'text-slate-900'}>
                    2. Gejala psikotik akut:
                  </strong>{' '}
                  <span>halusinasi visual/auditori, waham paranoid, atau disorganisasi/ucapan tidak terkontrol</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                    redFlag2Detected
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {redFlag2Detected ? '✓ Terdeteksi' : '— Tidak Terdeteksi'}
                </span>
              </div>

              {/* Item 3 */}
              <div
                className={`p-3 rounded-xl border leading-relaxed flex items-start justify-between gap-3 ${
                  redFlag3Detected
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-slate-50/50 border-slate-100 text-slate-600'
                }`}
              >
                <div>
                  <strong className={redFlag3Detected ? 'text-rose-950' : 'text-slate-900'}>
                    3. Perilaku agresif & gangguan kontrol impuls:
                  </strong>{' '}
                  <span>amuk/agresif fisik merusak atau ancaman pada sekitaran tak terkendali</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                    redFlag3Detected
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {redFlag3Detected ? '✓ Terdeteksi' : '— Tidak Terdeteksi'}
                </span>
              </div>

              {/* Item 4 */}
              <div
                className={`p-3 rounded-xl border leading-relaxed flex items-start justify-between gap-3 ${
                  redFlag4Detected
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-slate-50/50 border-slate-100 text-slate-600'
                }`}
              >
                <div>
                  <strong className={redFlag4Detected ? 'text-rose-950' : 'text-slate-900'}>
                    4. Kegawatdaruratan medis & somatik akut:
                  </strong>{' '}
                  <span>penurunan kesadaran, kejang, hipertermia, atau cedera berat lainnya</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                    redFlag4Detected
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {redFlag4Detected ? '✓ Terdeteksi' : '— Tidak Terdeteksi'}
                </span>
              </div>
            </div>
          </div>

          {/* C. Bottom Two Cards Grid: Asesmen Klinis + Alur PSC 119 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Hasil Asesmen Klinis Terkini */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                  <IconActivityHeartbeat className="w-4 h-4 text-blue-600" />
                  <span>Hasil Asesmen Klinis Terkini</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkspaceTab('asesmen')}
                  className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition cursor-pointer"
                >
                  Lihat Detail →
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">SRQ-20</span>
                  <span className="text-base font-black text-slate-900 block my-0.5">
                    {record.score} / 20
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium block">Distres</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Faktor Risiko</span>
                  <span className="text-base font-black text-slate-900 block my-0.5">
                    {record.riskFactorScore ?? 0} / 5
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium block">Kerentanan</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Gangguan Fungsi</span>
                  <span className="text-base font-black text-slate-900 block my-0.5">
                    {record.functionalScoreTotal ?? 0} / 9
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium block">Disabilitas</span>
                </div>

                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] text-blue-600 block font-bold uppercase">Klasifikasi</span>
                  <span className="text-base font-black text-blue-700 block my-0.5">
                    {activeTier === 'T0' ? 'T0' : activeTier}
                  </span>
                  <span className="text-[9px] text-blue-600 font-medium block">Tindak Lanjut</span>
                </div>
              </div>
            </div>

            {/* Right: Alur Armada PSC 119 */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                  <IconAmbulance className="w-4 h-4 text-rose-600" />
                  <span>Alur Armada PSC 119</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkspaceTab('tindakan')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Alokasi Bed RS →
                </button>
              </div>

              {/* 4-Step Stepper */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 text-center">
                <div className="space-y-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto border ${
                      transportStage === 'dispatch'
                        ? 'bg-rose-50 text-rose-600 border-rose-300 ring-2 ring-rose-200'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}
                  >
                    <IconAmbulance className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 block leading-tight">
                    1. Dispatch Armada
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border inline-block ${
                      transportStage === 'dispatch'
                        ? 'text-rose-700 bg-rose-50 border-rose-200'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    {transportStage === 'dispatch' ? 'Menunggu' : 'Selesai'}
                  </span>
                </div>

                <div className={`space-y-1.5 ${transportStage === 'dispatch' ? 'opacity-60' : ''}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto border ${
                      transportStage === 'on_site'
                        ? 'bg-blue-50 text-blue-600 border-blue-300 ring-2 ring-blue-200'
                        : transportStage === 'en_route_hospital' || transportStage === 'admitted'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    <IconMapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-medium text-slate-600 block leading-tight">
                    2. Tiba di Posko
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {transportStage === 'on_site'
                      ? 'Di Lokasi'
                      : transportStage === 'en_route_hospital' || transportStage === 'admitted'
                      ? 'Selesai'
                      : '—'}
                  </span>
                </div>

                <div
                  className={`space-y-1.5 ${
                    transportStage === 'dispatch' || transportStage === 'on_site' ? 'opacity-60' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto border ${
                      transportStage === 'en_route_hospital'
                        ? 'bg-blue-50 text-blue-600 border-blue-300 ring-2 ring-blue-200'
                        : transportStage === 'admitted'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    <IconBuildingHospital className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-medium text-slate-600 block leading-tight">
                    3. Evakuasi ke RS
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {transportStage === 'en_route_hospital'
                      ? 'Perjalanan'
                      : transportStage === 'admitted'
                      ? 'Selesai'
                      : '—'}
                  </span>
                </div>

                <div className={`space-y-1.5 ${transportStage !== 'admitted' ? 'opacity-60' : ''}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto border ${
                      transportStage === 'admitted'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-300 ring-2 ring-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    <IconBed className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-medium text-slate-600 block leading-tight">
                    4. Rawat Inap ICU
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {transportStage === 'admitted' ? 'Masuk Bed' : '—'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={onAdvanceTransport}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Perbarui Tahap Evakuasi ➔</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Tab: Asesmen */}
      {workspaceTab === 'asesmen' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Rincian Jawaban SRQ-20 & Penapisan Posko</h3>
            <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg font-bold border border-blue-200">
              Skor: {record.score} / 20
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800">Transkrip Percakapan / Keluhan Utama:</h4>
            <p className="p-3 bg-slate-50 rounded-xl text-slate-700 italic border border-slate-200 leading-relaxed">
              "{record.transcript || 'Tidak ada transkrip audio yang direkam.'}"
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800">Indikator Terpilih Relawan:</h4>
            <div className="flex flex-wrap gap-1.5">
              {(record.indicators || []).map((ind, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 font-medium text-xs"
                >
                  ✓ {ind}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
            <h4 className="font-bold text-blue-950">Rekomendasi Algoritma Triase:</h4>
            <p className="text-blue-900 leading-relaxed">{record.recommendedAction}</p>
          </div>
        </div>
      )}

      {/* Tab: Catatan */}
      {workspaceTab === 'catatan' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in text-xs">
          <h3 className="text-sm font-bold text-slate-900">Catatan Medis & Validasi Klinis Dokter</h3>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            rows={4}
            placeholder="Tuliskan catatan observasi klinis, arahan medikasi, atau instruksi rujukan..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition"
          />
          <button
            type="button"
            onClick={() => onSaveDoctorNote(noteInput)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Catatan Dokter</span>
          </button>
        </div>
      )}

      {/* Tab: Tindakan */}
      {workspaceTab === 'tindakan' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in text-xs">
          <h3 className="text-sm font-bold text-slate-900">Keputusan Triase Sekunder & Alokasi Bed IGD</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={onConfirmT0}
              className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <CheckCircleIcon className="w-5 h-5 text-white" />
              <span>Konfirmasi T0-Confirmed</span>
              <span className="text-[10px] font-normal opacity-90">Kirim Armada PSC 119</span>
            </button>

            <button
              type="button"
              onClick={() => onDowngradeTier('T1')}
              className="p-4 rounded-2xl bg-white hover:bg-orange-50 text-orange-950 font-bold border border-orange-300 shadow-2xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowDownRight className="w-5 h-5 text-orange-600" />
              <span>Downgrade ke T1</span>
              <span className="text-[10px] font-normal text-orange-800">Risiko Tinggi Non-Kritis</span>
            </button>

            <button
              type="button"
              onClick={() => onDowngradeTier('T2')}
              className="p-4 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 font-bold border border-amber-300 shadow-2xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowDownRight className="w-5 h-5 text-amber-600" />
              <span>Downgrade ke T2</span>
              <span className="text-[10px] font-normal text-amber-800">Distres Sedang Posko</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-800 block mb-1.5">Alokasi Bed Rumah Sakit:</label>
            <select
              value={allocatedBed}
              onChange={(e) => onSelectBed(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
            >
              <option value="IGD Psikiatri Bed 01">IGD Psikiatri Bed 01 (Tersedia)</option>
              <option value="IGD Psikiatri Bed 02">IGD Psikiatri Bed 02 (Tersedia)</option>
              <option value="ICU Bed 03">ICU Bed 03 (Siaga)</option>
              <option value="Ruang Observasi Khusus Posko">Ruang Observasi Khusus Posko</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div>
              <label className="font-bold text-slate-800 block text-xs">Dokumentasi Administrasi Rujukan Medis:</label>
              <p className="text-[11px] text-slate-500">
                Penerbitan surat rujukan resmi berstandar Kemenkes / Dinkes untuk RSUD / RS Jiwa.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSuratRujukan}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center gap-2 border border-blue-200 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Terbitkan Surat Rujukan Resmi (Cetak / PDF)</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Riwayat (Longitudinal Assessment History) */}
      {workspaceTab === 'riwayat' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Asesmen Longitudinal: {record.victimName}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Rekam jejak asesmen berkala penyintas yang sama di berbagai fase bencana.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {survivorHistory.length} Asesmen
            </span>
          </div>

          {/* Longitudinal Explanatory Notice */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
            <strong>Model Data Longitudinal:</strong> Entitas penyintas (<span className="font-semibold">{record.victimName}</span>) diidentifikasi melalui NIK/identitas korban, sedangkan setiap evaluasi berkala memiliki kode rekam medis unik (<span className="font-mono">RM-2026-xxxxxx</span>) untuk memantau progres pemulihan psikologis.
          </div>

          {/* List of Assessments for this Survivor */}
          <div className="space-y-3">
            {survivorHistory.map((hist) => {
              const isCurrent = (hist.rmCode || hist.id) === rmId;
              const hRm = hist.rmCode || hist.recordId || hist.id;
              const hTier = hist.triageTier || (hist.criticalTriggered ? 'T0' : 'T2');

              return (
                <div
                  key={hist.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isCurrent
                      ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-xs">{hRm}</span>
                      {hTier === 'T0' ? (
                        <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                          {hist.t0Status || 'T0-SUSPECT'}
                        </span>
                      ) : hTier === 'T1' ? (
                        <span className="bg-orange-100 text-orange-800 font-bold text-[9px] px-2 py-0.5 rounded-md border border-orange-200">
                          T1 · HIGH RISK
                        </span>
                      ) : hTier === 'T2' ? (
                        <span className="bg-amber-100 text-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-md border border-amber-200">
                          T2 · MODERATE
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-md border border-emerald-200">
                          T3 · LOW RISK
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                          Sedang Dibuka
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {hist.timestamp} WIB · {hist.location}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-center text-[10px]">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-medium">SRQ-20</span>
                      <span className="font-bold text-slate-800">{hist.score} / 20</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-medium">Faktor Risiko</span>
                      <span className="font-bold text-slate-800">{hist.riskFactorScore ?? 0} / 5</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-medium">Metode</span>
                      <span className="font-bold text-slate-800">{hist.method}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 italic bg-white p-2 rounded-lg border border-slate-100">
                    "{hist.transcript || hist.volunteerNotes || 'Evaluasi berkala penanganan posko.'}"
                  </p>

                  {!isCurrent && (
                    <div className="mt-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectAssessmentFromHistory(hist.id)}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        Buka Asesmen Ini ➔
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
