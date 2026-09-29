import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  MapPin,
  User,
  Activity,
  Building2,
  Clock,
  Shield,
  FileCheck,
} from 'lucide-react';
import { AssessmentRecord, LocationPost, TriageTier } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';

interface RecentAssessmentsTableProps {
  onSelectRecord?: (record: AssessmentRecord) => void;
}

type SortField = 'date' | 'tier' | 'victimId' | 'score';
type SortOrder = 'asc' | 'desc';

export const RecentAssessmentsTable: React.FC<RecentAssessmentsTableProps> = ({
  onSelectRecord,
}) => {
  const { centralAssessments } = useAssessment();
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<'ALL' | TriageTier>('ALL');
  const [filterLocation, setFilterLocation] = useState<'ALL' | LocationPost>('ALL');
  const [filterPhase, setFilterPhase] = useState<'ALL' | 'acute_pfa' | 'followup_srq20'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedModalRecord, setSelectedModalRecord] = useState<AssessmentRecord | null>(null);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'identity' | 'triage' | 'protocol' | 'referral'>('identity');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const pageSize = 10;

  // Helper to determine Triage Tier consistently
  const getRecordTier = (record: AssessmentRecord): TriageTier => {
    if (record.triageTier) return record.triageTier;
    if (record.zone === 'RED') {
      return record.criticalTriggered ? 'T0' : 'T1';
    }
    if (record.zone === 'YELLOW') return 'T2';
    return 'T3';
  };

  // Helper for tier sorting weight
  const getTierWeight = (tier: TriageTier): number => {
    switch (tier) {
      case 'T0': return 4;
      case 'T1': return 3;
      case 'T2': return 2;
      case 'T3': return 1;
      default: return 0;
    }
  };

  const filteredAndSorted = useMemo(() => {
    const filtered = centralAssessments.filter((record) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (record.recordId && record.recordId.toLowerCase().includes(q)) ||
        record.id.toLowerCase().includes(q) ||
        (record.victimId && record.victimId.toLowerCase().includes(q)) ||
        (record.victimName && record.victimName.toLowerCase().includes(q)) ||
        (record.nik && record.nik.toLowerCase().includes(q)) ||
        record.location.toLowerCase().includes(q) ||
        (record.transcript && record.transcript.toLowerCase().includes(q)) ||
        (record.volunteerNotes && record.volunteerNotes.toLowerCase().includes(q));

      const recordTier = getRecordTier(record);
      const matchesTier = filterTier === 'ALL' || recordTier === filterTier;
      const matchesLocation = filterLocation === 'ALL' || record.location === filterLocation;
      const matchesPhase = filterPhase === 'ALL' || record.phase === filterPhase;

      return matchesSearch && matchesTier && matchesLocation && matchesPhase;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        comparison = timeA - timeB;
      } else if (sortField === 'tier') {
        comparison = getTierWeight(getRecordTier(a)) - getTierWeight(getRecordTier(b));
      } else if (sortField === 'victimId') {
        const idA = a.victimId || a.id;
        const idB = b.victimId || b.id;
        comparison = idA.localeCompare(idB);
      } else if (sortField === 'score') {
        const scoreA = a.totalIntegratedScore !== undefined ? a.totalIntegratedScore : a.score;
        const scoreB = b.totalIntegratedScore !== undefined ? b.totalIntegratedScore : b.score;
        comparison = scoreA - scoreB;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [centralAssessments, search, filterTier, filterLocation, filterPhase, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSorted.length / pageSize) || 1;
  const paginated = useMemo(() => {
    return filteredAndSorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  const handleRowClick = (record: AssessmentRecord, rowKey: string) => {
    setSelectedRowKey(rowKey);
    if (onSelectRecord) {
      onSelectRecord(record);
    } else {
      setSelectedModalRecord(record);
      setModalActiveTab('identity');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1 inline-block" />;
    }
    return sortOrder === 'desc' ? (
      <ArrowDown className="w-3 h-3 text-blue-600 font-bold ml-1 inline-block" />
    ) : (
      <ArrowUp className="w-3 h-3 text-blue-600 font-bold ml-1 inline-block" />
    );
  };

  // Explicit label + semantic color for triage tier (T0 red, T1 orange, T2 amber, T3 green)
  const renderTriageBadge = (record: AssessmentRecord) => {
    const tier = getRecordTier(record);
    switch (tier) {
      case 'T0':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200"
            title="T0 Emergency: Kasus Kegawatdaruratan Psikiatri / Medis Akut (PSC 119 & RS)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>🚨 T0 Emergency</span>
          </span>
        );
      case 'T1':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200"
            title="T1 High Risk: Skor SRQ-20 Tinggi / Risiko Berat (Rujukan Spesialis)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
            <span>🔴 T1 High Risk</span>
          </span>
        );
      case 'T2':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200"
            title="T2 Moderate: Distres Psikologis Sedang (Pendampingan PFA Lanjutan)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            <span>🟡 T2 Moderate</span>
          </span>
        );
      case 'T3':
      default:
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
            title="T3 Low Risk: Gejala Ringan / Kondisi Adaptif (Dukungan Komunitas)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>🟢 T3 Low Risk</span>
          </span>
        );
    }
  };

  const renderPhaseBadge = (record: AssessmentRecord) => {
    if (record.phase === 'acute_pfa') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Shield className="w-3 h-3 text-blue-600" />
          <span>Fase Akut (PFA)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        <Activity className="w-3 h-3 text-purple-600" />
        <span>Fase Lanjutan (SRQ-20)</span>
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
      {/* Detail Inspection Modal with Progressive Disclosure */}
      {selectedModalRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-patient-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center font-mono font-bold text-xs text-blue-700 shadow-2xs">
                  <span className="text-[9px] uppercase tracking-wider text-blue-500">ID</span>
                  <span>{selectedModalRecord.victimId ? selectedModalRecord.victimId.slice(-4) : 'PAS'}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 id="modal-patient-title" className="text-sm font-bold text-slate-900">
                      {selectedModalRecord.victimName || `Penyintas ${selectedModalRecord.victimId || selectedModalRecord.id}`}
                    </h3>
                    {renderTriageBadge(selectedModalRecord)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-slate-700 font-semibold">{selectedModalRecord.victimId || selectedModalRecord.id}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedModalRecord.location}
                    </span>
                    <span>·</span>
                    <span className="font-mono">{selectedModalRecord.timestamp}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedModalRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                title="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progressive Disclosure Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-4 sm:px-5 gap-1 overflow-x-auto">
              {[
                { id: 'identity', label: 'Identitas & Lokasi', icon: User },
                { id: 'triage', label: 'Hasil Triase & Skor', icon: Activity },
                { id: 'protocol', label: 'Protokol & Observasi', icon: FileCheck },
                { id: 'referral', label: 'Status Rujukan', icon: Building2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = modalActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalActiveTab(tab.id as any)}
                    className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/30'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs text-slate-700 leading-relaxed flex-1">
              {/* Tab 1: Identitas & Lokasi */}
              {modalActiveTab === 'identity' && (
                <div className="space-y-3.5 animate-in fade-in duration-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Nomor Identitas Kependudukan (NIK)
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {selectedModalRecord.nik || 'NIK Belum Terdata (Fase Tanggap Darurat)'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        ID Penyintas Internal
                      </span>
                      <span className="font-mono font-bold text-blue-700 text-xs">
                        {selectedModalRecord.victimId || selectedModalRecord.id}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Usia</span>
                      <strong className="text-slate-800 text-xs">{selectedModalRecord.victimAge ? `${selectedModalRecord.victimAge} Tahun` : 'Dewasa'}</strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Jenis Kelamin</span>
                      <strong className="text-slate-800 text-xs">{selectedModalRecord.victimGender === 'L' ? 'Laki-laki' : 'Perempuan'}</strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Kategori</span>
                      <strong className="text-slate-800 text-xs">{selectedModalRecord.victimCategory || 'Dewasa'}</strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Posko Evakuasi</span>
                      <strong className="text-slate-800 text-xs">{selectedModalRecord.location}</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Metode Pengambilan Data</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {selectedModalRecord.method === 'VERBAL' ? 'Wawancara Terpandu (Verbal + STT)' : 'Checklist Non-Verbal'}
                      </span>
                    </div>
                    <div>{renderPhaseBadge(selectedModalRecord)}</div>
                  </div>
                </div>
              )}

              {/* Tab 2: Hasil Triase & Skor */}
              {modalActiveTab === 'triage' && (
                <div className="space-y-3.5 animate-in fade-in duration-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Klasifikasi Tingkat Triase
                      </span>
                      <div>{renderTriageBadge(selectedModalRecord)}</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getRecordTier(selectedModalRecord) === 'T0'
                          ? 'Kegawatdaruratan psikiatri/medis aktif, membutuhkan rujukan langsung.'
                          : getRecordTier(selectedModalRecord) === 'T1'
                          ? 'Indikasi distres psikologis berat, evaluasi tenaga profesional disarankan.'
                          : getRecordTier(selectedModalRecord) === 'T2'
                          ? 'Distres tingkat sedang, memerlukan dukungan PFA berkala.'
                          : 'Kondisi stabil dan adaptif dalam komunitas penampungan.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Total Skor Integrasi
                      </span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {selectedModalRecord.totalIntegratedScore !== undefined
                          ? `${selectedModalRecord.totalIntegratedScore} / 37`
                          : `${selectedModalRecord.score} Point`}
                      </div>
                      {selectedModalRecord.statusTitle && (
                        <span className="text-[11px] font-semibold text-blue-700 block">
                          {selectedModalRecord.statusTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skor Rincian Tiga Komponen */}
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-900 block">
                      Rincian Tiga Komponen Penilaian Integrasi
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                        <span className="text-[10px] text-slate-500 block font-medium">1. Gejala SRQ-20</span>
                        <strong className="text-slate-900 text-sm font-mono">{selectedModalRecord.score} / 20</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                        <span className="text-[10px] text-slate-500 block font-medium">2. Faktor Risiko (A)</span>
                        <strong className="text-slate-900 text-sm font-mono">{selectedModalRecord.riskFactorScore ?? 0} / 8</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                        <span className="text-[10px] text-slate-500 block font-medium">3. Fungsi Harian (B)</span>
                        <strong className="text-slate-900 text-sm font-mono">{selectedModalRecord.functionalScoreTotal ?? 0} / 9</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Protokol & Observasi */}
              {modalActiveTab === 'protocol' && (
                <div className="space-y-3.5 animate-in fade-in duration-100">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Rekomendasi Protokol Tindakan:
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {selectedModalRecord.recommendedAction || 'Dukungan psikososial standar sesuai panduan PFA.'}
                    </p>
                  </div>

                  {selectedModalRecord.transcript && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Transkrip Percakapan / Keluhan Verbal:
                      </span>
                      <p className="italic text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                        "{selectedModalRecord.transcript}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Indikator Risiko yang Terdeteksi:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedModalRecord.indicators && selectedModalRecord.indicators.length > 0 ? (
                        selectedModalRecord.indicators.map((ind, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium"
                          >
                            ✓ {ind}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Tidak ditemukan indikator bahaya akut.</span>
                      )}
                    </div>
                  </div>

                  {selectedModalRecord.volunteerNotes && (
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 block">
                        Catatan Khusus Relawan Lapangan:
                      </span>
                      <p className="text-xs text-amber-950 font-medium">
                        {selectedModalRecord.volunteerNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Status Rujukan */}
              {modalActiveTab === 'referral' && (
                <div className="space-y-3.5 animate-in fade-in duration-100">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Status Koordinasi Fasilitas Kesehatan (Role 2 / PSC 119)
                    </span>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-slate-900 text-xs">
                        {selectedModalRecord.hospitalReferralStatus
                          ? `Status: ${selectedModalRecord.hospitalReferralStatus.toUpperCase()}`
                          : getRecordTier(selectedModalRecord) === 'T0'
                          ? 'Perlu Validasi Tele-Emergency PSC 119'
                          : 'Tidak Memerlukan Evakuasi Rawat Inap'}
                      </span>
                    </div>
                    {selectedModalRecord.hospitalNotes && (
                      <p className="text-xs text-slate-600 mt-1">
                        Catatan Nakes: {selectedModalRecord.hospitalNotes}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Sinkronisasi Server</span>
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Tersinkronisasi ke Pusat Data Terpadu
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      ID Tiket: {selectedModalRecord.recordId || `ASM-${selectedModalRecord.id}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Pusat Koordinasi Sumber Daya & Rekam Triase Jiwa
              </span>
              <button
                type="button"
                onClick={() => setSelectedModalRecord(null)}
                className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Card Header & Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                MASTER DATA PENYINTAS — REGISTRI ASESMEN KLINIS & LAPANGAN
              </h2>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                Role 3 Command Center
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registri rekam triase dan status penapisan komprehensif penyintas bencana di seluruh posko darurat.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">
              Menampilkan <strong className="text-slate-900 font-mono">{filteredAndSorted.length}</strong> dari{' '}
              <strong className="text-slate-900 font-mono">{centralAssessments.length}</strong> rekam data
            </span>
          </div>
        </div>

        {/* Compact Filters Bar */}
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari ID penyintas, NIK, nama korban, posko, atau transkrip..."
              className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none transition shadow-2xs"
            />
          </div>

          {/* Posko Select Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={filterLocation}
              onChange={(e) => {
                setFilterLocation(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-xs text-slate-700 font-medium rounded-lg px-2.5 py-1.5 outline-none hover:border-slate-400 transition cursor-pointer shadow-2xs"
              aria-label="Filter Posko"
            >
              <option value="ALL">Semua Posko</option>
              <option value="Posko A">Posko A (Pusat)</option>
              <option value="Posko B">Posko B (Timur)</option>
              <option value="Posko C">Posko C (Utara)</option>
              <option value="Posko D">Posko D (Selatan)</option>
            </select>

            {/* Phase Filter */}
            <select
              value={filterPhase}
              onChange={(e) => {
                setFilterPhase(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-xs text-slate-700 font-medium rounded-lg px-2.5 py-1.5 outline-none hover:border-slate-400 transition cursor-pointer shadow-2xs"
              aria-label="Filter Fase Penapisan"
            >
              <option value="ALL">Semua Fase</option>
              <option value="acute_pfa">Fase Akut (PFA)</option>
              <option value="followup_srq20">Fase Lanjutan (SRQ-20)</option>
            </select>

            {/* Triage Tier Segment Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {(['ALL', 'T0', 'T1', 'T2', 'T3'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => {
                    setFilterTier(tier);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    filterTier === tier
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tier === 'ALL' ? 'Semua Triase' : tier}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
            <tr>
              <th
                onClick={() => handleSort('victimId')}
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <span>Penyintas / ID</span>
                {renderSortIndicator('victimId')}
              </th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Posko / Lokasi</th>
              <th
                onClick={() => handleSort('tier')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <span>Klasifikasi Triase</span>
                {renderSortIndicator('tier')}
              </th>
              <th
                onClick={() => handleSort('date')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <span>Waktu Asesmen</span>
                {renderSortIndicator('date')}
              </th>
              <th
                onClick={() => handleSort('score')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <span>Skor Integrasi</span>
                {renderSortIndicator('score')}
              </th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Tahap Skrining</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Sinkronisasi</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length > 0 ? (
              paginated.map((row, idx) => {
                const rowKey = row.recordId || `${row.id}-${row.timestamp}-${idx}`;
                const victimId = row.victimId || row.id;
                const isSelected = selectedRowKey === rowKey;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => handleRowClick(row, rowKey)}
                    className={`hover:bg-slate-50/80 cursor-pointer transition ${
                      isSelected ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {/* 1. Patient / ID */}
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {victimId}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium truncate max-w-[160px]">
                          {row.victimName || 'Nama Belum Terdata'}
                          {row.victimAge ? ` (${row.victimAge} th)` : ''}
                        </span>
                      </div>
                    </td>

                    {/* 2. Location / Posko */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800 text-xs">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {row.location}
                      </span>
                    </td>

                    {/* 3. Triage Tier */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderTriageBadge(row)}
                    </td>

                    {/* 4. Assessment Date */}
                    <td className="py-2.5 px-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {row.timestamp}
                    </td>

                    {/* 5. Integrated Score */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {row.totalIntegratedScore !== undefined
                          ? `${row.totalIntegratedScore}/37`
                          : `${row.score} pt`}
                      </span>
                    </td>

                    {/* 6. Phase */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderPhaseBadge(row)}
                    </td>

                    {/* 7. Status */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1 text-[11px]">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Synced
                      </span>
                    </td>

                    {/* 8. Action */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row, rowKey);
                        }}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                  Tidak ada rekam asesmen penyintas yang sesuai dengan filter pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card Pattern (< 768px) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {paginated.length > 0 ? (
          paginated.map((row, idx) => {
            const rowKey = row.recordId || `${row.id}-${row.timestamp}-${idx}`;
            const victimId = row.victimId || row.id;

            return (
              <div
                key={rowKey}
                onClick={() => handleRowClick(row, rowKey)}
                className="p-3.5 hover:bg-slate-50/80 active:bg-slate-100 transition cursor-pointer space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 text-xs">{victimId}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {row.victimName || 'Nama Belum Terdata'}
                    </span>
                  </div>
                  {renderTriageBadge(row)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{row.location}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-slate-500 justify-end">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{row.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      Skor:{' '}
                      <strong className="font-mono text-slate-900">
                        {row.totalIntegratedScore !== undefined ? `${row.totalIntegratedScore}/37` : `${row.score} pt`}
                      </strong>
                    </span>
                    {renderPhaseBadge(row)}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(row, rowKey);
                    }}
                    className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 font-semibold text-xs shadow-2xs"
                  >
                    Buka Detail
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            Tidak ada rekam asesmen penyintas yang sesuai.
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="p-3 sm:px-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div>
          Halaman <strong className="text-slate-800 font-mono">{currentPage}</strong> dari{' '}
          <strong className="text-slate-800 font-mono">{totalPages}</strong>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs text-xs font-semibold flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs text-xs font-semibold flex items-center gap-1"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
