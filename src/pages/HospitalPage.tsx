import React, { useState } from 'react';
import {
  Building2,
  Smartphone,
  Shield,
  LogOut,
  Bed,
  Ambulance,
  Users,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  PhoneCall,
  Video,
  Radio,
  MapPin,
  ArrowDownRight,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import { AssessmentRecord, TriageZone, TriageTier, T0EmergencyStatus } from '../types/assessment';

interface HospitalPageProps {
  onGoToVolunteer?: () => void;
  onGoToDashboard?: () => void;
}

export const HospitalPage: React.FC<HospitalPageProps> = ({
  onGoToVolunteer,
  onGoToDashboard,
}) => {
  const { currentUser, logout } = useAuth();
  const { centralAssessments } = useAssessment();

  // Local state for two-tiered triage validations and transport tracking
  const [patientStatuses, setPatientStatuses] = useState<
    Record<
      string,
      {
        t0Status: T0EmergencyStatus;
        transportStage?: 'dispatch' | 'on_site' | 'en_route_hospital' | 'admitted';
        bed?: string;
        doctor?: string;
        teleNotes?: string;
      }
    >
  >({});

  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<'ALL' | 'T0' | 'T1' | 'T2'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);

  // Tele-Emergency verification modal
  const [isTeleModalOpen, setIsTeleModalOpen] = useState(false);
  const [teleCallActive, setTeleCallActive] = useState(false);
  const [teleNotesInput, setTeleNotesInput] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Candidates for Faskes/Hospital: T0 (Red Flag Emergency), T1 (High Risk), T2 (Moderate)
  const faskesCandidates = centralAssessments.filter(
    (r) => r.triageTier === 'T0' || r.zone === 'RED' || r.triageTier === 'T1' || r.triageTier === 'T2'
  );

  const getRecordTier = (r: AssessmentRecord): TriageTier => {
    if (r.triageTier) return r.triageTier;
    if (r.zone === 'RED') return 'T1';
    if (r.zone === 'YELLOW') return 'T2';
    return 'T3';
  };

  const getRecordT0Status = (r: AssessmentRecord): T0EmergencyStatus => {
    return patientStatuses[r.id]?.t0Status || r.t0Status || (r.zone === 'RED' && r.criticalTriggered ? 'T0-Suspect' : 'T0-Confirmed');
  };

  const filtered = faskesCandidates.filter((r) => {
    const tier = getRecordTier(r);
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      (r.victimName && r.victimName.toLowerCase().includes(search.toLowerCase())) ||
      (r.transcript && r.transcript.toLowerCase().includes(search.toLowerCase()));

    const matchesTier = filterTier === 'ALL' || tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const t0PendingList = centralAssessments.filter(
    (r) => (getRecordTier(r) === 'T0' || (r.zone === 'RED' && r.criticalTriggered)) && getRecordT0Status(r) === 'T0-Suspect'
  );

  const handleOpenTeleEmergency = (record: AssessmentRecord) => {
    setSelectedRecord(record);
    setTeleCallActive(false);
    setTeleNotesInput('');
    setIsTeleModalOpen(true);
  };

  const handleConfirmRujukan = (recordId: string) => {
    const decider = currentUser?.name || 'dr. Budi Santoso, Sp.KJ';
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setPatientStatuses((prev) => ({
      ...prev,
      [recordId]: {
        t0Status: 'T0-Confirmed',
        transportStage: 'dispatch',
        doctor: decider,
        bed: 'IGD Psikiatri Bed 02',
        teleNotes: teleNotesInput || `Terverifikasi via Tele-Emergency oleh ${decider} (${timestamp} WIB): Pasien dalam kondisi distres akut valid.`,
      },
    }));

    setActionSuccessMessage(
      `✓ [T0-CONFIRMED] (Simulasi Rujukan): Pasien ${recordId} divalidasi oleh ${decider} (${timestamp} WIB). Simulasi perintah armada PSC 119 diterbitkan.`
    );
    setIsTeleModalOpen(false);
    setTimeout(() => setActionSuccessMessage(null), 6000);
  };

  const handleDowngradeStatus = (recordId: string, targetTier: 'T1' | 'T2') => {
    const decider = currentUser?.name || 'dr. Budi Santoso, Sp.KJ';
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setPatientStatuses((prev) => ({
      ...prev,
      [recordId]: {
        t0Status: 'Downgraded',
        doctor: decider,
        teleNotes: teleNotesInput || `Diturunkan status ke ${targetTier} oleh ${decider} (${timestamp} WIB) pasca verifikasi klinis relawan.`,
      },
    }));

    setActionSuccessMessage(
      `✓ [DOWNGRADE] (Validasi Medis): Status pasien ${recordId} diturunkan ke ${targetTier} oleh ${decider} (tidak ada bahaya darurat nyawa). Ditangani oleh tim posko.`
    );
    setIsTeleModalOpen(false);
    setTimeout(() => setActionSuccessMessage(null), 6000);
  };

  const handleAdvanceTransportStage = (recordId: string) => {
    const current = patientStatuses[recordId]?.transportStage || 'dispatch';
    const nextMap: Record<string, 'on_site' | 'en_route_hospital' | 'admitted'> = {
      dispatch: 'on_site',
      on_site: 'en_route_hospital',
      en_route_hospital: 'admitted',
    };
    const nextStage = nextMap[current] || 'admitted';

    setPatientStatuses((prev) => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        t0Status: 'T0-Confirmed',
        transportStage: nextStage,
      },
    }));
  };

  const renderTierBadge = (tier: TriageTier, t0Status?: T0EmergencyStatus) => {
    if (tier === 'T0' || t0Status === 'T0-Suspect') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-600 text-white animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          T0-SUSPECT · RED FLAG
        </span>
      );
    }
    if (t0Status === 'T0-Confirmed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          T0-CONFIRMED RUJUKAN
        </span>
      );
    }
    if (tier === 'T1') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
          T1 · High Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        T2 · Moderate
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 flex flex-col font-sans">
      {/* 1. TOP BAR DASHBOARD ROLE 2 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-xs">
              <Ambulance className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  RAPID-MIND
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                  Role 2: Faskes & PSC 119 Tele-Emergency
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentUser?.assignedHospital || 'RSUD Dr. Soetomo — Public Safety Center (PSC 119)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {t0PendingList.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs animate-bounce shadow-md">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>{t0PendingList.length} T0-SUSPECT PENDING!</span>
              </div>
            )}

            {onGoToVolunteer && (
              <button
                type="button"
                onClick={onGoToVolunteer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">PWA Relawan</span>
              </button>
            )}

            {onGoToDashboard && (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Dashboard BPBD</span>
              </button>
            )}

            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {actionSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-semibold flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. THREE-PANEL CLINICAL LAYOUT ACCORDING TO RENCANABARU.MD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* PANEL KIRI (5 Cols): Emergency Queue & Panggilan Darurat T0-Suspect */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Emergency Call Queue (T0-Suspect)
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-red-600">
                  {t0PendingList.length} Panggilan Aktif
                </span>
              </div>

              {/* Pulsing Red Emergency Cards */}
              <div className="space-y-2.5">
                {t0PendingList.length > 0 ? (
                  t0PendingList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border-2 border-red-500 bg-red-50/70 shadow-sm space-y-2.5 animate-pulse"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-red-950 text-xs">
                              {item.id}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-600 text-white font-extrabold uppercase">
                              T0-SUSPECT
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">
                            {item.victimName || 'Penyintas Darurat'}
                          </span>
                        </div>

                        <span className="text-[11px] font-mono text-slate-500 font-semibold">
                          {item.timestamp}
                        </span>
                      </div>

                      <div className="text-[11px] text-red-900 flex items-center gap-1 font-semibold">
                        <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                        <span>Lokasi Terkunci: <strong>{item.location}</strong></span>
                      </div>

                      <div className="text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-red-200 space-y-0.5">
                        <strong className="text-red-900 block text-[10px] uppercase">
                          Gejala Red Flag Terdeteksi:
                        </strong>
                        <p className="truncate italic">
                          {item.indicators.join(', ') || item.transcript || 'Bahaya kegawatdaruratan nyawa.'}
                        </p>
                      </div>

                      {/* Quick Action Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenTeleEmergency(item)}
                        className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
                        <span>Buka Tele-Emergency & Validasi Sekunder</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    ✓ Tidak ada panggilan darurat T0-Suspect aktif saat ini.
                  </div>
                )}
              </div>
            </div>

            {/* Capacity & Resource Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Kapasitas Bed IGD Jiwa
                </span>
                <span className="text-xl font-bold font-mono text-emerald-800">8 / 15 Bed</span>
                <span className="text-[10px] text-emerald-700 block">Tersedia Siap Rawat</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ambulans PSC Siaga
                </span>
                <span className="text-xl font-bold font-mono text-blue-800">2 Unit</span>
                <span className="text-[10px] text-blue-700 block">Tim Reaksi Cepat</span>
              </div>
            </div>
          </div>

          {/* PANEL KANAN (7 Cols): Daftar Seluruh Pasien Rujukan & Transport Tracking */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Daftar Rujukan Pasien Klinis (T0, T1, T2)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pemantauan alur rujukan medis terstruktur dari posko lapangan.
                  </p>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilterTier('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      filterTier === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTier('T0')}
                    className={`px-2 py-1 rounded-lg transition ${
                      filterTier === 'T0' ? 'bg-white text-red-700 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    T0
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTier('T1')}
                    className={`px-2 py-1 rounded-lg transition ${
                      filterTier === 'T1' ? 'bg-white text-red-700 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    T1
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTier('T2')}
                    className={`px-2 py-1 rounded-lg transition ${
                      filterTier === 'T2' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    T2
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-3 px-3.5">ID / Nama</th>
                      <th className="py-3 px-3.5">Posko</th>
                      <th className="py-3 px-3.5">Klasifikasi</th>
                      <th className="py-3 px-3.5">Status Rujukan</th>
                      <th className="py-3 px-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.slice(0, 10).map((r) => {
                      const tier = getRecordTier(r);
                      const t0Stat = getRecordT0Status(r);
                      const transport = patientStatuses[r.id]?.transportStage;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3.5">
                            <span className="font-mono font-bold text-slate-900 block">{r.id}</span>
                            <span className="text-[11px] text-slate-600">{r.victimName || '-'}</span>
                          </td>
                          <td className="py-3 px-3.5 font-medium">{r.location}</td>
                          <td className="py-3 px-3.5">{renderTierBadge(tier, t0Stat)}</td>
                          <td className="py-3 px-3.5">
                            {transport ? (
                              <button
                                type="button"
                                onClick={() => handleAdvanceTransportStage(r.id)}
                                className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[10px] hover:bg-blue-100"
                                title="Klik untuk memajukan status armada"
                              >
                                {transport === 'dispatch' && '🚑 Menuju Posko'}
                                {transport === 'on_site' && '📍 Tiba di Posko'}
                                {transport === 'en_route_hospital' && '🏥 Menuju RS'}
                                {transport === 'admitted' && '✓ Rawat Inap IGD'}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenTeleEmergency(r)}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition"
                            >
                              Validasi
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: TELE-EMERGENCY VERIFICATION & TWO-TIERED ACTION (RencanaBaru.md) */}
      {isTeleModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Workspace Tele-Emergency (Two-Tiered Triage)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedRecord.id} · {selectedRecord.victimName || 'Penyintas'} · {selectedRecord.location}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTeleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
              {/* Tele-Emergency Call Simulator Widget */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs">Simulasi Panggilan Cepat Relawan HP Lapangan</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800">
                    {teleCallActive ? '● TERSAMBUNG (01:14)' : 'SIAP TERHUBUNG'}
                  </span>
                </div>

                {!teleCallActive ? (
                  <button
                    type="button"
                    onClick={() => setTeleCallActive(true)}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Mulai Panggilan Audio/Visual ke Relawan di {selectedRecord.location}</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-800 rounded-xl space-y-2 border border-slate-700">
                    <p className="text-[11px] text-slate-300 italic">
                      "Halo Dokter, di Posko A korban sedang kami amankan. Korban tampak menatap kosong dan sempat histeris saat ada suara gemuruh susulan."
                    </p>
                    <button
                      type="button"
                      onClick={() => setTeleCallActive(false)}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px]"
                    >
                      Akhiri Panggilan
                    </button>
                  </div>
                )}
              </div>

              {/* Rekam Medis Singkat */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-800">Indikator Gejala Posko:</strong>
                  {renderTierBadge(getRecordTier(selectedRecord))}
                </div>
                <p className="text-slate-600">
                  {selectedRecord.indicators.join(', ') || 'N/A'}
                </p>
                {selectedRecord.transcript && (
                  <div className="p-2 bg-white rounded-lg border border-slate-200 italic text-[11px]">
                    "{selectedRecord.transcript}"
                  </div>
                )}
              </div>

              {/* Catatan Validasi Nakes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Catatan Validasi Dokter / Nakes Tele-Emergency:
                </label>
                <textarea
                  value={teleNotesInput}
                  onChange={(e) => setTeleNotesInput(e.target.value)}
                  rows={2}
                  placeholder="Kondisi pupil normal, agitasi mereda setelah diajak bicara. Disetujui rujukan rawat / atau diturunkan ke T1..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              {/* Two-Tiered Execution Action Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block text-center">
                  Keputusan Triase Sekunder (Two-Tiered Decision)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmRujukan(selectedRecord.id)}
                    className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Konfirmasi Rujukan (T0-Confirmed)</span>
                    <span className="text-[9px] font-normal opacity-90">Kirim Perintah Ambulans</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDowngradeStatus(selectedRecord.id, 'T1')}
                    className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Downgrade ke T1 / T2</span>
                    <span className="text-[9px] font-normal opacity-90">Bukan Bahaya Darurat Nyawa</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
