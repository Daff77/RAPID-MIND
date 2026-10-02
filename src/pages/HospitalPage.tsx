import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Download,
  FileText,
  ArrowRight,
} from 'lucide-react';
import {
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import {
  IconPhoneCall,
  IconVideo,
  IconMapPin,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import { AssessmentRecord, TriageTier, T0EmergencyStatus } from '../types/assessment';
import { emergencyService } from '../services/emergencyService';
import { HealthcareHeader } from '../components/hospital/HealthcareHeader';
import { HealthcareSidebar, SidebarTab } from '../components/hospital/HealthcareSidebar';
import { DashboardMetrics } from '../components/hospital/DashboardMetrics';
import { AssessmentQueue, QueueFilter } from '../components/hospital/AssessmentQueue';
import { AssessmentDetail } from '../components/hospital/AssessmentDetail';
import { TeleEmergencyModal } from '../components/hospital/TeleEmergencyModal';
import { SuratRujukanModal } from '../components/hospital/SuratRujukanModal';

interface HospitalPageProps {}

export const HospitalPage: React.FC<HospitalPageProps> = () => {
  const { currentUser, logout } = useAuth();
  const { centralAssessments } = useAssessment();

  // Local state for two-tiered triage validations and transport tracking
  const [patientStatuses, setPatientStatuses] = useState<
    Record<
      string,
      {
        t0Status?: T0EmergencyStatus;
        downgradedTier?: 'T1' | 'T2';
        transportStage?: 'dispatch' | 'on_site' | 'en_route_hospital' | 'admitted';
        bed?: string;
        doctor?: string;
        teleNotes?: string;
      }
    >
  >({
    'RM-2026-000089': {
      t0Status: 'T0-Suspect',
      transportStage: 'dispatch',
      bed: 'IGD Psikiatri Bed 01',
    },
  });

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('dashboard');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('RM-2026-000089');

  // Referral states
  const [selectedSuratRecord, setSelectedSuratRecord] = useState<AssessmentRecord | null>(null);
  const [rujukanFilter, setRujukanFilter] = useState<'ALL' | 'T0' | 'T1'>('ALL');
  const [targetHospital, setTargetHospital] = useState<string>(
    'RSUD Sayang Cianjur - IGD Psikiatri Terpadu'
  );
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>(
    'F43.0 Reaksi Stres Akut Berat dengan Agitasi (Acute Stress Reaction)'
  );

  // Tele-Emergency modal state
  const [isTeleModalOpen, setIsTeleModalOpen] = useState(false);
  const [teleCallActive, setTeleCallActive] = useState(false);
  const [teleNotesInput, setTeleNotesInput] = useState('');
  const [doctorNoteInput, setDoctorNoteInput] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const getRecordTier = (r: AssessmentRecord): TriageTier => {
    if (patientStatuses[r.id]?.downgradedTier) {
      return patientStatuses[r.id].downgradedTier!;
    }
    if (r.triageTier) return r.triageTier;
    if (r.criticalTriggered || r.t0Status === 'T0-Confirmed' || r.t0Status === 'T0-Suspect') return 'T0';
    if (r.zone === 'RED' && r.criticalTriggered) return 'T0';
    if (r.zone === 'RED') return 'T1';
    if (r.zone === 'YELLOW') return 'T2';
    return 'T3';
  };

  const getRecordT0Status = (r: AssessmentRecord): T0EmergencyStatus | undefined => {
    if (patientStatuses[r.id]?.t0Status) {
      return patientStatuses[r.id].t0Status;
    }
    if (r.t0Status) {
      return r.t0Status;
    }
    if (r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)) {
      return 'T0-Suspect';
    }
    return undefined;
  };

  // Deduplicate and process central assessments by survivor so queue lists distinct active patients
  // and exclude pure PFA guidebook reading records (Requirement 11)
  const faskesCandidates = useMemo(() => {
    const map = new Map<string, AssessmentRecord>();
    for (const record of centralAssessments) {
      if (record.phase === 'acute_pfa' && !record.score && !record.criticalTriggered) {
        continue;
      }
      const survivorKey = record.nik || record.survivorId || record.victimName || record.id;
      if (!map.has(survivorKey)) {
        map.set(survivorKey, record);
      }
    }
    const list = Array.from(map.values());

    // Sort by clinical priority: T0 first, then T1, T2, T3 (Requirement 21)
    const priorityWeight = (r: AssessmentRecord) => {
      const tier = getRecordTier(r);
      if (tier === 'T0') return 4;
      if (tier === 'T1') return 3;
      if (tier === 'T2') return 2;
      return 1;
    };

    return list.sort((a, b) => priorityWeight(b) - priorityWeight(a));
  }, [centralAssessments, patientStatuses]);

  // Queue filtering based on T0, T1, T2, T3, ALL and search
  const filteredQueue = useMemo(() => {
    return faskesCandidates.filter((r) => {
      const tier = getRecordTier(r);
      const rmId = r.rmCode || r.recordId || r.id;
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        rmId.toLowerCase().includes(q) ||
        (r.victimName && r.victimName.toLowerCase().includes(q)) ||
        (r.nik && r.nik.includes(q)) ||
        r.location.toLowerCase().includes(q) ||
        (r.transcript && r.transcript.toLowerCase().includes(q)) ||
        (r.volunteerNotes && r.volunteerNotes.toLowerCase().includes(q));

      const matchesFilter = queueFilter === 'ALL' || tier === queueFilter;

      return matchesSearch && matchesFilter;
    });
  }, [faskesCandidates, searchQuery, queueFilter, patientStatuses]);

  // Rujukan specific queue (T0 & T1 patients eligible for hospital referral or PSC 119 dispatch)
  const rujukanQueue = useMemo(() => {
    return faskesCandidates.filter((r) => {
      const tier = getRecordTier(r);
      const isEligible = tier === 'T0' || tier === 'T1';
      if (!isEligible) return false;

      const rmId = r.rmCode || r.recordId || r.id;
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        rmId.toLowerCase().includes(q) ||
        (r.victimName && r.victimName.toLowerCase().includes(q)) ||
        r.location.toLowerCase().includes(q);

      const matchesFilter =
        rujukanFilter === 'ALL' ||
        (rujukanFilter === 'T0' && tier === 'T0') ||
        (rujukanFilter === 'T1' && tier === 'T1');

      return matchesSearch && matchesFilter;
    });
  }, [faskesCandidates, searchQuery, rujukanFilter, patientStatuses]);

  // Real-time counts for KPI Strip & Filters
  const counts = useMemo(() => {
    let t0 = 0;
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;

    for (const r of faskesCandidates) {
      const tier = getRecordTier(r);
      if (tier === 'T0') t0++;
      else if (tier === 'T1') t1++;
      else if (tier === 'T2') t2++;
      else if (tier === 'T3') t3++;
    }

    return {
      total: faskesCandidates.length,
      t0,
      t1,
      t2,
      t3,
      merah: t0 + t1,
    };
  }, [faskesCandidates, patientStatuses]);

  // Active selected record in workspace (syncs smoothly with filter changes)
  const activeRecord = useMemo(() => {
    const inFiltered = filteredQueue.find(
      (r) => r.id === selectedRecordId || r.rmCode === selectedRecordId || r.recordId === selectedRecordId
    );
    if (inFiltered) return inFiltered;

    if (filteredQueue.length > 0) return filteredQueue[0];

    const found = faskesCandidates.find(
      (r) => r.id === selectedRecordId || r.rmCode === selectedRecordId || r.recordId === selectedRecordId
    );
    return found || faskesCandidates[0] || null;
  }, [faskesCandidates, selectedRecordId, filteredQueue]);
  // Tele-Emergency verification handler
  const handleOpenTeleEmergency = () => {
    if (activeRecord) {
      setTeleCallActive(false);
      setTeleNotesInput('');
      setIsTeleModalOpen(true);
    }
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
        bed: prev[recordId]?.bed || 'IGD Psikiatri Bed 01',
        teleNotes:
          teleNotesInput ||
          `Terverifikasi via Tele-Emergency oleh ${decider} (${timestamp} WIB): Pasien dalam kondisi distres akut valid.`,
      },
    }));

    setActionSuccessMessage(
      `✓ [TERKONFIRMASI] Status T0-Confirmed disahkan oleh ${decider}. Armada PSC 119 disiagakan untuk ${recordId}.`
    );
    setIsTeleModalOpen(false);
    setTimeout(() => setActionSuccessMessage(null), 6000);

    emergencyService.confirmEmergency(recordId, decider, teleNotesInput).catch(() => {});
  };

  const handleDowngradeStatus = (recordId: string, targetTier: 'T1' | 'T2') => {
    const decider = currentUser?.name || 'dr. Budi Santoso, Sp.KJ';
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setPatientStatuses((prev) => ({
      ...prev,
      [recordId]: {
        t0Status: 'Downgraded',
        downgradedTier: targetTier,
        doctor: decider,
        teleNotes:
          teleNotesInput ||
          `Evaluasi Tele-Emergency ${decider} (${timestamp} WIB): Gejala klinis stabil, diturunkan ke ${targetTier}.`,
      },
    }));

    setActionSuccessMessage(
      `✓ [DOWNGRADE] Validasi Medis: Status pasien ${recordId} diturunkan ke ${targetTier} oleh ${decider}. Ditangani di posko.`
    );
    setIsTeleModalOpen(false);
    setTimeout(() => setActionSuccessMessage(null), 6000);

    emergencyService.downgradeEmergency(recordId, targetTier, decider, teleNotesInput).catch(() => {});
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

    setActionSuccessMessage(
      `✓ Progres armada evakuasi untuk ${recordId} diperbarui ke tahap: ${nextStage}.`
    );
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleExportCSV = () => {
    const headers = ['RM_Code', 'Nama', 'Kelompok', 'Lokasi_Posko', 'Tier_Triase', 'Status_T0', 'Skor_SRQ20', 'Skor_Risiko', 'Skor_Fungsi', 'Waktu'];
    const rows = faskesCandidates.map((r) => [
      r.rmCode || r.recordId || r.id,
      `"${(r.victimName || '').replace(/"/g, '""')}"`,
      r.victimCategory || 'Dewasa',
      `"${(r.location || '').replace(/"/g, '""')}"`,
      getRecordTier(r),
      getRecordT0Status(r) || '-',
      r.score,
      r.riskFactorScore ?? 0,
      r.functionalScoreTotal ?? 0,
      `"${r.timestamp || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RAPIDMIND_Faskes_Data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionSuccessMessage('✓ Berkas CSV rekam medis faskes berhasil diunduh.');
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const activeTier = activeRecord ? getRecordTier(activeRecord) : 'T3';
  const activeT0Status = activeRecord ? getRecordT0Status(activeRecord) : undefined;
  const currentTransportStage = activeRecord
    ? patientStatuses[activeRecord.id]?.transportStage || 'dispatch'
    : 'dispatch';

  const currentIdx = activeRecord ? filteredQueue.findIndex((r) => r.id === activeRecord.id) : -1;
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx >= 0 && currentIdx < filteredQueue.length - 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* 1. TOP NAVBAR (RAPID MIND + STATUS + USER PROFILE) */}
      <HealthcareHeader
        userName={currentUser?.name || 'dr. Budi Santoso, Sp.KJ'}
        userRole="Tenaga Medis"
        facilityName="PSC 119 Aktif"
        onLogout={logout}
      />

      {/* Action Toast Alert Banner */}
      {actionSuccessMessage && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in sticky top-16 z-30">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-white shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-100 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. BODY CONTAINER (SIDEBAR + MAIN CONTENT WORKSPACE) */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)]">
        {/* LEFT SIDEBAR NAVIGATION */}
        <HealthcareSidebar
          activeTab={sidebarTab}
          onSelectTab={setSidebarTab}
          referralBadgeCount={rujukanQueue.length}
        />

        {/* MAIN BODY CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* TAB 1: DASHBOARD (EXECUTIVE OVERVIEW + TWO-COLUMN SPLIT) */}
          {sidebarTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
              {/* TOP 4 METRICS KPI STRIP */}
              <DashboardMetrics
                totalKorban={counts.total || 15}
                activeAssessments={counts.t0 || 2}
                zonaMerahCount={counts.merah || 2}
                avgTime="3:24"
                onFilterAll={() => setQueueFilter('ALL')}
                onFilterT0={() => setQueueFilter('T0')}
              />

              {/* MAIN TWO-COLUMN WORKSPACE: LEFT QUEUE + RIGHT DETAIL */}
              <div className="grid grid-cols-12 gap-5 lg:gap-6 items-start">
                {/* LEFT COLUMN: ANTREAN KORBAN (QUEUE) ~35-38% */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-4">
                  <AssessmentQueue
                    records={filteredQueue}
                    totalCandidateCount={faskesCandidates.length}
                    selectedRecordId={activeRecord ? activeRecord.id : ''}
                    onSelectRecord={(id) => setSelectedRecordId(id)}
                    activeFilter={queueFilter}
                    onFilterChange={setQueueFilter}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    getRecordTier={getRecordTier}
                    getRecordT0Status={getRecordT0Status}
                  />
                </div>

                {/* RIGHT COLUMN: CLINICAL WORKSPACE DETAIL ~62-65% */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-8">
                  <AssessmentDetail
                    record={activeRecord}
                    activeTier={activeTier}
                    activeT0Status={activeT0Status}
                    onPrevRecord={() => {
                      if (hasPrev) setSelectedRecordId(filteredQueue[currentIdx - 1].id);
                    }}
                    onNextRecord={() => {
                      if (hasNext) setSelectedRecordId(filteredQueue[currentIdx + 1].id);
                    }}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    onOpenTeleEmergency={handleOpenTeleEmergency}
                    onAdvanceTransport={() => {
                      if (activeRecord) handleAdvanceTransportStage(activeRecord.id);
                    }}
                    transportStage={currentTransportStage}
                    allocatedBed={activeRecord ? patientStatuses[activeRecord.id]?.bed : undefined}
                    onSelectBed={(bed) => {
                      if (activeRecord) {
                        setPatientStatuses((prev) => ({
                          ...prev,
                          [activeRecord.id]: {
                            ...prev[activeRecord.id],
                            bed,
                          },
                        }));
                        setActionSuccessMessage(`✓ Alokasi bed ${bed} untuk ${activeRecord.rmCode || activeRecord.id} berhasil disimpan.`);
                        setTimeout(() => setActionSuccessMessage(null), 3500);
                      }
                    }}
                    onOpenSuratRujukan={() => {
                      if (activeRecord) setSelectedSuratRecord(activeRecord);
                    }}
                    doctorNote={doctorNoteInput}
                    onSaveDoctorNote={(note) => {
                      setDoctorNoteInput(note);
                      if (activeRecord) {
                        setActionSuccessMessage(`✓ Catatan dokter untuk ${activeRecord.rmCode || activeRecord.id} berhasil disimpan.`);
                        setTimeout(() => setActionSuccessMessage(null), 3500);
                      }
                    }}
                    allAssessments={centralAssessments}
                    onSelectAssessmentFromHistory={(id) => setSelectedRecordId(id)}
                    onConfirmT0={() => {
                      if (activeRecord) handleConfirmRujukan(activeRecord.id);
                    }}
                    onDowngradeTier={(tier) => {
                      if (activeRecord) handleDowngradeStatus(activeRecord.id, tier);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          {/* TAB 2: ANTREAN (FULL QUEUE MANAGEMENT) */}
          {sidebarTab === 'antrian' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Antrean Pasien Triase</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar lengkap urutan pasien masuk, status prioritas kegawatdaruratan, dan penugasan penanganan medis.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                    Total: {faskesCandidates.length} Pasien
                  </span>
                </div>
              </div>

              {/* Filter Pills & Search */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  {(['ALL', 'T0', 'T1', 'T2', 'T3'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setQueueFilter(tier)}
                      className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                        queueFilter === tier
                          ? tier === 'T0'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : tier === 'T1'
                            ? 'bg-orange-600 text-white shadow-2xs'
                            : tier === 'T2'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : tier === 'T3'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                      }`}
                    >
                      {tier === 'ALL' ? 'Semua' : tier}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, ID, atau gejala..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Antrian Table */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/70">
                      <tr>
                        <th className="py-3.5 px-4">Pasien</th>
                        <th className="py-3.5 px-4">Lokasi Posko</th>
                        <th className="py-3.5 px-4">Prioritas Triase</th>
                        <th className="py-3.5 px-4">Skor SRQ-20</th>
                        <th className="py-3.5 px-4">Alokasi Bed / Status</th>
                        <th className="py-3.5 px-4 text-right">Aksi Tindak Lanjut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredQueue.map((item) => {
                        const tier = getRecordTier(item);
                        const t0Stat = getRecordT0Status(item);
                        const rmId = item.rmCode || item.recordId || item.id;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block">{item.victimName || 'Tanpa Nama'}</span>
                              <span className="font-mono text-[10px] text-slate-400 block">{rmId} · {item.victimCategory || 'Dewasa'}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              <span className="font-medium block">{item.location}</span>
                              <span className="text-[10px] text-slate-400 block">{item.timestamp} WIB</span>
                            </td>
                            <td className="py-3.5 px-4">
                              {tier === 'T0' ? (
                                <span className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase">
                                  {t0Stat === 'T0-Confirmed' ? 'T0-CONFIRMED' : 'T0-SUSPECT'}
                                </span>
                              ) : tier === 'T1' ? (
                                <span className="bg-orange-50 text-orange-800 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-orange-200">
                                  T1 · High Risk
                                </span>
                              ) : tier === 'T2' ? (
                                <span className="bg-amber-50 text-amber-800 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-amber-200">
                                  T2 · Moderate
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-emerald-200">
                                  T3 · Low Risk
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900">{item.score}</span>
                              <span className="text-slate-400 text-[10px]"> / 20</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              <span className="font-medium text-xs block">{patientStatuses[item.id]?.bed || 'Menunggu Alokasi'}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRecordId(item.id);
                                    setSidebarTab('dashboard');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] transition cursor-pointer"
                                >
                                  Periksa Triase
                                </button>
                                {tier === 'T0' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRecordId(item.id);
                                      setIsTeleModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  >
                                    <IconPhoneCall className="w-3.5 h-3.5" stroke={2} />
                                    <span>Tele-Emergency</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RUJUKAN & TRANSPORT (REFERRAL & PSC 119 DISPATCH) */}
          {sidebarTab === 'rujukan' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                      Protokol Rujukan Bencana · Role 2 Faskes & PSC 119
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Alur Dokumen Hal. 131 & 258</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                    Pusat Kendali Rujukan Medis & Pelacakan Transportasi (PSC 119)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Koordinasi evakuasi medis darurat (T0 Kritis) via PSC 119, penerbitan Surat Rujukan Medis resmi, dan penjadwalan Poli Jiwa / Psikiatri (T1 Risiko Tinggi).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (rujukanQueue.length > 0) {
                        setSelectedSuratRecord(rujukanQueue[0]);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Terbitkan Surat Rujukan Baru</span>
                  </button>
                </div>
              </div>

              {/* Rujukan KPI Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-400 block">Total Pasien Rujukan</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">{rujukanQueue.length} Pasien</span>
                  <span className="text-[11px] text-slate-500 font-medium">Memerlukan penanganan faskes lanjutan</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-400 block">Armada Ambulans Siaga (PSC 119)</span>
                  <span className="text-2xl font-black text-rose-600 block mt-1">4 Unit Siaga</span>
                  <span className="text-[11px] text-rose-600 font-medium">Siap dispatch evakuasi darurat</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-400 block">RS Rujukan Utama</span>
                  <span className="text-sm font-black text-slate-900 block mt-1 truncate">{targetHospital}</span>
                  <span className="text-[11px] text-emerald-600 font-medium">14 Bed IGD Tersedia</span>
                </div>
              </div>

              {/* Transport Tracking Board */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Pelacakan Transportasi Ambulans & Evakuasi Medis (PSC 119)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pemantauan tahapan evakuasi berjenjang 4 fase dari posko pengungsian menuju IGD rumah sakit rujukan.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {rujukanQueue.slice(0, 4).map((item) => {
                    const stage = patientStatuses[item.id]?.transportStage || (getRecordTier(item) === 'T0' ? 'dispatch' : 'on_site');
                    const stageIndex = stage === 'dispatch' ? 0 : stage === 'on_site' ? 1 : stage === 'en_route_hospital' ? 2 : 3;
                    const rmId = item.rmCode || item.recordId || item.id;

                    return (
                      <div key={item.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-800">{rmId}</span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                getRecordTier(item) === 'T0'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-orange-100 text-orange-800 border border-orange-200'
                              }`}>
                                {getRecordTier(item)} {getRecordTier(item) === 'T0' ? '· Kritis Darurat' : '· Risiko Tinggi'}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{item.victimName || 'Penyintas Tanpa Nama'}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                              <IconMapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>Asal: <strong>{item.location}</strong></span>
                              <span className="text-slate-300">➔</span>
                              <span>Tujuan: <strong className="text-blue-700">{patientStatuses[item.id]?.bed ? `${targetHospital} (${patientStatuses[item.id]?.bed})` : targetHospital}</strong></span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSuratRecord(item)}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>Surat Rujukan</span>
                            </button>
                            {getRecordTier(item) === 'T0' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRecordId(item.id);
                                  setIsTeleModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <IconVideo className="w-3.5 h-3.5" />
                                <span>Tele-Emergency</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAdvanceTransportStage(item.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Lanjut Tahap</span>
                            </button>
                          </div>
                        </div>

                        {/* 4-Step Visual Stepper */}
                        <div className="pt-2">
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {[
                              { label: '1. Dispatch Armada', desc: 'Ambulans meluncur' },
                              { label: '2. Tiba di Posko', desc: 'Stabilisasi pasien' },
                              { label: '3. Evakuasi ke RS', desc: 'Dalam perjalanan' },
                              { label: '4. Tiba di IGD', desc: 'Serah terima medis' },
                            ].map((step, idx) => {
                              const isCompleted = stageIndex > idx;
                              const isCurrent = stageIndex === idx;

                              return (
                                <div
                                  key={idx}
                                  className={`p-2.5 rounded-xl border transition ${
                                    isCurrent
                                      ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs font-bold'
                                      : isCompleted
                                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                                      : 'bg-white border-slate-200 text-slate-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                                    {isCompleted ? (
                                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : isCurrent ? (
                                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                                    )}
                                    <span>{step.label}</span>
                                  </div>
                                  <p className="text-[10px] mt-0.5 opacity-80">{step.desc}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ASESMEN (CLINICAL ASSESSMENTS LIST) */}
          {sidebarTab === 'asesmen' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Daftar Asesmen Klinis & Protokol Penapisan</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hasil skrining instrumen SRQ-20, faktor risiko, dan penilaian domain fungsional posko lapangan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faskesCandidates.map((item) => {
                  const tier = getRecordTier(item);
                  const rmId = item.rmCode || item.recordId || item.id;
                  return (
                    <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-700">{rmId}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tier === 'T0' ? 'bg-rose-100 text-rose-800' :
                          tier === 'T1' ? 'bg-orange-100 text-orange-800' :
                          tier === 'T2' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {tier}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{item.victimName}</h3>
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        "{item.transcript || 'Pemeriksaan rutin posko'}"
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500">Skor SRQ: <strong>{item.score}/20</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecordId(item.id);
                            setSidebarTab('dashboard');
                          }}
                          className="text-blue-700 font-bold hover:underline cursor-pointer"
                        >
                          Lihat di Ruang Triase ➔
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: DATA (CENTRAL DATABASE & CSV EXPORT) */}
          {sidebarTab === 'data' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Pusat Basis Data & Rekapitulasi Pasien</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Basis data rekam medis faskes, sinkronisasi IndexedDB lokal, dan ekspor pelaporan resmi tanggap bencana.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Ekspor CSV Data Pasien</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/70">
                      <tr>
                        <th className="py-3 px-4">ID Rekam Medis</th>
                        <th className="py-3 px-4">Nama Pasien</th>
                        <th className="py-3 px-4">Posko</th>
                        <th className="py-3 px-4">Triage</th>
                        <th className="py-3 px-4">SRQ-20</th>
                        <th className="py-3 px-4">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {faskesCandidates.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{item.rmCode || item.recordId || item.id}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{item.victimName}</td>
                          <td className="py-3 px-4 text-slate-600">{item.location}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                              {getRecordTier(item)}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold">{item.score}/20</td>
                          <td className="py-3 px-4 text-slate-500">{item.timestamp} WIB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: RELAWAN (FIELD VOLUNTEERS DIRECTORY) */}
          {sidebarTab === 'relawan' && (
            <div className="space-y-5 animate-in fade-in">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Jaringan Tim Relawan & Posko Lapangan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { posko: 'Posko 01 - Balai RW 05', loc: 'Wonosari, Klaten', team: 'Tim Medis Relawan A' },
                  { posko: 'Posko 02 - Stadion Utama', loc: 'Pengungsian Sektor B', team: 'Tim PFA Dinkes & Kemenkes' },
                  { posko: 'Posko 03 - Balai Desa Cempaka', loc: 'Kecamatan Cempaka', team: 'Relawan BPBD Posko C' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ● Aktif Terhubung
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{item.posko}</h3>
                    <p className="text-xs text-slate-500">{item.loc} · {item.team}</p>
                    <button
                      type="button"
                      onClick={handleOpenTeleEmergency}
                      className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <IconPhoneCall className="w-3.5 h-3.5" />
                      <span>Panggil Tele-Emergency</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: PENGATURAN */}
          {sidebarTab === 'pengaturan' && (
            <div className="space-y-5 animate-in fade-in max-w-3xl">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Pengaturan Fasilitas Pelayanan Kesehatan</h2>
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Rumah Sakit Rujukan Utama (IGD Jiwa):</label>
                  <input
                    type="text"
                    value={targetHospital}
                    onChange={(e) => setTargetHospital(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Dokter Penanggung Jawab Pelayanan (DPJP):</label>
                  <input
                    type="text"
                    defaultValue={currentUser?.name || 'dr. Budi Santoso, Sp.KJ'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      <TeleEmergencyModal
        isOpen={isTeleModalOpen}
        onClose={() => setIsTeleModalOpen(false)}
        activeRecord={activeRecord}
        activeTier={activeTier}
        callActive={teleCallActive}
        onToggleCall={() => setTeleCallActive(!teleCallActive)}
        teleNotes={teleNotesInput}
        onTeleNotesChange={setTeleNotesInput}
        onConfirmEmergency={handleConfirmRujukan}
        onDowngradeStatus={handleDowngradeStatus}
      />

      <SuratRujukanModal
        isOpen={selectedSuratRecord !== null}
        onClose={() => setSelectedSuratRecord(null)}
        record={selectedSuratRecord}
        getRecordTier={getRecordTier}
        targetHospital={targetHospital}
        selectedDiagnosis={selectedDiagnosis}
        onDiagnosisChange={setSelectedDiagnosis}
      />
    </div>
  );
};
