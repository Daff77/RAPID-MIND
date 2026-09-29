import React, { useState } from 'react';
import {
  Smartphone,
  Shield,
  LogOut,
  Bed,
  Ambulance,
  Search,
  CheckCircle2,
  Clock,
  X,
  PhoneCall,
  Video,
  Radio,
  MapPin,
  ArrowDownRight,
  Activity,
  AlertOctagon,
  AlertTriangle,
  ChevronRight,
  Wifi,
  WifiOff,
  FileText,
  ArrowLeft,
  Check,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import { AssessmentRecord, TriageTier, T0EmergencyStatus } from '../types/assessment';

interface HospitalPageProps {
  onGoToVolunteer?: () => void;
  onGoToDashboard?: () => void;
}

export const HospitalPage: React.FC<HospitalPageProps> = ({
  onGoToVolunteer,
  onGoToDashboard,
}) => {
  const { currentUser, logout } = useAuth();
  const { centralAssessments, isOnline } = useAssessment();

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
  >({});

  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<'ALL' | 'T0' | 'T1' | 'T2' | 'T3'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<'queue' | 'detail'>('queue');

  // Tele-Emergency verification modal
  const [isTeleModalOpen, setIsTeleModalOpen] = useState(false);
  const [teleCallActive, setTeleCallActive] = useState(false);
  const [teleNotesInput, setTeleNotesInput] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Candidates for Faskes/Hospital: All central assessments available for Faskes triage monitoring & search
  const faskesCandidates = centralAssessments;

  const getRecordTier = (r: AssessmentRecord): TriageTier => {
    // If downgraded by healthcare action, return the downgraded tier
    if (patientStatuses[r.id]?.downgradedTier) {
      return patientStatuses[r.id].downgradedTier!;
    }
    if (r.triageTier) return r.triageTier;
    if (r.zone === 'RED' && r.criticalTriggered) return 'T0';
    if (r.zone === 'RED') return 'T1';
    if (r.zone === 'YELLOW') return 'T2';
    return 'T3';
  };

  const getRecordT0Status = (r: AssessmentRecord): T0EmergencyStatus | undefined => {
    // 1. Healthcare action state takes highest priority
    if (patientStatuses[r.id]?.t0Status) {
      return patientStatuses[r.id].t0Status;
    }
    // 2. Explicit t0Status on the record
    if (r.t0Status) {
      return r.t0Status;
    }
    // 3. If T0 or criticalTriggered Red Flag, default to T0-Suspect until validated
    if (r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)) {
      return 'T0-Suspect';
    }
    // 4. Normal T1, T2, T3 have NO T0 emergency status
    return undefined;
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

  const t0PendingList = centralAssessments.filter((r) => {
    const tier = getRecordTier(r);
    const t0Stat = getRecordT0Status(r);
    return (tier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)) && t0Stat === 'T0-Suspect';
  });

  // Determine currently active record in workspace
  const activeRecord = selectedRecord || filtered[0] || null;

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
        teleNotes:
          teleNotesInput ||
          `Terverifikasi via Tele-Emergency oleh ${decider} (${timestamp} WIB): Pasien dalam kondisi distres akut valid.`,
      },
    }));

    setActionSuccessMessage(
      `✓ [T0-CONFIRMED] Rujukan Disetujui: Pasien ${recordId} divalidasi oleh ${decider} (${timestamp} WIB). Perintah armada PSC 119 diterbitkan.`
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
      `✓ [DOWNGRADE] Validasi Medis: Status pasien ${recordId} diturunkan ke ${targetTier} oleh ${decider} (tidak ada ancaman nyawa darurat). Diteruskan ke tim posko.`
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
    // 1. T0 Cases: show T0 Emergency workflow status (T0-CONFIRMED vs T0-SUSPECT)
    if (tier === 'T0') {
      if (t0Status === 'T0-Confirmed') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>T0-CONFIRMED</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-600 text-white shadow-xs uppercase tracking-wide">
          <AlertOctagon className="w-3.5 h-3.5 text-white shrink-0" />
          <span>T0-SUSPECT</span>
        </span>
      );
    }

    // 2. Previously T0 and Downgraded by Healthcare to T1 or T2
    if (t0Status === 'Downgraded') {
      return (
        <div className="inline-flex items-center gap-1 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
              tier === 'T1'
                ? 'bg-orange-50 text-orange-950 border-orange-200'
                : 'bg-amber-50 text-amber-950 border-amber-200'
            }`}
          >
            {tier === 'T1' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            <span>{tier === 'T1' ? 'T1 · HIGH RISK' : 'T2 · MODERATE RISK'}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <ArrowDownRight className="w-3 h-3 text-slate-500" />
            <span>DOWNGRADED</span>
          </span>
        </div>
      );
    }

    // 3. Normal T1
    if (tier === 'T1') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-orange-50 text-orange-950 border border-orange-200">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span>T1 · HIGH RISK</span>
        </span>
      );
    }

    // 4. Normal T2
    if (tier === 'T2') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-950 border border-amber-200">
          <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>T2 · MODERATE RISK</span>
        </span>
      );
    }

    // 5. Normal T3
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-950 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>T3 · LOW RISK</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* 1. TOP BAR DASHBOARD ROLE 2 (COMPACT OPERATIONAL HEADER) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          {/* Brand & Facility Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <Ambulance className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  RAPID-MIND
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                  Faskes & PSC 119
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                {currentUser?.assignedHospital || 'RSUD Dr. Soetomo — Public Safety Center (PSC 119)'}
              </p>
            </div>
          </div>

          {/* Operational Metrics & Connection */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Connection Status Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px]">Online · Siaga Real-Time</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[11px]">Mode Offline (IndexedDB)</span>
                </>
              )}
            </div>

            {/* T0 Pending Alert Badge */}
            {t0PendingList.length > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs animate-pulse">
                <Radio className="w-3.5 h-3.5 text-white" />
                <span>{t0PendingList.length} T0 PENDING</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px]">Antrean T0 Terkendali</span>
              </div>
            )}

            {/* Quick Portal Switchers */}
            {onGoToVolunteer && (
              <button
                type="button"
                onClick={onGoToVolunteer}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                title="Buka Aplikasi Relawan"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>Relawan</span>
              </button>
            )}

            {onGoToDashboard && (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                title="Buka Dashboard BPBD"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>BPBD</span>
              </button>
            )}

            {/* User & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Tenaga Medis
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Keluar dari Akun"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Clinical Operations Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Action Success Alert Notification */}
        {actionSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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

        {/* Resource Capacity Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Bed className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Kapasitas IGD Jiwa
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">8 / 15 Bed</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Ambulance className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Ambulans PSC Siaga
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">2 Unit Aktif</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Kasus T0 Pending
              </span>
              <span className="text-sm font-bold font-mono text-rose-600">
                {t0PendingList.length} Kasus
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Rujukan
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {faskesCandidates.length} Pasien
              </span>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN CLINICAL OPERATIONS WORKSPACE (DESKTOP-FIRST) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN (5 Cols): EMERGENCY QUEUE                        */}
          {/* ============================================================ */}
          <div
            className={`lg:col-span-5 space-y-3.5 ${
              mobileActiveTab === 'detail' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5">
              {/* Queue Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Emergency Queue
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kasus triase dan rujukan lapangan yang memerlukan pemantauan atau tindak lanjut.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                  {filtered.length} Antrean
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari ID, Nama, atau Posko..."
                  className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterTier('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                    filterTier === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  Semua ({faskesCandidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTier('T0')}
                  className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                    filterTier === 'T0'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  T0 Kritis ({t0PendingList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTier('T1')}
                  className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                    filterTier === 'T1'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  T1 High ({faskesCandidates.filter((r) => getRecordTier(r) === 'T1').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTier('T2')}
                  className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                    filterTier === 'T2'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  T2 Mod ({faskesCandidates.filter((r) => getRecordTier(r) === 'T2').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTier('T3')}
                  className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                    filterTier === 'T3'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  T3 Low ({faskesCandidates.filter((r) => getRecordTier(r) === 'T3').length})
                </button>
              </div>

              {/* Queue Cards List */}
              <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-0.5">
                {filtered.length > 0 ? (
                  filtered.map((item) => {
                    const tier = getRecordTier(item);
                    const t0Stat = getRecordT0Status(item);
                    const transport = patientStatuses[item.id]?.transportStage;
                    const isSelected = activeRecord?.id === item.id;
                    const isT0Pending =
                      (tier === 'T0' || (item.zone === 'RED' && item.criticalTriggered)) &&
                      t0Stat === 'T0-Suspect';

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedRecord(item);
                          setMobileActiveTab('detail');
                        }}
                        className={`p-3.5 sm:p-4 rounded-2xl border-2 transition cursor-pointer text-left space-y-2.5 relative ${
                          isSelected
                            ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                            : isT0Pending
                            ? 'bg-rose-50/30 border-rose-300 hover:border-rose-400 hover:bg-rose-50/50 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                        }`}
                      >
                        {/* Red Accent Marker for T0 Pending */}
                        {isT0Pending && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-rose-600" />
                        )}

                        {/* Card Header: Tier Badge & Timestamp */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {renderTierBadge(tier, t0Stat)}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 shrink-0">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.timestamp}</span>
                          </div>
                        </div>

                        {/* Patient Identifier & Name */}
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {item.victimName || 'Penyintas Lapangan'}
                            </h3>
                            <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                              {item.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="font-medium truncate">{item.location}</span>
                          </div>
                        </div>

                        {/* Symptoms / Red Flag Snippet */}
                        <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 leading-snug">
                          <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wide">
                            {tier === 'T0' ? 'Trigger Red Flag Kritis:' : 'Gejala Terlapor (SRQ-20 / Skrining):'}
                          </span>
                          <p className="line-clamp-2 italic text-slate-600 mt-0.5">
                            {item.indicators.join(', ') || item.transcript || (tier === 'T0' ? 'Kegawatdaruratan psikiatri/medis lapangan.' : 'Gejala penapisan klinis lapangan.')}
                          </p>
                        </div>

                        {/* Card Footer: Transport Stage & Open Button */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <div>
                            {transport ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                {transport === 'dispatch' && '🚑 Armada Bergerak'}
                                {transport === 'on_site' && '📍 Tiba di Posko'}
                                {transport === 'en_route_hospital' && '🏥 Menuju RS'}
                                {transport === 'admitted' && '✓ Rawat Inap IGD'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Metode: {item.method}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTeleEmergency(item);
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                                isT0Pending
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs active:scale-[0.99]'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>{isT0Pending ? 'Tele-Emergency' : 'Validasi'}</span>
                            </button>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="font-medium text-slate-600">Tidak ada kasus dalam antrean.</p>
                    <p className="text-[11px] text-slate-400">
                      Coba ubah kata kunci pencarian atau ganti filter tier.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN (7 Cols): PATIENT & CLINICAL DETAIL WORKSPACE    */}
          {/* ============================================================ */}
          <div
            className={`lg:col-span-7 space-y-4 ${
              mobileActiveTab === 'queue' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Mobile Back Button to Queue */}
            <button
              type="button"
              onClick={() => setMobileActiveTab('queue')}
              className="lg:hidden w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>Kembali ke Emergency Queue</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {filtered.length} Kasus
              </span>
            </button>

            {activeRecord ? (
              <div className="space-y-4">
                {/* 1. Header Workspace Kasus Pasien (WHO, WHERE, WHEN) */}
                <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-2xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl text-xs border border-slate-200">
                          {activeRecord.id}
                        </span>
                        {renderTierBadge(getRecordTier(activeRecord), getRecordT0Status(activeRecord))}
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{activeRecord.method === 'VERBAL' ? 'Wawancara Suara STT' : 'Checklist Posko'}</span>
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {activeRecord.victimName || 'Penyintas Lapangan'}
                      </h2>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        <span>NIK: {activeRecord.nik || 'Belum Tercatat'}</span>
                        <span>·</span>
                        <span>Kategori: {activeRecord.victimCategory || 'Dewasa'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {(() => {
                        const tier = getRecordTier(activeRecord);
                        const isT0Case = tier === 'T0' || activeRecord.criticalTriggered;
                        return (
                          <button
                            type="button"
                            onClick={() => handleOpenTeleEmergency(activeRecord)}
                            className={`px-4 py-2.5 rounded-2xl active:scale-[0.99] font-bold text-xs flex items-center gap-2 shadow-xs transition ${
                              isT0Case
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <PhoneCall className={`w-3.5 h-3.5 ${isT0Case ? 'animate-pulse' : ''}`} />
                            <span>{isT0Case ? 'Mulai Tele-Emergency' : 'Tele-Konsultasi Posko'}</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Metadata strip: Posko, Demografi, Waktu, Dokter PJ */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                        Lokasi Posko
                      </span>
                      <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                        <span className="truncate">{activeRecord.location}</span>
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                        Demografi
                      </span>
                      <span className="font-bold text-slate-800 block mt-0.5">
                        {activeRecord.victimAge ? `${activeRecord.victimAge} th` : '-'} · {activeRecord.victimGender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                        Waktu Laporan
                      </span>
                      <span className="font-bold font-mono text-slate-800 block mt-0.5">
                        {activeRecord.timestamp} WIB
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                        Dokter PJ
                      </span>
                      <span className="font-bold text-slate-800 truncate block mt-0.5">
                        {patientStatuses[activeRecord.id]?.doctor || 'Menunggu Validasi'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Status Banner (T0-Suspect vs T0-Confirmed vs Downgraded vs Normal T1/T2/T3) */}
                {(() => {
                  const tier = getRecordTier(activeRecord);
                  const t0Stat = getRecordT0Status(activeRecord);
                  const isT0Pending = tier === 'T0' && t0Stat === 'T0-Suspect';
                  const isT0Confirmed = tier === 'T0' && t0Stat === 'T0-Confirmed';
                  const isDowngraded = t0Stat === 'Downgraded';
                  const doctorName = patientStatuses[activeRecord.id]?.doctor || 'dr. Budi Santoso, Sp.KJ';

                  if (isT0Pending) {
                    return (
                      <div className="p-4 sm:p-5 rounded-3xl border-2 space-y-2 shadow-2xs transition bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-rose-950">
                              Status Kritis: T0-SUSPECT · Perlu Validasi Nakes
                            </h3>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border bg-rose-100 text-rose-900 border-rose-300">
                            Panggilan Terbuka
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                          Kasus terdeteksi memiliki sinyal kegawatdaruratan psikiatri/medis aktif dari posko. Segera lakukan validasi sekunder melalui sambungan Tele-Emergency dengan relawan.
                        </p>
                      </div>
                    );
                  }

                  if (isT0Confirmed) {
                    return (
                      <div className="p-4 sm:p-5 rounded-3xl border-2 space-y-2 shadow-2xs transition bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                              Status Rujukan: T0-CONFIRMED · Armada Diterbitkan
                            </h3>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border bg-emerald-100 text-emerald-900 border-emerald-300">
                            Rujukan Disetujui
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                          Telah divalidasi oleh {doctorName}. Sinyal perintah armada PSC 119 dan alokasi bed IGD telah disetujui untuk evakuasi darurat.
                        </p>
                      </div>
                    );
                  }

                  if (isDowngraded) {
                    return (
                      <div className="p-4 sm:p-5 rounded-3xl border-2 space-y-2 shadow-2xs transition bg-slate-50 border-slate-300">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <ArrowDownRight className="w-5 h-5 text-slate-600 shrink-0" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                              Status Triase: DOWNGRADED KE {tier} (NON-KRITIS)
                            </h3>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border bg-slate-200 text-slate-800 border-slate-300">
                            Divalidasi Aman
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                          Status diturunkan ke {tier} oleh {doctorName}. Tidak ada kegawatan nyawa mendesak; penanganan didelegasikan ke posko / faskes primer.
                        </p>
                      </div>
                    );
                  }

                  if (tier === 'T1') {
                    return (
                      <div className="p-4 sm:p-5 rounded-3xl border-2 space-y-2 shadow-2xs transition bg-orange-50/70 border-orange-300">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-orange-950">
                              Status Triase: T1 · HIGH RISK (Rujukan Prioritas Klinis)
                            </h3>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border bg-orange-100 text-orange-900 border-orange-300">
                            Prioritas Klinis
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                          Skor terintegrasi ≥ 15 (atau Gangguan Fungsi ≥ 6). Memerlukan rujukan terencana ke psikolog klinis / psikiater di puskesmas atau faskes lanjutan.
                        </p>
                      </div>
                    );
                  }

                  if (tier === 'T2') {
                    return (
                      <div className="p-4 sm:p-5 rounded-3xl border-2 space-y-2 shadow-2xs transition bg-amber-50/70 border-amber-300">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-amber-600 shrink-0" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                              Status Triase: T2 · MODERATE RISK (Pendampingan PFA Berlanjut)
                            </h3>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border bg-amber-100 text-amber-900 border-amber-300">
                            Pendampingan Posko
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                          Skor terintegrasi 7–14. Memerlukan Psychological First Aid (PFA) berkelanjutan oleh relawan posko dan evaluasi berkala dalam 7 hari.
                        </p>
                      </div>
                    );
                  }

                  // Default / T3
                  return (
                    <div className="p-4 sm:p-5 rounded-3xl border-2 space-y-2 shadow-2xs transition bg-slate-50 border-slate-200">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Status Triase: T3 · LOW RISK (Dukungan Psikososial Komunitas)
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border bg-slate-100 text-slate-700 border-slate-200">
                          Resiliensi Mandiri
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        Skor terintegrasi 0–6. Kondisi psikologis dalam batas adaptif normal pascabencana. Diberikan psikoedukasi dan aktivitas pemulihan kelompok posko.
                      </p>
                    </div>
                  );
                })()}

                {/* 3. Indicators Alert (Red Flag for T0 vs Gejala Terlapor for T1/T2/T3) */}
                {(() => {
                  const tier = getRecordTier(activeRecord);
                  const isCritical = tier === 'T0' || activeRecord.criticalTriggered;

                  return (
                    <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          {isCritical ? (
                            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            {isCritical
                              ? 'Indikator Bahaya (Red Flag Kegawatdaruratan)'
                              : 'Gejala Terlapor (Hasil Skrining Lapangan)'}
                          </h3>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                            isCritical
                              ? 'text-rose-700 bg-rose-50 border-rose-200'
                              : 'text-blue-700 bg-blue-50 border-blue-200'
                          }`}
                        >
                          {activeRecord.indicators.length} {isCritical ? 'Pemicu Darurat' : 'Gejala Terlapor'}
                        </span>
                      </div>

                      {/* Chips for Indicators */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {activeRecord.indicators.length > 0 ? (
                            activeRecord.indicators.map((ind, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs border ${
                                  isCritical
                                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                                    : 'bg-slate-100 border-slate-200 text-slate-800'
                                }`}
                              >
                                <Check className={`w-3.5 h-3.5 shrink-0 ${isCritical ? 'text-rose-600' : 'text-blue-600'}`} />
                                <span>{ind}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">
                              {isCritical
                                ? 'Tidak ada indikator terurai (Pemicu override manual dari relawan posko).'
                                : 'Tidak ada gejala spesifik dilaporkan.'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Verbatim Transcript */}
                      {activeRecord.transcript && (
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <Radio className="w-3 h-3 text-rose-600" />
                            <span>Kutipan Verbatim Wawancara Suara Relawan (STT):</span>
                          </div>
                          <p className="text-xs text-slate-800 italic leading-relaxed">
                            "{activeRecord.transcript}"
                          </p>
                        </div>
                      )}

                      {/* Volunteer Notes */}
                      {activeRecord.volunteerNotes && (
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 text-xs text-slate-700">
                          <span className="font-bold text-slate-900">Catatan Lapangan Relawan: </span>
                          <span className="font-medium text-slate-700">{activeRecord.volunteerNotes}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 4. Integrated Assessment Breakdown (ASSESSMENT CONTEXT) */}
                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Hasil Asesmen Klinis Terintegrasi
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                      Total: {activeRecord.totalIntegratedScore ?? (activeRecord.score + (activeRecord.riskFactorScore || 0) + (activeRecord.functionalScoreTotal || 0))} / 37
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                        Skor SRQ-20
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {activeRecord.score} / 20
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Distres Emosional</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                        Faktor Risiko (A)
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {activeRecord.riskFactorScore ?? 0} / 8
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Kerentanan Lapangan</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                        Fungsi Harian (B)
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {activeRecord.functionalScoreTotal ?? 0} / 9
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Hendaya Aktivitas</span>
                    </div>
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-[10px] text-blue-800 font-bold block uppercase">
                        Klasifikasi Tier
                      </span>
                      <span className="text-sm font-black text-blue-950">
                        {activeRecord.triageTier || activeRecord.zone}
                      </span>
                      <span className="text-[10px] text-blue-700 block mt-0.5">Standar Triase</span>
                    </div>
                  </div>

                  {activeRecord.recommendedAction && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-950 font-medium leading-relaxed">
                      <span className="font-bold block text-[10px] uppercase text-blue-900 mb-0.5">
                        Rekomendasi Protokol Lapangan:
                      </span>
                      {activeRecord.recommendedAction}
                    </div>
                  )}
                </div>

                {/* 5. PSC 119 Transport & Bed Allocation Tracking */}
                <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Ambulance className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Alur Armada PSC 119 & Alokasi Bed RS
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-slate-700 font-mono bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                      {patientStatuses[activeRecord.id]?.bed || 'IGD Psikiatri Bed 02'}
                    </span>
                  </div>

                  {/* Stepper Progress */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { key: 'dispatch', label: '1. Dispatch Armada', icon: '🚑' },
                      { key: 'on_site', label: '2. Tiba di Posko', icon: '📍' },
                      { key: 'en_route_hospital', label: '3. Evakuasi ke RS', icon: '🏥' },
                      { key: 'admitted', label: '4. Rawat Inap IGD', icon: '✓' },
                    ].map((step, idx) => {
                      const currentStage =
                        patientStatuses[activeRecord.id]?.transportStage ||
                        (getRecordT0Status(activeRecord) === 'T0-Confirmed' ? 'dispatch' : undefined);
                      const stageIndex =
                        currentStage === 'dispatch'
                          ? 0
                          : currentStage === 'on_site'
                          ? 1
                          : currentStage === 'en_route_hospital'
                          ? 2
                          : currentStage === 'admitted'
                          ? 3
                          : -1;
                      const isPassed = idx <= stageIndex;
                      const isCurrent = idx === stageIndex;

                      return (
                        <div
                          key={step.key}
                          className={`p-2.5 rounded-2xl border text-center text-xs transition ${
                            isCurrent
                              ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                              : isPassed
                              ? 'bg-blue-50 text-blue-900 font-semibold border-blue-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          <span className="text-base block mb-0.5">{step.icon}</span>
                          <span className="text-[11px] block leading-tight">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Status armada diperbarui secara berjenjang hingga pasien tiba di faskes rujukan.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAdvanceTransportStage(activeRecord.id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition active:scale-[0.99]"
                    >
                      <span>Majukan Status Armada →</span>
                    </button>
                  </div>
                </div>

                {/* 6. Two-Tiered Clinical Validation Decision Card (WHAT NEXT) */}
                <div className="p-5 bg-white border-2 border-slate-200 rounded-3xl space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Tindakan Medis & Verifikasi Faskes / PSC 119
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Catatan Verifikasi Klinis Dokter / Nakes:
                    </label>
                    <textarea
                      value={teleNotesInput}
                      onChange={(e) => setTeleNotesInput(e.target.value)}
                      rows={2}
                      placeholder="Tuliskan evaluasi kondisi penyintas, observasi pupil/kesadaran, atau instruksi rujukan..."
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none leading-relaxed"
                    />
                  </div>

                  {(() => {
                    const tier = getRecordTier(activeRecord);
                    const t0Stat = getRecordT0Status(activeRecord);

                    // For T0 cases (Pending confirmation)
                    if (tier === 'T0' && t0Stat !== 'T0-Confirmed') {
                      return (
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Keputusan Triase Sekunder (Two-Tiered Decision):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleConfirmRujukan(activeRecord.id)}
                              className="min-h-[46px] px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                            >
                              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                              <span>Konfirmasi T0-Confirmed</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDowngradeStatus(activeRecord.id, 'T1')}
                              className="min-h-[46px] px-3 py-2 rounded-2xl bg-white hover:bg-orange-50 active:scale-[0.99] text-orange-950 font-bold text-xs flex items-center justify-center gap-1.5 border border-orange-300 transition shadow-2xs"
                            >
                              <ArrowDownRight className="w-4 h-4 text-orange-600 shrink-0" />
                              <span>Downgrade ke T1</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDowngradeStatus(activeRecord.id, 'T2')}
                              className="min-h-[46px] px-3 py-2 rounded-2xl bg-white hover:bg-amber-50 active:scale-[0.99] text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-300 transition shadow-2xs"
                            >
                              <ArrowDownRight className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Downgrade ke T2</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // For T0-Confirmed cases
                    if (tier === 'T0' && t0Stat === 'T0-Confirmed') {
                      return (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-xs font-bold text-emerald-950">
                                Kasus T0-CONFIRMED: Rujukan & Armada PSC 119 Terverifikasi
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAdvanceTransportStage(activeRecord.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs flex items-center gap-1"
                            >
                              <Ambulance className="w-3.5 h-3.5" />
                              <span>Perbarui Status Armada</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // For T1 / T2 / T3 / Downgraded cases
                    return (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const decider = currentUser?.name || 'dr. Budi Santoso, Sp.KJ';
                            const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                            setPatientStatuses((prev) => ({
                              ...prev,
                              [activeRecord.id]: {
                                ...prev[activeRecord.id],
                                doctor: decider,
                                teleNotes: teleNotesInput || `Catatan klinis diverifikasi oleh ${decider} (${timestamp} WIB).`,
                              },
                            }));
                            setActionSuccessMessage(
                              `✓ Catatan klinis pasien ${activeRecord.id} berhasil disimpan oleh ${decider}.`
                            );
                            setTimeout(() => setActionSuccessMessage(null), 5000);
                          }}
                          className="min-h-[46px] w-full px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                        >
                          <Save className="w-4 h-4 text-white" />
                          <span>Simpan Rekomendasi & Catatan Klinis Nakes</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Tidak Ada Kasus Emergency Tertunda
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Seluruh laporan penapisan posko lapangan telah tertangani. Sistem PSC 119 siaga memantau sinyal darurat baru secara real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* MODAL: TELE-EMERGENCY VERIFICATION & TWO-TIERED WORKSPACE    */}
      {/* (WIDE, CONTEXT-PRESERVING TELEMEDICINE CONSOLE)              */}
      {/* ============================================================ */}
      {isTeleModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
            {/* Modal Header: Clear Context (Patient, Posko, Status) */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold truncate">
                      Tele-Emergency & Validasi Medis (PSC 119)
                    </h3>
                    <span className="font-mono text-xs text-rose-300 font-bold bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-800">
                      {selectedRecord.id}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium block truncate mt-0.5">
                    {selectedRecord.victimName || 'Penyintas'} · {selectedRecord.location} · {selectedRecord.timestamp} WIB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTeleModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition shrink-0"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              {/* Tele-Emergency Audio/Visual Communication Console */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 text-white space-y-3.5 border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-xs sm:text-sm">
                      Kanal Audio/Visual Relawan HP Lapangan
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                      teleCallActive
                        ? 'text-emerald-400 bg-emerald-950/80 border-emerald-700 animate-pulse'
                        : 'text-slate-400 bg-slate-900 border-slate-700'
                    }`}
                  >
                    {teleCallActive ? '● TERSAMBUNG (01:14)' : 'SIAP TERHUBUNG'}
                  </span>
                </div>

                {!teleCallActive ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Hubungkan panggilan langsung dengan relawan di <strong>{selectedRecord.location}</strong> untuk memverifikasi kondisi kesadaran, pupil, dan risiko keselamatan pasien secara real-time.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTeleCallActive(true)}
                      className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-emerald-900/30 active:scale-[0.99]"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Mulai Panggilan Audio/Visual ke Relawan</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-900 rounded-xl space-y-2 border border-slate-800">
                      <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                        <Radio className="w-3.5 h-3.5 animate-spin" />
                        <span>Transmisi Suara Lapangan Aktif (Terenkripsi):</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed pl-2 border-l-2 border-emerald-500">
                        "Halo Dokter, di {selectedRecord.location} korban sedang kami amankan. Korban tampak menatap kosong dan sempat histeris saat ada suara gemuruh susulan. Kami membutuhkan arahan rujukan medis segera."
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTeleCallActive(false)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                    >
                      <span>Akhiri Panggilan</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Context Preservation Grid: Red Flags & Assessment Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Box 1: Red Flag Indicators */}
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-bold text-rose-950 text-xs uppercase tracking-wide">
                      Indikator Red Flag Pasien
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedRecord.indicators.length > 0 ? (
                      selectedRecord.indicators.map((ind, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-white border border-rose-200 text-rose-950 font-bold text-[11px]"
                        >
                          ✓ {ind}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-rose-900 italic">Pemicu manual relawan posko</span>
                    )}
                  </div>
                  {selectedRecord.transcript && (
                    <p className="text-[11px] text-slate-700 italic border-t border-rose-200/60 pt-1.5">
                      "{selectedRecord.transcript}"
                    </p>
                  )}
                </div>

                {/* Box 2: Skor Terintegrasi */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                      Skor Penapisan Triase
                    </span>
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Total: {selectedRecord.totalIntegratedScore ?? (selectedRecord.score + (selectedRecord.riskFactorScore || 0) + (selectedRecord.functionalScoreTotal || 0))} / 37
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">SRQ-20</span>
                      <span className="font-bold text-slate-800">{selectedRecord.score}/20</span>
                    </div>
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">Risiko</span>
                      <span className="font-bold text-slate-800">{selectedRecord.riskFactorScore ?? 0}/8</span>
                    </div>
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">Fungsi</span>
                      <span className="font-bold text-slate-800">{selectedRecord.functionalScoreTotal ?? 0}/9</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Lokasi Posko: <strong>{selectedRecord.location}</strong>
                  </p>
                </div>
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

              {/* Two-Tiered Execution Action Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block text-center tracking-wider">
                  Keputusan Triase Sekunder (Two-Tiered Decision)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleConfirmRujukan(selectedRecord.id)}
                    className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfirmasi T0-Confirmed</span>
                    </div>
                    <span className="text-[10px] font-normal opacity-90">Kirim PSC 119 & Bed IGD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDowngradeStatus(selectedRecord.id, 'T1')}
                    className="p-3.5 rounded-2xl bg-white hover:bg-orange-50 active:scale-[0.99] text-orange-950 font-bold text-xs flex flex-col items-center justify-center gap-1 border border-orange-300 shadow-2xs transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="w-4 h-4 text-orange-600" />
                      <span>Downgrade ke T1</span>
                    </div>
                    <span className="text-[10px] font-normal text-orange-800">Risiko Tinggi Non-Kritis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDowngradeStatus(selectedRecord.id, 'T2')}
                    className="p-3.5 rounded-2xl bg-white hover:bg-amber-50 active:scale-[0.99] text-amber-950 font-bold text-xs flex flex-col items-center justify-center gap-1 border border-amber-300 shadow-2xs transition"
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
    </div>
  );
};
