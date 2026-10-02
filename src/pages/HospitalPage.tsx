import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowDownRight,
  ChevronRight,
  ChevronDown,
  FileText,
  ArrowLeft,
  ArrowRight,
  Check,
  Save,
  Search,
  Calendar,
  User,
  ClipboardList,
  FileEdit,
  LayoutDashboard,
  ListFilter,
  Power,
  AlertTriangle,
  Download,
  Printer,
} from 'lucide-react';
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import {
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import {
  IconBrain,
  IconBuildingHospital,
  IconStethoscope,
  IconAmbulance,
  IconBed,
  IconPhoneCall,
  IconVideo,
  IconBroadcast,
  IconMapPin,
  IconActivityHeartbeat,
  IconReportMedical,
  IconHeartRateMonitor,
  IconDatabase,
  IconUsers,
  IconSettings,
  IconBolt,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import { AssessmentRecord, TriageTier, T0EmergencyStatus } from '../types/assessment';
import { emergencyService } from '../services/emergencyService';

interface HospitalPageProps {}

type WorkspaceTab = 'ringkasan' | 'asesmen' | 'catatan' | 'tindakan' | 'riwayat';
type SidebarTab = 'dashboard' | 'antrian' | 'rujukan' | 'asesmen' | 'data' | 'relawan' | 'pengaturan';
type QueueFilter = 'ALL' | 'T0' | 'T1' | 'T2' | 'T3';

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
      bed: 'Menunggu Alokasi IGD',
    },
  });

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('dashboard');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('ringkasan');
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'T0' | 'T1' | 'T2' | 'T3'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [asesmenFilter, setAsesmenFilter] = useState<'ALL' | 'SUISIDA' | 'PSIKOTIK' | 'AGRESIF' | 'SOMATIK'>('ALL');
  const [dataSearchQuery, setDataSearchQuery] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('RM-2026-000089');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Referral states
  const [selectedSuratRecord, setSelectedSuratRecord] = useState<AssessmentRecord | null>(null);
  const [rujukanFilter, setRujukanFilter] = useState<'ALL' | 'T0' | 'T1'>('ALL');
  const [targetHospital, setTargetHospital] = useState<string>('RSUD Sayang Cianjur - IGD Psikiatri Terpadu');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>(
    'F43.0 Reaksi Stres Akut Berat dengan Agitasi (Acute Stress Reaction)'
  );

  // Tele-Emergency modal state
  const [isTeleModalOpen, setIsTeleModalOpen] = useState(false);
  const [teleCallActive, setTeleCallActive] = useState(false);
  const [teleNotesInput, setTeleNotesInput] = useState('');
  const [doctorNoteInput, setDoctorNoteInput] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Deduplicate and process central assessments
  const faskesCandidates = useMemo(() => {
    const map = new Map<string, AssessmentRecord>();
    for (const record of centralAssessments) {
      const patientKey = record.victimId || record.id;
      if (!map.has(patientKey)) {
        map.set(patientKey, record);
      }
    }
    return Array.from(map.values());
  }, [centralAssessments]);

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

  // Queue filtering based on T0, T1, T2, T3, ALL
  const filteredQueue = useMemo(() => {
    return faskesCandidates.filter((r) => {
      const tier = getRecordTier(r);
      const matchesSearch =
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.victimName && r.victimName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.transcript && r.transcript.toLowerCase().includes(searchQuery.toLowerCase()));

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

      const matchesSearch =
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.victimName && r.victimName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.transcript && r.transcript.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        rujukanFilter === 'ALL' ||
        (rujukanFilter === 'T0' && tier === 'T0') ||
        (rujukanFilter === 'T1' && tier === 'T1');

      return matchesSearch && matchesFilter;
    });
  }, [faskesCandidates, searchQuery, rujukanFilter, patientStatuses]);

  // Real-time counts for filters (Semua, T0, T1, T2, T3)
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
      (r) => r.id === selectedRecordId || r.victimId === selectedRecordId
    );
    if (inFiltered) return inFiltered;

    if (filteredQueue.length > 0) return filteredQueue[0];

    const found = faskesCandidates.find(
      (r) => r.id === selectedRecordId || r.victimId === selectedRecordId
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
        bed: 'IGD Psikiatri Bed 01',
        teleNotes:
          teleNotesInput ||
          `Terverifikasi via Tele-Emergency oleh ${decider} (${timestamp} WIB): Pasien dalam kondisi distres akut valid.`,
      },
    }));

    setActionSuccessMessage(
      `✓ [T0-CONFIRMED] Rujukan Disetujui: Pasien ${recordId} divalidasi oleh ${decider} (${timestamp} WIB). Armada PSC 119 diberangkatkan.`
    );
    setIsTeleModalOpen(false);
    setTimeout(() => setActionSuccessMessage(null), 6000);

    emergencyService.confirmEmergency(recordId, decider, teleNotesInput, 'IGD Psikiatri Bed 01').catch(() => {});
  };

  const handleDowngradeStatus = (recordId: string, targetTier: 'T1' | 'T2') => {
    const decider = currentUser?.name || 'dr. Budi Santoso, Sp.KJ';
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setPatientStatuses((prev) => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        t0Status: 'Downgraded',
        downgradedTier: targetTier,
        doctor: decider,
        teleNotes:
          teleNotesInput ||
          `Diturunkan status ke ${targetTier} oleh ${decider} (${timestamp} WIB) pasca verifikasi klinis relawan.`,
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
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nama', 'Kelompok', 'Lokasi Posko', 'Tier Triase', 'Status T0', 'Skor SRQ20', 'Skor Risiko', 'Skor Fungsi', 'Waktu'];
    const rows = faskesCandidates.map((r) => [
      r.victimId || r.id,
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* ============================================================ */}
      {/* 1. TOP NAVBAR (RAPID MIND + STATUS + USER PROFILE)           */}
      {/* ============================================================ */}
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-xs">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200/60 flex items-center justify-center shadow-xs shrink-0">
            <IconBrain className="w-5 h-5 text-rose-600" stroke={2} />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-none">
              RAPID MIND
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight mt-0.5">
              Emergency Psychological Triage
            </p>
          </div>
        </div>

        {/* Right: Operational Telemetry & Profile */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Faskes Operational Status: Terhubung Real-Time */}
          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50/70 text-emerald-700 text-xs font-semibold"
            title="Portal Faskes & Rujukan Terhubung Langsung ke PSC 119"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Terhubung · PSC 119 Aktif</span>
          </div>

          {/* Timestamp */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>1 Okt 2026, 14:28</span>
          </div>

          {/* Doctor Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-300">
                DS
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-900 leading-tight block">
                  {currentUser?.name || 'dr. Budi Santoso, Sp.KJ'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Tenaga Medis
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-800">{currentUser?.name || 'dr. Budi Santoso, Sp.KJ'}</p>
                  <p className="text-[10px] text-slate-400">{currentUser?.username || 'dokter.spkj'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer transition"
                >
                  <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                  <span>Keluar Akun (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Action Toast Alert Banner */}
      {actionSuccessMessage && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-white" />
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

      {/* ============================================================ */}
      {/* 2. BODY CONTAINER (SIDEBAR + MAIN CONTENT WORKSPACE)          */}
      {/* ============================================================ */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)]">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-52 shrink-0 bg-white border-r border-slate-100 p-4 flex-col justify-between hidden md:flex">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setSidebarTab('dashboard')}
              className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 text-xs transition cursor-pointer ${
                sidebarTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-700" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('antrian')}
              className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 text-xs transition cursor-pointer ${
                sidebarTab === 'antrian'
                  ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
            >
              <ListFilter className="w-4 h-4 text-slate-500" />
              <span>Antrian</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('rujukan')}
              className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center justify-between text-xs transition cursor-pointer ${
                sidebarTab === 'rujukan'
                  ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconAmbulance className="w-4 h-4 text-rose-600" />
                <span>Rujukan & Transport</span>
              </div>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {faskesCandidates.filter(r => getRecordTier(r) === 'T0' || getRecordTier(r) === 'T1').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('asesmen')}
              className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 text-xs transition cursor-pointer ${
                sidebarTab === 'asesmen'
                  ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-slate-500" />
              <span>Asesmen</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('data')}
              className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 text-xs transition cursor-pointer ${
                sidebarTab === 'data'
                  ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
            >
              <IconDatabase className="w-4 h-4 text-slate-500" stroke={2} />
              <span>Data</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('relawan')}
              className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 text-xs transition cursor-pointer ${
                sidebarTab === 'relawan'
                  ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
            >
              <IconUsers className="w-4 h-4 text-slate-500" stroke={2} />
              <span>Relawan</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('pengaturan')}
              className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 text-xs transition cursor-pointer ${
                sidebarTab === 'pengaturan'
                  ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
            >
              <IconSettings className="w-4 h-4 text-slate-500" stroke={2} />
              <span>Pengaturan</span>
            </button>
          </div>

          {/* Sidebar Bottom: Faskes Status Info */}
          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium text-center">
            <span>RAPID-MIND v2.0 · Faskes Terpadu</span>
          </div>
        </aside>

        {/* MAIN BODY CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* ============================================================ */}
          {/* TAB 1: DASHBOARD (EXECUTIVE OVERVIEW + TWO-COLUMN SPLIT)     */}
          {/* ============================================================ */}
          {sidebarTab === 'dashboard' && (
            <div className="space-y-6">
              {/* ============================================================ */}
              {/* 3. TOP 4 METRICS KPI STRIP                                   */}
              {/* ============================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Korban */}
            <div
              onClick={() => setQueueFilter('ALL')}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition"
              title="Klik untuk menampilkan semua antrean"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <IconUsers className="w-5 h-5 text-emerald-600" stroke={2} />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Total Korban</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">15</span>
                    <span className="text-xs text-slate-400 font-medium">hari ini</span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                +12%
              </span>
            </div>

            {/* 2. Sedang Aktif */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <IconBolt className="w-5 h-5 text-blue-600" stroke={2} />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Sedang Aktif</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">2</span>
                    <span className="text-xs text-slate-400 font-medium">asesmen</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-semibold">—</span>
            </div>

            {/* 3. Zona Merah */}
            <div
              onClick={() => setQueueFilter('T0')}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-rose-300 transition"
              title="Klik untuk memfilter antrean ke Zona Merah (T0)"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldExclamationIcon className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Zona Merah</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">{counts.merah || 1}</span>
                    <span className="text-xs text-slate-400 font-medium">kasus</span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                +1
              </span>
            </div>

            {/* 4. Rata-rata Waktu */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <ClockIcon className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Rata-rata Waktu</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">3:24</span>
                    <span className="text-xs text-slate-400 font-medium">menit</span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                -28%
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 4. MAIN TWO-COLUMN SPLIT (QUEUE + CLINICAL WORKSPACE)        */}
          {/* ============================================================ */}
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* ========================================================== */}
            {/* LEFT COLUMN: ANTRIAN KORBAN (QUEUE)                        */}
            {/* ========================================================== */}
            <div className="col-span-12 lg:col-span-5 xl:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-xs">
              {/* Header Title with Dedicated Counter Badge */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Antrian Korban</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Urutan berdasarkan prioritas dan waktu masuk.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {filteredQueue.length} Pasien
                  </span>
                </div>
              </div>

              {/* Status Filter Buttons: Clean T0, T1, T2, T3, Semua (without adjacent count numbers) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setQueueFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                    queueFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  Semua
                </button>

                <button
                  type="button"
                  onClick={() => setQueueFilter('T0')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                    queueFilter === 'T0'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  T0
                </button>

                <button
                  type="button"
                  onClick={() => setQueueFilter('T1')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                    queueFilter === 'T1'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  T1
                </button>

                <button
                  type="button"
                  onClick={() => setQueueFilter('T2')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                    queueFilter === 'T2'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  T2
                </button>

                <button
                  type="button"
                  onClick={() => setQueueFilter('T3')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                    queueFilter === 'T3'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  T3
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, ID, atau gejala..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              {/* Patient Count Status Summary */}
              <div className="text-[11px] text-slate-500 px-0.5 pt-0.5 border-b border-slate-100 pb-2">
                <span>
                  {queueFilter === 'ALL'
                    ? `Menampilkan ${filteredQueue.length} dari ${counts.total} pasien`
                    : `Menampilkan ${filteredQueue.length} pasien (${queueFilter})`}
                </span>
              </div>

              {/* Patient Queue Cards List */}
              <div className="space-y-2.5 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
                {filteredQueue.length > 0 ? (
                  filteredQueue.map((item) => {
                    const tier = getRecordTier(item);
                    const isT0 = tier === 'T0';
                    const isT1 = tier === 'T1';
                    const isT2 = tier === 'T2';
                    const isT3 = tier === 'T3';
                    const isSelected = activeRecord?.id === item.id || activeRecord?.victimId === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedRecordId(item.id)}
                        className={`rounded-2xl p-3.5 transition cursor-pointer text-xs relative ${
                          isSelected
                            ? isT0
                              ? 'border-2 border-rose-500 bg-white shadow-xs'
                              : isT1
                              ? 'border-2 border-orange-500 bg-white shadow-xs'
                              : isT2
                              ? 'border-2 border-amber-500 bg-white shadow-xs'
                              : 'border-2 border-emerald-500 bg-white shadow-xs'
                            : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        {/* Top Header: Avatar + Name + ID + Tier Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                isT0
                                  ? 'bg-rose-100 text-rose-600'
                                  : isT1
                                  ? 'bg-orange-100 text-orange-700'
                                  : isT2
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate leading-tight capitalize">
                                {item.victimName || item.id}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 block truncate">
                                {item.victimId || item.id}
                              </span>
                            </div>
                          </div>

                          {/* Priority Badge */}
                          <div className="shrink-0">
                            {isT0 ? (
                              <span className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                <span>●</span>
                                <span>TO-SUSPECT</span>
                              </span>
                            ) : isT1 ? (
                              <span className="bg-orange-50 text-orange-800 font-bold text-[10px] px-2 py-0.5 rounded-lg border border-orange-200 flex items-center gap-1">
                                <span>▲</span>
                                <span>T1 - HIGH RISK</span>
                              </span>
                            ) : isT2 ? (
                              <span className="bg-amber-50 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                                <span>⚡</span>
                                <span>T2 - MODERATE RISK</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                                <span>♥</span>
                                <span>T3 - LOW RISK</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: Location & Time */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pl-9">
                          <div className="flex items-center gap-1">
                            <IconMapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{item.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 font-mono">
                            <ClockIcon className="w-3 h-3" />
                            <span>{item.timestamp}</span>
                          </div>
                        </div>

                        {/* Bottom Snippet Quote */}
                        <div className="mt-1.5 pl-9 flex items-center justify-between">
                          <p className="text-xs text-slate-500 line-clamp-1 italic">
                            {item.transcript || item.volunteerNotes || 'Menunggu validasi nakes...'}
                          </p>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 ml-1" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-bold text-slate-600">Tidak ada antrean korban</p>
                    <p className="text-[11px]">
                      Tidak ada pasien di antrean dengan status {queueFilter === 'ALL' ? 'ini' : queueFilter}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================== */}
            {/* RIGHT COLUMN: PATIENT DETAIL CLINICAL WORKSPACE            */}
            {/* ========================================================== */}
            {activeRecord ? (
              <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-4">
                {/* 1. Detail Header Bar */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                  {/* Top Row: Back + ID + Badge + Emergency Button + Menu */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={filteredQueue.findIndex((r) => r.id === activeRecord.id) <= 0}
                          onClick={() => {
                            const idx = filteredQueue.findIndex((r) => r.id === activeRecord.id);
                            if (idx > 0) setSelectedRecordId(filteredQueue[idx - 1].id);
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-600 flex items-center justify-center transition cursor-pointer"
                          title="Pasien Sebelumnya"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={filteredQueue.findIndex((r) => r.id === activeRecord.id) >= filteredQueue.length - 1}
                          onClick={() => {
                            const idx = filteredQueue.findIndex((r) => r.id === activeRecord.id);
                            if (idx >= 0 && idx < filteredQueue.length - 1) setSelectedRecordId(filteredQueue[idx + 1].id);
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-600 flex items-center justify-center transition cursor-pointer"
                          title="Pasien Selanjutnya"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {activeRecord.victimId || activeRecord.id}
                      </span>
                      {activeTier === 'T0' ? (
                        <span className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                          <span>●</span>
                          <span>TO-SUSPECT</span>
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
                        onClick={handleOpenTeleEmergency}
                        className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition"
                      >
                        <ShieldExclamationIcon className="w-4 h-4 text-white" />
                        <span>Mulai Tindakan Darurat</span>
                      </button>
                    </div>
                  </div>

                  {/* Name & Demographics Subtitle */}
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
                      {activeRecord.victimName || activeRecord.id}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      NR: Belum Tercatat · Kelompok: {activeRecord.victimCategory || 'Dewasa'}
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
                        {activeRecord.location}
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
                        {activeRecord.victimAge ? `${activeRecord.victimAge} th` : '-'} /{' '}
                        {activeRecord.victimGender === 'P' ? 'Perempuan' : 'Laki-laki'}
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
                        {activeRecord.timestamp} WIB
                      </p>
                    </div>

                    {/* Box 4: Sumber */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Sumber
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {activeT0Status || 'Menunggu Validasi'}
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
                      className={`pb-3 font-bold transition flex items-center gap-2 cursor-pointer ${
                        workspaceTab === 'ringkasan'
                          ? 'text-rose-600 border-b-2 border-rose-600'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ringkasan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkspaceTab('asesmen')}
                      className={`pb-3 font-semibold transition flex items-center gap-2 cursor-pointer ${
                        workspaceTab === 'asesmen'
                          ? 'text-rose-600 border-b-2 border-rose-600 font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Asesmen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkspaceTab('catatan')}
                      className={`pb-3 font-semibold transition flex items-center gap-2 cursor-pointer ${
                        workspaceTab === 'catatan'
                          ? 'text-rose-600 border-b-2 border-rose-600 font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Catatan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkspaceTab('tindakan')}
                      className={`pb-3 font-semibold transition flex items-center gap-2 cursor-pointer ${
                        workspaceTab === 'tindakan'
                          ? 'text-rose-600 border-b-2 border-rose-600 font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <IconStethoscope className="w-3.5 h-3.5" />
                      <span>Tindakan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkspaceTab('riwayat')}
                      className={`pb-3 font-semibold transition flex items-center gap-2 cursor-pointer ${
                        workspaceTab === 'riwayat'
                          ? 'text-rose-600 border-b-2 border-rose-600 font-bold'
                          : 'text-slate-500 hover:text-slate-900'
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
                    {/* A. Status Kritis Banner */}
                    <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
                      <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-black">
                        <Power className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-rose-950">
                          Status Kritis: {activeT0Status || (activeTier === 'T0' ? 'To-Suspect' : activeTier)}
                        </h3>
                        <p className="text-xs text-rose-900/90 leading-relaxed">
                          Kasus terdeteksi memiliki sinyal kegawatdaruratan psikiatri/medis aktif dari posko. Segera
                          lakukan validasi sekunder melalui sambungan Tele-Emergency dengan relawan.
                        </p>
                      </div>
                    </div>

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
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 leading-relaxed">
                          <strong className="text-slate-900">1. Risiko keamanan jiwa:</strong>{' '}
                          <span className="text-slate-600">
                            spesifik rencana/ungkapan ingin mati (SRQ-17) atau tindakan menyakiti diri aktif
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 leading-relaxed">
                          <strong className="text-slate-900">2. Gejala psikotik akut:</strong>{' '}
                          <span className="text-slate-600">
                            halusinasi visual/auditori, waham paranoid, atau disorganisasi/ucapan tidak terkontrol
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 leading-relaxed">
                          <strong className="text-slate-900">3. Perilaku agresif & gangguan kontrol impuls:</strong>{' '}
                          <span className="text-slate-600">
                            amuk/agresif fisik merusak atau ancaman pada sekitaran tak terkendali
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 leading-relaxed">
                          <strong className="text-slate-900">4. Kegawatdaruratan medis & somatik akut:</strong>{' '}
                          <span className="text-slate-600">
                            penurunan kesadaran, kejang, hipertermia, atau cedera berat lainnya
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
                              {activeRecord.score} / 20
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium block">Distres Psikologis</span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase">PHQ-9</span>
                            <span className="text-base font-black text-slate-900 block my-0.5">
                              {activeRecord.riskFactorScore ?? 0} / 8
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium block">Depresi</span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase">GAD-7</span>
                            <span className="text-base font-black text-slate-900 block my-0.5">
                              {activeRecord.functionalScoreTotal ?? 0} / 9
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium block">Kecemasan</span>
                          </div>

                          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                            <span className="text-[10px] text-blue-600 block font-bold uppercase">Klasifikasi</span>
                            <span className="text-base font-black text-blue-700 block my-0.5">
                              {activeTier === 'T0' ? 'TO' : activeTier}
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
                            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                              <IconAmbulance className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-700 block leading-tight">
                              1. Dispatch Armada
                            </span>
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 inline-block">
                              Menunggu
                            </span>
                          </div>

                          <div className="space-y-1.5 opacity-60">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                              <IconMapPin className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-medium text-slate-600 block leading-tight">
                              2. Tiba di Posko
                            </span>
                            <span className="text-[9px] text-slate-400 block">—</span>
                          </div>

                          <div className="space-y-1.5 opacity-60">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                              <IconBuildingHospital className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-medium text-slate-600 block leading-tight">
                              3. Evakuasi ke RS
                            </span>
                            <span className="text-[9px] text-slate-400 block">—</span>
                          </div>

                          <div className="space-y-1.5 opacity-60">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                              <IconBed className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-medium text-slate-600 block leading-tight">
                              4. Rawat Inap ICU
                            </span>
                            <span className="text-[9px] text-slate-400 block">—</span>
                          </div>
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
                      <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg font-bold">
                        Skor: {activeRecord.score} / 20
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800">Transkrip Percakapan / Keluhan Utama:</h4>
                      <p className="p-3 bg-slate-50 rounded-xl text-slate-700 italic border border-slate-200 leading-relaxed">
                        "{activeRecord.transcript || 'Tidak ada transkrip audio yang direkam.'}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800">Indikator Terpilih Relawan:</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {activeRecord.indicators.map((ind, i) => (
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
                      <p className="text-blue-900 leading-relaxed">{activeRecord.recommendedAction}</p>
                    </div>
                  </div>
                )}

                {/* Tab: Catatan */}
                {workspaceTab === 'catatan' && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in text-xs">
                    <h3 className="text-sm font-bold text-slate-900">Catatan Medis & Validasi Klinis Dokter</h3>
                    <textarea
                      value={doctorNoteInput}
                      onChange={(e) => setDoctorNoteInput(e.target.value)}
                      rows={4}
                      placeholder="Tuliskan catatan observasi klinis, arahan medikasi, atau instruksi rujukan..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActionSuccessMessage(`✓ Catatan dokter untuk ${activeRecord.id} berhasil disimpan.`);
                        setTimeout(() => setActionSuccessMessage(null), 4000);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition"
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
                        onClick={() => handleConfirmRujukan(activeRecord.id)}
                        className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <CheckCircleIcon className="w-5 h-5 text-white" />
                        <span>Konfirmasi T0-Confirmed</span>
                        <span className="text-[10px] font-normal opacity-90">Kirim Armada PSC 119</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDowngradeStatus(activeRecord.id, 'T1')}
                        className="p-4 rounded-2xl bg-white hover:bg-orange-50 text-orange-950 font-bold border border-orange-300 shadow-2xs flex flex-col items-center justify-center gap-1.5 transition"
                      >
                        <ArrowDownRight className="w-5 h-5 text-orange-600" />
                        <span>Downgrade ke T1</span>
                        <span className="text-[10px] font-normal text-orange-800">Risiko Tinggi Non-Kritis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDowngradeStatus(activeRecord.id, 'T2')}
                        className="p-4 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 font-bold border border-amber-300 shadow-2xs flex flex-col items-center justify-center gap-1.5 transition"
                      >
                        <ArrowDownRight className="w-5 h-5 text-amber-600" />
                        <span>Downgrade ke T2</span>
                        <span className="text-[10px] font-normal text-amber-800">Distres Sedang Posko</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <label className="font-bold text-slate-800 block mb-1.5">Alokasi Bed Rumah Sakit:</label>
                      <select
                        defaultValue={patientStatuses[activeRecord.id]?.bed || 'IGD Bed 01'}
                        onChange={(e) => {
                          setPatientStatuses((prev) => ({
                            ...prev,
                            [activeRecord.id]: {
                              ...prev[activeRecord.id],
                              bed: e.target.value,
                            },
                          }));
                          setActionSuccessMessage(`✓ Bed berhasil dialokasikan: ${e.target.value}`);
                          setTimeout(() => setActionSuccessMessage(null), 4000);
                        }}
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
                          Penerbitan surat rujukan resmi berstandar Kemenkes / Dinkes (Alur Dokumen Hal. 131) untuk RSUD / RS Jiwa.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSuratRecord(activeRecord)}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center gap-2 border border-blue-200 transition cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Terbitkan Surat Rujukan Resmi (Cetak / PDF)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab: Riwayat */}
                {workspaceTab === 'riwayat' && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in text-xs">
                    <h3 className="text-sm font-bold text-slate-900">Jejak Audit & Timeline Kasus</h3>
                    <div className="space-y-2 border-l-2 border-slate-200 pl-4">
                      <div className="relative">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1" />
                        <p className="font-bold text-slate-900">{activeRecord.timestamp} WIB · Skrining Posko</p>
                        <p className="text-slate-500 text-[11px]">
                          Asesmen tercatat di {activeRecord.location} oleh relawan ({activeRecord.method}).
                        </p>
                      </div>
                      <div className="relative pt-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 absolute -left-[21px] top-3" />
                        <p className="font-bold text-slate-900">10:21 WIB · Sinyal T0-Suspect</p>
                        <p className="text-slate-500 text-[11px]">
                          Pemicu red flag terdeteksi, sinyal diteruskan instan ke Dashboard Faskes & PSC 119.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="col-span-12 lg:col-span-7 xl:col-span-8 bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400">
                Pilih pasien dari antrian korban di sebelah kiri.
              </div>
            )}
          </div>
        </div>
      )}

          {/* ============================================================ */}
          {/* TAB 2: ANTRIAN (FULL QUEUE MANAGEMENT)                       */}
          {/* ============================================================ */}
          {sidebarTab === 'antrian' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Antrian Pasien Triase</h2>
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
                    placeholder="Cari pasien, posko, atau gejala..."
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
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block">{item.victimName || 'Tanpa Nama'}</span>
                              <span className="font-mono text-[10px] text-slate-400 block">{item.victimId || item.id} · {item.victimCategory || 'Dewasa'}</span>
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

          {/* ============================================================ */}
          {/* TAB: RUJUKAN & TRANSPORT (REFERRAL & PSC 119 DISPATCH)       */}
          {/* ============================================================ */}
          {sidebarTab === 'rujukan' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header */}
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
                    <span>Terbitkan Surat Rujukan</span>
                  </button>
                </div>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white border border-rose-200/80 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Rujukan Darurat T0</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                      <IconAmbulance className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-600">{counts.t0}</span>
                    <span className="text-xs text-slate-500">Pasien Kritis</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Target Respon: &lt;15 Menit</span>
                    <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">Evakuasi PSC 119</span>
                  </div>
                </div>

                <div className="bg-white border border-orange-200/80 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Rujukan Prioritas T1</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                      <IconBuildingHospital className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-orange-600">{counts.t1}</span>
                    <span className="text-xs text-slate-500">Risiko Tinggi</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Evaluasi: 24–48 Jam</span>
                    <span className="font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">Poli Jiwa / RSUD</span>
                  </div>
                </div>

                <div className="bg-white border border-blue-200/80 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Armada Transportasi Aktif</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <IconStethoscope className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-blue-600">
                      {faskesCandidates.filter(r => (getRecordTier(r) === 'T0' || getRecordT0Status(r) === 'T0-Confirmed') && patientStatuses[r.id]?.transportStage !== 'admitted').length || 2}
                    </span>
                    <span className="text-xs text-slate-500">Unit Ambulans Siaga</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Kesiapan Armada</span>
                    <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">100% Siaga</span>
                  </div>
                </div>

                <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Faskes Rujukan Siaga</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <IconHeartRateMonitor className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-700">3 RS</span>
                    <span className="text-xs text-slate-500">Siap Terima Pasien</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Kapasitas Bed IGD Jiwa</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">14 Bed Tersedia</span>
                  </div>
                </div>
              </div>

              {/* Transport Tracking Board (4 Stages Stepper for Active Cases) */}
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
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    Protokol 4-Tahap
                  </span>
                </div>

                {/* List of active transports */}
                <div className="space-y-4">
                  {rujukanQueue.slice(0, 3).map((item) => {
                    const stage = patientStatuses[item.id]?.transportStage || (getRecordTier(item) === 'T0' ? 'dispatch' : 'on_site');
                    const stageIndex = stage === 'dispatch' ? 0 : stage === 'on_site' ? 1 : stage === 'en_route_hospital' ? 2 : 3;

                    return (
                      <div key={item.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-800">{item.id}</span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                getRecordTier(item) === 'T0'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-orange-100 text-orange-800 border border-orange-200'
                              }`}>
                                {getRecordTier(item)} {getRecordTier(item) === 'T0' ? '· Kritis Darurat' : '· Risiko Tinggi'}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{item.victimName || 'Penyintas Tanpa Nama'}</span>
                              <span className="text-xs text-slate-400">({item.victimCategory || 'Dewasa'})</span>
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
                              title="Perbarui progres ke tahap berikutnya"
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
                              { label: '4. Tiba di IGD / Rawat', desc: 'Serah terima medis' },
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

              {/* Rujukan Table Section */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {/* Table Filter Toolbar */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRujukanFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        rujukanFilter === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua Rujukan ({counts.t0 + counts.t1})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRujukanFilter('T0')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        rujukanFilter === 'T0'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>🚨 T0 Darurat Kritis ({counts.t0})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRujukanFilter('T1')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        rujukanFilter === 'T1'
                          ? 'bg-orange-600 text-white'
                          : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>⚠️ T1 Risiko Tinggi ({counts.t1})</span>
                    </button>
                  </div>

                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari ID, nama penyintas, atau posko..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">No / ID Pasien</th>
                        <th className="py-3 px-4">Identitas Penyintas</th>
                        <th className="py-3 px-4">Posko Lapangan</th>
                        <th className="py-3 px-4">Kategori & Indikasi Rujukan</th>
                        <th className="py-3 px-4">Faskes Tujuan & Bed</th>
                        <th className="py-3 px-4">Status Transportasi</th>
                        <th className="py-3 px-4 text-right">Aksi Tindakan Medis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rujukanQueue.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            Tidak ada pasien rujukan yang sesuai dengan filter.
                          </td>
                        </tr>
                      ) : (
                        rujukanQueue.map((record, index) => {
                          const tier = getRecordTier(record);
                          const stage = patientStatuses[record.id]?.transportStage || (tier === 'T0' ? 'dispatch' : 'on_site');
                          const bed = patientStatuses[record.id]?.bed || 'IGD Psikiatri Bed 01';

                          return (
                            <tr key={record.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4">
                                <span className="text-[11px] font-mono text-slate-400 block">#{index + 1}</span>
                                <span className="font-mono font-bold text-slate-900">{record.id}</span>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-900">{record.victimName || 'Penyintas Bencana'}</p>
                                <p className="text-[11px] text-slate-500">
                                  {record.victimCategory || 'Dewasa'} · {record.victimGender || 'L/P'}
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-800">{record.location}</p>
                                <p className="text-[10px] text-slate-400">{record.timestamp} WIB</p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    tier === 'T0'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-orange-100 text-orange-800 border border-orange-200'
                                  }`}>
                                    {tier} · {tier === 'T0' ? 'Darurat Kritis' : 'Risiko Tinggi'}
                                  </span>
                                  <p className="text-[11px] text-slate-600 line-clamp-1">
                                    SRQ-20: <strong className="text-slate-800">{record.score ?? 14}/20</strong>
                                    {record.criticalTriggered && ' · Indikasi Suisida / Agresif'}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-800 text-[11px]">{targetHospital}</p>
                                <p className="text-[10px] text-emerald-700 font-semibold">{bed}</p>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  stage === 'dispatch'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : stage === 'on_site'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : stage === 'en_route_hospital'
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  <span>
                                    {stage === 'dispatch' && 'Dispatch Ambulans'}
                                    {stage === 'on_site' && 'Tiba di Posko'}
                                    {stage === 'en_route_hospital' && 'Evakuasi ke RS'}
                                    {stage === 'admitted' && 'Rawat Inap / IGD'}
                                  </span>
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSuratRecord(record)}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition cursor-pointer"
                                    title="Cetak Surat Rujukan Resmi"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  {tier === 'T0' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedRecordId(record.id);
                                        setIsTeleModalOpen(true);
                                      }}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition cursor-pointer"
                                      title="Buka Tele-Emergency Nakes"
                                    >
                                      <IconVideo className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRecordId(record.id);
                                      setSidebarTab('antrian');
                                    }}
                                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                                    title="Buka detail rekam medis pasien"
                                  >
                                    Detail
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: ASESMEN (CLINICAL & PSYCHIATRIC ASSESSMENTS)          */}
          {/* ============================================================ */}
          {sidebarTab === 'asesmen' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Rekapitulasi Asesmen Klinis & Penapisan Posko</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Analisis instrumen SRQ-20, skrining PHQ-9 & GAD-7, transkrip rekaman suara/keluhan penyintas, dan indikator red flag dari posko lapangan.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                    {faskesCandidates.length} Berkas Asesmen
                  </span>
                </div>
              </div>

              {/* Assessment Category Filters */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  {[
                    { id: 'ALL', label: 'Semua Kasus' },
                    { id: 'SUISIDA', label: 'Risiko Suisida / SRQ-17' },
                    { id: 'PSIKOTIK', label: 'Gejala Psikotik Akut' },
                    { id: 'AGRESIF', label: 'Perilaku Agresif / Amuk' },
                    { id: 'SOMATIK', label: 'Gejala Somatik Berat' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setAsesmenFilter(filter.id as any)}
                      className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                        asesmenFilter === filter.id
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asesmen Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faskesCandidates
                  .filter((item) => {
                    if (asesmenFilter === 'ALL') return true;
                    const indStr = item.indicators.join(' ').toLowerCase();
                    if (asesmenFilter === 'SUISIDA') return indStr.includes('keamanan jiwa') || indStr.includes('mati') || indStr.includes('menyakiti') || item.score >= 17;
                    if (asesmenFilter === 'PSIKOTIK') return indStr.includes('psikotik') || indStr.includes('halusinasi') || indStr.includes('waham');
                    if (asesmenFilter === 'AGRESIF') return indStr.includes('agresif') || indStr.includes('amuk') || indStr.includes('impuls');
                    if (asesmenFilter === 'SOMATIK') return indStr.includes('somatik') || indStr.includes('kejang') || indStr.includes('kesadaran');
                    return true;
                  })
                  .map((item) => {
                    const tier = getRecordTier(item);
                    return (
                      <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                                {item.victimId || item.id}
                              </span>
                              {tier === 'T0' ? (
                                <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                                  T0-SUSPECT
                                </span>
                              ) : tier === 'T1' ? (
                                <span className="bg-orange-50 text-orange-800 font-bold text-[9px] px-2 py-0.5 rounded-md border border-orange-200">
                                  T1 High Risk
                                </span>
                              ) : tier === 'T2' ? (
                                <span className="bg-amber-50 text-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-md border border-amber-200">
                                  T2 Moderate
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-md border border-emerald-200">
                                  T3 Low Risk
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {item.location} · {item.timestamp} WIB
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-extrabold text-slate-900">{item.victimName || 'Penyintas'}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Kelompok: {item.victimCategory || 'Dewasa'} · Metode: {item.method}</p>
                          </div>

                          {/* 4 Score Chips */}
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">SRQ-20</span>
                              <span className="text-sm font-black text-slate-900 block my-0.5">{item.score} / 20</span>
                              <span className="text-[8px] text-slate-500 block">Distres</span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">PHQ-9</span>
                              <span className="text-sm font-black text-slate-900 block my-0.5">{item.riskFactorScore ?? 0} / 8</span>
                              <span className="text-[8px] text-slate-500 block">Depresi</span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">GAD-7</span>
                              <span className="text-sm font-black text-slate-900 block my-0.5">{item.functionalScoreTotal ?? 0} / 9</span>
                              <span className="text-[8px] text-slate-500 block">Kecemasan</span>
                            </div>
                            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                              <span className="text-[10px] text-blue-600 font-semibold block uppercase">Total</span>
                              <span className="text-sm font-black text-blue-700 block my-0.5">
                                {item.totalIntegratedScore ?? (item.score + (item.riskFactorScore || 0) + (item.functionalScoreTotal || 0))} / 37
                              </span>
                              <span className="text-[8px] text-blue-600 block">Terpadu</span>
                            </div>
                          </div>

                          {/* Transcript Quote */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 italic leading-relaxed">
                            "{item.transcript || 'Tidak ada catatan rekaman suara.'}"
                          </div>

                          {/* Indicators */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Indikator Terdeteksi:</span>
                            <div className="flex flex-wrap gap-1">
                              {item.indicators.map((ind, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-medium border border-rose-100">
                                  ✓ {ind}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(item.id);
                              setSidebarTab('dashboard');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                          >
                            Periksa di Ruang Triase →
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(item.id);
                              setIsTeleModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <IconPhoneCall className="w-3.5 h-3.5" stroke={2} />
                            <span>Tele-Emergency</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: DATA (CENTRAL DATABASE & CSV EXPORT)                  */}
          {/* ============================================================ */}
          {sidebarTab === 'data' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Pusat Basis Data & Rekapitulasi Pasien</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Basis data rekam medis faskes, sinkronisasi IndexedDB lokal, dan ekspor pelaporan resmi tanggap bencana.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Ekspor CSV Data Pasien</span>
                  </button>
                </div>
              </div>

              {/* Data Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-400 block">Total Rekam Medis</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">{faskesCandidates.length}</span>
                  <span className="text-[11px] text-emerald-600 font-medium">Tersimpan di IndexedDB browser</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-400 block">Pasien Prioritas Kritis (T0)</span>
                  <span className="text-2xl font-black text-rose-600 block mt-1">{counts.t0}</span>
                  <span className="text-[11px] text-rose-600 font-medium">Terkoneksi siaga armada PSC 119</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-400 block">Status Sinkronisasi Cloud</span>
                  <span className="text-2xl font-black text-blue-600 block mt-1">100%</span>
                  <span className="text-[11px] text-slate-500 font-medium">Laravel API PostgreSQL Standby</span>
                </div>
              </div>

              {/* Search & Records Table */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      value={dataSearchQuery}
                      onChange={(e) => setDataSearchQuery(e.target.value)}
                      placeholder="Cari pasien, ID, atau posko..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Menampilkan {faskesCandidates.length} entri</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/70">
                      <tr>
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">ID Pasien</th>
                        <th className="py-3 px-4">Nama Penyintas</th>
                        <th className="py-3 px-4">Kelompok</th>
                        <th className="py-3 px-4">Lokasi Posko</th>
                        <th className="py-3 px-4">Triase Tier</th>
                        <th className="py-3 px-4">SRQ-20</th>
                        <th className="py-3 px-4">Tindak Lanjut</th>
                        <th className="py-3 px-4">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {faskesCandidates
                        .filter((r) => {
                          if (!dataSearchQuery) return true;
                          const q = dataSearchQuery.toLowerCase();
                          return (
                            (r.victimName || '').toLowerCase().includes(q) ||
                            (r.victimId || r.id).toLowerCase().includes(q) ||
                            (r.location || '').toLowerCase().includes(q)
                          );
                        })
                        .map((item, idx) => {
                          const tier = getRecordTier(item);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-700">{item.victimId || item.id}</td>
                              <td className="py-3 px-4 font-bold text-slate-900">{item.victimName || 'Penyintas'}</td>
                              <td className="py-3 px-4 text-slate-600">{item.victimCategory || 'Dewasa'}</td>
                              <td className="py-3 px-4 text-slate-600">{item.location}</td>
                              <td className="py-3 px-4">
                                <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                                  tier === 'T0' ? 'bg-rose-100 text-rose-800' :
                                  tier === 'T1' ? 'bg-orange-100 text-orange-800' :
                                  tier === 'T2' ? 'bg-amber-100 text-amber-800' :
                                  'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {tier}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-800">{item.score}/20</td>
                              <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs">{item.recommendedAction}</td>
                              <td className="py-3 px-4 text-slate-400 text-[11px]">{item.timestamp} WIB</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: RELAWAN (FIELD VOLUNTEERS & POSKO DIRECTORY)          */}
          {/* ============================================================ */}
          {sidebarTab === 'relawan' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Jaringan Tim Relawan & Posko Lapangan</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pemantauan tim relawan penapisan di posko bencana yang terhubung dengan RS Rujukan dan armada PSC 119.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>3 Posko Aktif Siaga</span>
                  </span>
                </div>
              </div>

              {/* Posko Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    posko: 'Posko 01 - Balai RW 05',
                    location: 'Wonosari, Klaten',
                    team: 'Tim Medis Relawan A',
                    members: 'Rudi Hartono (Koord), Maya Putri',
                    screenings: 6,
                    redFlags: 2,
                    channel: 'Radio VHF Medis Ch. 4 · Seluler Terenkripsi',
                    status: 'Aktif Terhubung',
                  },
                  {
                    posko: 'Posko 02 - Stadion Utama',
                    location: 'Pengungsian Sektor B',
                    team: 'Tim PFA Dinkes & Kemenkes',
                    members: 'Siti Nurhaliza (Psikolog), Andi Pratama',
                    screenings: 5,
                    redFlags: 1,
                    channel: 'Aplikasi RAPID-MIND Mobile · Seluler',
                    status: 'Aktif Terhubung',
                  },
                  {
                    posko: 'Posko 03 - Balai Desa Cempaka',
                    location: 'Kecamatan Cempaka',
                    team: 'Relawan BPBD Posko C',
                    members: 'Hendra Kurniawan, Rahmat Hidayat',
                    screenings: 4,
                    redFlags: 0,
                    channel: 'Radio VHF Medis Ch. 2',
                    status: 'Siaga',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        ● {item.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{item.posko}</h3>
                      <p className="text-xs text-slate-400 font-medium">{item.location}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p><strong>Tim:</strong> {item.team}</p>
                      <p><strong>Personel:</strong> {item.members}</p>
                      <p><strong>Kanal Komunikasi:</strong> {item.channel}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span>Total Skrining: <strong>{item.screenings}</strong></span>
                      <span className="text-rose-600 font-bold">Red Flag: {item.redFlags}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleOpenTeleEmergency();
                      }}
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                    >
                      <IconPhoneCall className="w-4 h-4 text-white" stroke={2} />
                      <span>Panggil Kanal Tele-Emergency</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Guidelines Box */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-2 text-xs">
                <h3 className="font-bold text-slate-900 text-sm">SOP Komunikasi Triase Sekunder Rumah Sakit - Relawan Lapangan</h3>
                <p className="text-slate-600 leading-relaxed">
                  Ketika relawan lapangan mengidentifikasi tanda bahaya (indikator T0), data terenkripsi otomatis diteruskan ke portal faskes. Dokter spesialis kejiwaan melakukan verifikasi dua arah via saluran audio-visual Tele-Emergency untuk memastikan kelayakan rujukan armada ambulans PSC 119 dan alokasi bed IGD Psikiatri.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: PENGATURAN (HOSPITAL SETTINGS & CONFIGURATION)        */}
          {/* ============================================================ */}
          {sidebarTab === 'pengaturan' && (
            <div className="space-y-5 animate-in fade-in max-w-4xl">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Pengaturan Fasilitas Pelayanan Kesehatan</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfigurasi instansi faskes rujukan, alokasi kapasitas bed IGD, dan profil tenaga medis.
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. Profil Faskes */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">1. Profil Rumah Sakit & Faskes Rujukan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block font-semibold mb-1">Nama Instansi:</label>
                      <input
                        type="text"
                        defaultValue="RSUD Dr. Soetomo - Pusat Rujukan Jiwa Bencana"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block font-semibold mb-1">Kode Faskes Bencana:</label>
                      <input
                        type="text"
                        defaultValue="RS-3578-EMERGENCY"
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Kapasitas Bed & Armada */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">2. Kapasitas Bed IGD Psikiatri & Trauma</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold">IGD Psikiatri</span>
                      <span className="text-lg font-black text-slate-900 block my-1">4 Bed</span>
                      <span className="text-[10px] text-emerald-600 font-medium">2 Terisi · 2 Tersedia</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold">Ruang Observasi Krisis</span>
                      <span className="text-lg font-black text-slate-900 block my-1">6 Bed</span>
                      <span className="text-[10px] text-emerald-600 font-medium">1 Terisi · 5 Tersedia</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold">Armada PSC 119 Siaga</span>
                      <span className="text-lg font-black text-slate-900 block my-1">3 Unit</span>
                      <span className="text-[10px] text-blue-600 font-medium">1 Sedang Tugas · 2 Standby</span>
                    </div>
                  </div>
                </div>

                {/* 3. Akun & Logout */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">3. Akun Tenaga Medis Faskes</h3>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{currentUser?.name || 'dr. Budi Santoso, Sp.KJ'}</p>
                      <p className="text-slate-400">{currentUser?.username || 'dokter.spkj'} · Spesialis Kedokteran Jiwa</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================ */}
      {/* 5. TELE-EMERGENCY VERIFICATION MODAL (PSC 119 CONSOLE)       */}
      {/* ============================================================ */}
      {isTeleModalOpen && activeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-xs">
                  <IconPhoneCall className="w-4 h-4 text-rose-600" stroke={2} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      Tele-Emergency & Validasi Medis (PSC 119)
                    </h3>
                    <span className="font-mono text-xs text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                      {activeRecord.id}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium block truncate mt-0.5">
                    {activeRecord.victimName || 'Penyintas'} · {activeRecord.location} · {activeRecord.timestamp} WIB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTeleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition shrink-0 cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              {/* Tele-Emergency Communication Console */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 text-slate-900 space-y-3.5 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <IconVideo className="w-4 h-4 text-emerald-600 shrink-0" stroke={2} />
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      Kanal Audio/Visual Relawan HP Lapangan
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                      teleCallActive
                        ? 'text-emerald-800 bg-emerald-100 border-emerald-300 animate-pulse'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    {teleCallActive ? '● TERSAMBUNG (01:14)' : 'SIAP TERHUBUNG'}
                  </span>
                </div>

                {!teleCallActive ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Hubungkan panggilan langsung dengan relawan di <strong>{activeRecord.location}</strong> untuk memverifikasi
                      kondisi kesadaran, pupil, dan risiko keselamatan pasien secara real-time.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTeleCallActive(true)}
                      className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs active:scale-[0.99] cursor-pointer"
                    >
                      <IconPhoneCall className="w-4 h-4 text-white" stroke={2} />
                      <span>Mulai Panggilan Audio/Visual ke Relawan</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-emerald-50/70 rounded-xl space-y-2 border border-emerald-200">
                      <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-semibold">
                        <IconBroadcast className="w-3.5 h-3.5 animate-spin text-emerald-600" stroke={2} />
                        <span>Transmisi Suara Lapangan Aktif (Terenkripsi):</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed pl-2 border-l-2 border-emerald-600">
                        "Halo Dokter, di {activeRecord.location} korban sedang kami dampingi. Korban tampak menatap kosong dan
                        sempat menyatakan ingin menyakiti diri sendiri. Kami butuh arahan segera."
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTeleCallActive(false)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <span>Akhiri Panggilan</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Catatan Validasi Nakes Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 text-xs block">
                  Catatan Validasi Dokter / Nakes Tele-Emergency:
                </label>
                <textarea
                  value={teleNotesInput}
                  onChange={(e) => setTeleNotesInput(e.target.value)}
                  rows={2}
                  placeholder="Kondisi kesadaran terpantau, pupil normal, agitasi mereda setelah diajak bicara. Disetujui rujukan rawat / atau diturunkan ke T1..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl p-3 text-xs text-slate-900 outline-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block text-center tracking-wider">
                  Keputusan Triase Sekunder (Two-Tiered Decision)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleConfirmRujukan(activeRecord.id)}
                    className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Konfirmasi T0-Confirmed</span>
                    </div>
                    <span className="text-[10px] font-normal opacity-90">Kirim PSC 119 & Bed IGD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDowngradeStatus(activeRecord.id, 'T1')}
                    className="p-3.5 rounded-2xl bg-white hover:bg-orange-50 active:scale-[0.99] text-orange-950 font-bold text-xs flex flex-col items-center justify-center gap-1 border border-orange-300 shadow-2xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="w-4 h-4 text-orange-600" />
                      <span>Downgrade ke T1</span>
                    </div>
                    <span className="text-[10px] font-normal text-orange-800">Risiko Tinggi Non-Kritis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDowngradeStatus(activeRecord.id, 'T2')}
                    className="p-3.5 rounded-2xl bg-white hover:bg-amber-50 active:scale-[0.99] text-amber-950 font-bold text-xs flex flex-col items-center justify-center gap-1 border border-amber-300 shadow-2xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="w-4 h-4 text-amber-600" />
                      <span>Downgrade ke T2</span>
                    </div>
                    <span className="text-[10px] font-normal text-amber-800">Distres Sedang Posko</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SURAT RUJUKAN MEDIS FASILITAS KESEHATAN (OFFICIAL)    */}
      {/* ============================================================ */}
      {selectedSuratRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-6 overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header Toolbar (Non-printable) */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white print:hidden">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Pratinjau Surat Rujukan Medis Resmi</h3>
                  <p className="text-[11px] text-slate-400">Standar Regulasi Kemenkes RI · RAPID-MIND Role 2</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSuratRecord(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Paper Style) */}
            <div className="p-8 space-y-6 text-slate-800 text-xs bg-white">
              {/* Kop Surat Resmi */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  KEMENTERIAN KESEHATAN REPUBLIK INDONESIA
                </p>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  POS KOMANDO MEDIS DARURAT BENCANA & PSC 119
                </h2>
                <p className="text-[11px] text-slate-600">
                  Sistem Surveilans & Triase Penapisan Bencana RAPID-MIND · Satgas Dukungan Kesehatan Jiwa
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200 mt-2 font-mono">
                  <span>No. Dokumen: <strong>SRM/RM-FASKES/{new Date().getFullYear()}/{selectedSuratRecord.id}</strong></span>
                  <span>Tanggal Terbit: <strong>{selectedSuratRecord.timestamp || new Date().toLocaleDateString('id-ID')} WIB</strong></span>
                </div>
              </div>

              {/* Judul Surat */}
              <div className="text-center py-1">
                <h3 className="text-sm font-black underline tracking-wide uppercase text-slate-900">
                  SURAT RUJUKAN MEDIS FASILITAS KESEHATAN
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lampiran Triase Penapisan Bencana Kategori: <strong className="text-slate-900">{getRecordTier(selectedSuratRecord)} ({getRecordTier(selectedSuratRecord) === 'T0' ? 'Darurat Kritis' : 'Risiko Tinggi'})</strong>
                </p>
              </div>

              {/* Bagian 1: Penerima Rujukan & Faskes Tujuan */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-500 text-[10px] uppercase block mb-1">
                      Fasilitas Kesehatan Rujukan Tujuan:
                    </label>
                    <select
                      value={targetHospital}
                      onChange={(e) => setTargetHospital(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none print:appearance-none print:border-none print:p-0"
                    >
                      <option value="RSUD Sayang Cianjur - IGD Psikiatri Terpadu">RSUD Sayang Cianjur - IGD Psikiatri Terpadu</option>
                      <option value="RS Jiwa Cisarua Provinsi Jawa Barat">RS Jiwa Cisarua Provinsi Jawa Barat</option>
                      <option value="RSUP dr. Hasan Sadikin Bandung">RSUP dr. Hasan Sadikin Bandung</option>
                      <option value="Faskes Lapangan Khusus Krisis Jiwa Dinkes">Faskes Lapangan Khusus Krisis Jiwa Dinkes</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 text-[10px] uppercase block mb-1">
                      Alokasi Ruangan / Bed:
                    </label>
                    <span className="font-bold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg block text-xs">
                      {patientStatuses[selectedSuratRecord.id]?.bed || 'IGD Psikiatri Bed 01'} (Konfirmasi Siaga)
                    </span>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Identitas Pasien */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                  I. Identitas Penyintas / Pasien
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Nama Lengkap</span>
                    <span className="font-bold text-slate-900 text-xs">{selectedSuratRecord.victimName || 'Penyintas Bencana'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">ID Rekam Medis / NIK</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{selectedSuratRecord.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Kelompok / Usia</span>
                    <span className="font-bold text-slate-900 text-xs">{selectedSuratRecord.victimCategory || 'Dewasa'} ({selectedSuratRecord.victimGender || 'L/P'})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Posko Pengungsian</span>
                    <span className="font-bold text-slate-900 text-xs">{selectedSuratRecord.location}</span>
                  </div>
                </div>
              </div>

              {/* Bagian 3: Temuan Skrining & Red Flags */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                  II. Hasil Penapisan & Indikator Kritis Lapangan (RAPID-MIND)
                </h4>
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Tingkat Triase</span>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-md text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                        {getRecordTier(selectedSuratRecord)} · {getRecordTier(selectedSuratRecord) === 'T0' ? 'Darurat Kritis' : 'Risiko Tinggi'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Skor Skrining SRQ-20</span>
                      <span className="font-bold text-slate-900 text-xs">{selectedSuratRecord.score ?? 14} / 20 (Ambang Batas &ge; 6)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Metode Asesmen</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {selectedSuratRecord.method} ({selectedSuratRecord.volunteerId ? `Relawan #${selectedSuratRecord.volunteerId}` : 'Relawan Posko'})
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Keluhan / Transkrip Posko Lapangan</span>
                    <p className="text-slate-700 italic text-[11px] mt-0.5 bg-white p-2 rounded-lg border border-slate-200">
                      "{selectedSuratRecord.transcript || 'Penyintas mengalami agitasi pascatrauma, distres akut berat, dan memerlukan stabilisasi kejiwaan komprehensif.'}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Bagian 4: Diagnosis Kerja Klinis (ICD-10) */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                  III. Diagnosis Kerja Klinis & Indikasi Rujukan
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Diagnosis Kerja Klinis (Klasifikasi ICD-10):
                    </label>
                    <select
                      value={selectedDiagnosis}
                      onChange={(e) => setSelectedDiagnosis(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none print:appearance-none print:border-none print:p-0"
                    >
                      <option value="F43.0 Reaksi Stres Akut Berat dengan Agitasi (Acute Stress Reaction)">
                        F43.0 Reaksi Stres Akut Berat dengan Agitasi (Acute Stress Reaction)
                      </option>
                      <option value="F23 Gangguan Psikotik Polimorfik Akut Pascatrauma">
                        F23 Gangguan Psikotik Polimorfik Akut Pascatrauma
                      </option>
                      <option value="F32.3 Episode Depresi Berat dengan Gejala Psikotik & Ide Suisida">
                        F32.3 Episode Depresi Berat dengan Gejala Psikotik & Ide Suisida
                      </option>
                      <option value="F43.1 Gangguan Stres Pascatrauma (PTSD) Eksaserbasi Akut">
                        F43.1 Gangguan Stres Pascatrauma (PTSD) Eksaserbasi Akut
                      </option>
                      <option value="F10.0 Intoksikasi Akut / Sindrom Putus Zat Terkait Bencana">
                        F10.0 Intoksikasi Akut / Sindrom Putus Zat Terkait Bencana
                      </option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Alasan & Indikasi Rujukan Medis:</span>
                    <p className="text-[11px] text-slate-700 mt-0.5">
                      Memerlukan evaluasi psikiatri lanjutan, stabilisasi farmakologis darurat, serta intervensi krisis intensif yang tidak dapat diakomodasi pada posko penampungan lapangan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bagian 5: Tanda Tangan & Pengesahan DPJP */}
              <div className="pt-4 flex items-end justify-between border-t border-slate-200">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Catatan Penanganan Transportasi:</p>
                  <p className="text-[11px] text-slate-600 max-w-sm">
                    Pasien dievakuasi menggunakan ambulans PSC 119 dengan pengawasan ketat tanda vital dan pendamping medis bersertifikasi BLS/BCLS.
                  </p>
                </div>
                <div className="text-center min-w-[200px] space-y-1">
                  <p className="text-[11px] text-slate-500">Cianjur, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-[11px] font-bold text-slate-800">Dokter Penanggung Jawab Pelayanan (DPJP)</p>
                  <div className="h-14 flex items-center justify-center">
                    <span className="font-serif italic text-base text-blue-900 border-b border-dashed border-slate-400 px-4">
                      dr. Budi Santoso, Sp.KJ
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">SIP: 446.1/1092/Dinkes/2024</p>
                </div>
              </div>
            </div>

            {/* Modal Footer (Non-printable) */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between print:hidden">
              <span className="text-xs text-slate-500">
                Format dokumen rujukan resmi sesuai regulasi Kemenkes RI No. 001 Tahun 2012 tentang Sistem Rujukan Pelayanan Kesehatan.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSuratRecord(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Surat Rujukan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
