import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Clock,
  MoreVertical,
} from 'lucide-react';
import {
  IconTable,
  IconSearch,
  IconDownload,
  IconPlus,
  IconChevronDown,
  IconBrain,
  IconBolt,
  IconCircleCheck,
  IconShieldExclamation,
  IconAlertTriangle,
  IconActivityHeartbeat,
  IconCheck,
  IconId,
  IconStethoscope,
  IconFirstAidKit,
  IconBuildingHospital,
} from '@tabler/icons-react';
import { AssessmentRecord, LocationPost, TriageTier } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';

interface RecentAssessmentsTableProps {
  onSelectRecord?: (record: AssessmentRecord) => void;
}

export const RecentAssessmentsTable: React.FC<RecentAssessmentsTableProps> = ({
  onSelectRecord,
}) => {
  const { centralAssessments } = useAssessment();
  const [search, setSearch] = useState('');
  const [filterPosko, setFilterPosko] = useState<string>('ALL');
  const [filterPhase, setFilterPhase] = useState<string>('ALL');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'identity' | 'triage' | 'protocol' | 'referral'>('identity');
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  const pageSize = 5;

  // Determine Triage Tier consistently
  const getRecordTier = (record: AssessmentRecord): TriageTier => {
    if (record.triageTier) return record.triageTier;
    if (record.zone === 'RED') {
      return record.criticalTriggered ? 'T0' : 'T1';
    }
    if (record.zone === 'YELLOW') return 'T2';
    return 'T3';
  };

  // Base list merged with demonstration records if needed to ensure 21 total records
  const allRecords = useMemo(() => {
    // Demonstration records matching exact user prompt examples
    const seedShowcase: AssessmentRecord[] = [
      {
        id: 'RM-2026-000089',
        recordId: 'RM-2026-000089',
        victimId: 'RM-2026-000089',
        timestamp: '10:21',
        victimName: 'nando',
        nik: '3578012345670089',
        location: 'Posko B',
        method: 'VERBAL',
        phase: 'followup_srq20',
        zone: 'RED',
        triageTier: 'T0',
        score: 15,
        totalIntegratedScore: 15,
        statusTitle: 'Emergency Red Flag: Kegawatdaruratan Jiwa',
        criticalTriggered: true,
        indicators: ['Risiko keamanan jiwa', 'Gejala psikotik akut'],
        recommendedAction: 'RED FLAG OVERRIDE: Segera dampingi 100%. Siagakan PSC 119 dan rujukan IGD RS.',
        syncStatus: 'synced',
      },
      {
        id: 'RM-2026-000081',
        recordId: 'RM-2026-000081',
        victimId: 'RM-2026-000081',
        timestamp: '12:11',
        victimName: 'daffa',
        nik: '3578012345670081',
        location: 'Posko A',
        method: 'VERBAL',
        phase: 'acute_pfa',
        zone: 'YELLOW',
        triageTier: 'T2',
        score: 8,
        totalIntegratedScore: 8,
        statusTitle: 'Distres Adaptif Sedang',
        criticalTriggered: false,
        indicators: ['Gelisah', 'Sulit tidur'],
        recommendedAction: 'T2 MODERATE: Pendampingan Psychological First Aid (PFA) berkala.',
        syncStatus: 'synced',
      },
      {
        id: 'RM-2026-000026',
        recordId: 'RM-2026-000026',
        victimId: 'RM-2026-000026',
        timestamp: '12:11',
        victimName: 'bugar',
        nik: '3578012345670026',
        location: 'Posko A',
        method: 'VERBAL',
        phase: 'followup_srq20',
        zone: 'GREEN',
        triageTier: 'T3',
        score: 3,
        totalIntegratedScore: 3,
        statusTitle: 'Dukungan Komunitas',
        criticalTriggered: false,
        indicators: ['Kecemasan ringan adaptif'],
        recommendedAction: 'T3 LOW RISK: Edukasi psikoedukasi kelompok tenda.',
        syncStatus: 'synced',
      },
      {
        id: 'RM-2026-000020',
        recordId: 'RM-2026-000020',
        victimId: 'RM-2026-000020',
        timestamp: '12:11',
        victimName: 'siti',
        nik: '3578012345670020',
        location: 'Posko C',
        method: 'CHECKLIST',
        phase: 'acute_pfa',
        zone: 'GREEN',
        triageTier: 'T3',
        score: 2,
        totalIntegratedScore: 2,
        statusTitle: 'Stabil & Adaptif',
        criticalTriggered: false,
        indicators: ['Sulit nafsu makan'],
        recommendedAction: 'T3 LOW RISK: Dukungan psikososial posko.',
        syncStatus: 'synced',
      },
      {
        id: 'RM-2026-000010',
        recordId: 'RM-2026-000010',
        victimId: 'RM-2026-000010',
        timestamp: '12:11',
        victimName: 'agung',
        nik: '3578012345670010',
        location: 'Posko A',
        method: 'VERBAL',
        phase: 'followup_srq20',
        zone: 'YELLOW',
        triageTier: 'T2',
        score: 11,
        totalIntegratedScore: 11,
        statusTitle: 'Distres Sedang Evaluasi',
        criticalTriggered: false,
        indicators: ['Pusing tegang', 'Gelisah'],
        recommendedAction: 'T2 MODERATE: Stabilisasi emosional dan PFA.',
        syncStatus: 'synced',
      },
    ];

    const existingMap = new Map<string, AssessmentRecord>();
    seedShowcase.forEach((r) => existingMap.set(r.recordId || r.id, r));
    centralAssessments.forEach((r) => {
      const id = r.recordId || r.victimId || r.id;
      if (!existingMap.has(id)) {
        existingMap.set(id, r);
      }
    });

    const list = Array.from(existingMap.values());
    // Ensure at least 21 total records for realistic command center master dataset
    while (list.length < 21) {
      const idx = list.length + 1;
      const poskoList: LocationPost[] = ['Posko A', 'Posko B', 'Posko C', 'Posko D'];
      const tierList: TriageTier[] = ['T3', 'T2', 'T1', 'T3', 'T2'];
      const tier = tierList[idx % tierList.length];
      list.push({
        id: `RM-2026-0000${idx < 10 ? '0' + idx : idx}`,
        recordId: `RM-2026-0000${idx < 10 ? '0' + idx : idx}`,
        victimId: `RM-2026-0000${idx < 10 ? '0' + idx : idx}`,
        timestamp: `${10 + (idx % 12)}:${10 + (idx % 49)}`,
        victimName: `Penyintas #${idx}`,
        nik: '-',
        location: poskoList[idx % poskoList.length],
        method: 'VERBAL',
        phase: idx % 2 === 0 ? 'followup_srq20' : 'acute_pfa',
        zone: tier === 'T1' ? 'RED' : tier === 'T2' ? 'YELLOW' : 'GREEN',
        triageTier: tier,
        score: tier === 'T1' ? 12 : tier === 'T2' ? 8 : 4,
        totalIntegratedScore: tier === 'T1' ? 14 : tier === 'T2' ? 9 : 4,
        criticalTriggered: false,
        indicators: ['Kondisi penyesuaian adaptif'],
        recommendedAction: 'Pendampingan psikososial standar posko.',
        syncStatus: 'synced',
      });
    }

    return list;
  }, [centralAssessments]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      const q = search.trim().toLowerCase();
      const id = (record.recordId || record.victimId || record.id).toLowerCase();
      const name = (record.victimName || '').toLowerCase();
      const nik = (record.nik || '').toLowerCase();
      const loc = record.location.toLowerCase();
      const notes = (record.volunteerNotes || '').toLowerCase();

      const matchesSearch =
        !q ||
        id.includes(q) ||
        name.includes(q) ||
        nik.includes(q) ||
        loc.includes(q) ||
        notes.includes(q);

      const matchesPosko = filterPosko === 'ALL' || record.location === filterPosko;
      const matchesPhase =
        filterPhase === 'ALL' ||
        (filterPhase === 'acute' && record.phase === 'acute_pfa') ||
        (filterPhase === 'followup' && record.phase === 'followup_srq20');

      const tier = getRecordTier(record);
      const matchesTier = filterTier === 'ALL' || tier === filterTier;

      return matchesSearch && matchesPosko && matchesPhase && matchesTier;
    });
  }, [allRecords, search, filterPosko, filterPhase, filterTier]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const newSel: Record<string, boolean> = {};
    if (checked) {
      paginatedRecords.forEach((r) => {
        newSel[r.recordId || r.id] = true;
      });
    }
    setSelectedRows(newSel);
  };

  const handleToggleRow = (id: string) => {
    setSelectedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRowClick = (record: AssessmentRecord) => {
    if (onSelectRecord) {
      onSelectRecord(record);
    } else {
      setSelectedRecord(record);
      setModalActiveTab('identity');
    }
  };

  const handleExport = () => {
    alert('Mengekspor Master Data Penyintas (Excel / CSV / PDF Agregat Wilayah)...');
  };

  const handleTambahData = () => {
    alert('Buka formulir registrasi dan skrining penyintas baru.');
  };

  return (
    <section id="master-data-table" className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
      {/* Table Card Header & Comprehensive Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <IconTable className="w-4 h-4 text-blue-600" stroke={2} />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Master Data Penyintas — Registrasi Asesmen Klinis & Lapangan
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 ml-8">
              Registrasi harian triase dan status penanganan penyintas berdasarkan posko dan fase bencana.
            </p>
          </div>
        </div>

        {/* Toolbar: Search + Dropdowns + Action Buttons */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <IconSearch className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari ID, nama, NIK, posko, atau gejala..."
              className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none transition"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Posko */}
            <div className="relative">
              <select
                value={filterPosko}
                onChange={(e) => {
                  setFilterPosko(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium rounded-lg pl-2.5 pr-7 py-1.5 outline-none transition cursor-pointer"
              >
                <option value="ALL">Semua Posko</option>
                <option value="Posko A">Posko A</option>
                <option value="Posko B">Posko B</option>
                <option value="Posko C">Posko C</option>
                <option value="Posko D">Posko D</option>
              </select>
              <IconChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Filter Fase */}
            <div className="relative">
              <select
                value={filterPhase}
                onChange={(e) => {
                  setFilterPhase(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium rounded-lg pl-2.5 pr-7 py-1.5 outline-none transition cursor-pointer"
              >
                <option value="ALL">Semua Fase</option>
                <option value="acute">Fase Akut (PFA)</option>
                <option value="followup">Fase Lanjutan (SRQ-20)</option>
              </select>
              <IconChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Filter Triase */}
            <div className="relative">
              <select
                value={filterTier}
                onChange={(e) => {
                  setFilterTier(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium rounded-lg pl-2.5 pr-7 py-1.5 outline-none transition cursor-pointer"
              >
                <option value="ALL">Semua Triase</option>
                <option value="T0">T0 Emergency</option>
                <option value="T1">T1 High Risk</option>
                <option value="T2">T2 Moderate</option>
                <option value="T3">T3 Low Risk</option>
              </select>
              <IconChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Ekspor Button */}
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <IconDownload className="w-3.5 h-3.5 text-slate-500" stroke={1.8} />
              <span>Ekspor</span>
            </button>

            {/* + Tambah Data Button */}
            <button
              type="button"
              onClick={handleTambahData}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <IconPlus className="w-3.5 h-3.5 text-white" stroke={2.5} />
              <span>Tambah Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 text-[11px] select-none">
            <tr>
              <th className="py-2.5 pl-4 pr-2 w-8">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  className="rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">ID Rekam Medis (RM)</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Waktu</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Nama / Inisial</th>
              <th className="py-2.5 px-3 whitespace-nowrap">NIK</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Posko</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Klasifikasi Triase</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Skor SRQ-20</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Waktu Asesmen</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Tahap Skrining</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Sinkronisasi</th>
              <th className="py-2.5 pr-4 pl-2 text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((row) => {
                const rowId = row.recordId || row.victimId || row.id;
                const tier = getRecordTier(row);
                const isSelected = !!selectedRows[rowId];

                // Exact row colors according to the triage color system
                let tierPill = (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>T3 Low Risk</span>
                  </span>
                );

                if (tier === 'T0') {
                  tierPill = (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      <span>T0 Emergency</span>
                    </span>
                  );
                } else if (tier === 'T1') {
                  tierPill = (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span>T1 High Risk</span>
                    </span>
                  );
                } else if (tier === 'T2') {
                  tierPill = (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>T2 Moderate</span>
                    </span>
                  );
                }

                // Phase styling
                const isAcute = row.phase === 'acute_pfa';
                const phasePill = isAcute ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <IconBolt className="w-3 h-3 text-blue-600" stroke={2} />
                    <span>Fase Akut (PFA)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    <IconBrain className="w-3 h-3 text-purple-600" stroke={2} />
                    <span>Fase Lanjutan (SRQ-20)</span>
                  </span>
                );

                return (
                  <tr
                    key={rowId}
                    onClick={() => handleRowClick(row)}
                    className={`hover:bg-slate-50/80 cursor-pointer transition ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-2.5 pl-4 pr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRow(rowId);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(rowId)}
                        className="rounded text-blue-600 accent-blue-600 cursor-pointer"
                      />
                    </td>

                    {/* RM / ID */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                      {rowId}
                    </td>

                    {/* Waktu */}
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {row.timestamp}
                    </td>

                    {/* Nama / Inisial */}
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap text-xs">
                      {row.victimName || '-'}
                    </td>

                    {/* NIK */}
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {row.nik || '-'}
                    </td>

                    {/* Posko */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
                      {row.location}
                    </td>

                    {/* Klasifikasi Triase */}
                    <td className="py-2.5 px-3 whitespace-nowrap">{tierPill}</td>

                    {/* Skor SRQ-20 */}
                    <td className="py-2.5 px-3 font-mono text-slate-800 font-semibold whitespace-nowrap text-xs">
                      {row.score !== undefined ? `${row.score} / 20` : '-'}
                    </td>

                    {/* Waktu Asesmen */}
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {row.timestamp}
                    </td>

                    {/* Tahap Skrining */}
                    <td className="py-2.5 px-3 whitespace-nowrap">{phasePill}</td>

                    {/* Sinkronisasi */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <IconCircleCheck className="w-3.5 h-3.5 text-emerald-600" stroke={2} />
                        <span>Synced</span>
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-2.5 pr-4 pl-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Lihat Rincian Rekam Medis"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-400 text-xs">
                  Tidak ada data penyintas yang sesuai dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-3 sm:px-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
        <div>
          Menampilkan{' '}
          <strong className="text-slate-800 font-mono">
            {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filteredRecords.length)}
          </strong>{' '}
          dari <strong className="text-slate-800 font-mono">{filteredRecords.length}</strong> data
        </div>

        {/* Page Buttons < 1 2 3 4 5 > */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer shadow-2xs"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`w-7 h-7 rounded text-xs font-semibold transition cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-7 h-7 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer shadow-2xs"
            aria-label="Halaman selanjutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clinical Safety & Decision-Support Disclaimer */}
      <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          <strong>Rekomendasi Sistem:</strong> Hasil asesmen merupakan alat bantu keputusan awal dan
          memerlukan validasi klinis oleh tenaga kesehatan profesional.
        </span>
        <span className="hidden sm:inline font-mono text-[10px] text-slate-400">
          RAPID-MIND v2.6 · Clinical Command Engine
        </span>
      </div>

      {/* Detailed Inspection Modal (Preserved Clinical Workflow) */}
      {selectedRecord && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center font-mono font-bold text-xs text-blue-700 shadow-2xs">
                  <span className="text-[9px] uppercase tracking-wider text-blue-500">RM</span>
                  <span>{selectedRecord.recordId ? selectedRecord.recordId.slice(-4) : 'MED'}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedRecord.victimName || `Pasien ${selectedRecord.recordId || selectedRecord.id}`}
                    </h3>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded">
                      {selectedRecord.recordId || selectedRecord.victimId || selectedRecord.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedRecord.location}
                    </span>
                    <span>·</span>
                    <span className="font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {selectedRecord.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-4 sm:px-5 gap-1 overflow-x-auto">
              {[
                { id: 'identity', label: 'Identitas & Lokasi', icon: IconId },
                { id: 'triage', label: 'Hasil Triase & Skor', icon: IconStethoscope },
                { id: 'protocol', label: 'Protokol & Observasi', icon: IconFirstAidKit },
                { id: 'referral', label: 'Status Rujukan', icon: IconBuildingHospital },
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
                        ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
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
              {modalActiveTab === 'identity' && (
                <div className="space-y-3.5 animate-in fade-in duration-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Nomor Identitas Kependudukan (NIK)
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {selectedRecord.nik && selectedRecord.nik !== '-'
                          ? selectedRecord.nik
                          : 'Belum Terdata (Fase Tanggap Darurat)'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        ID Registrasi Pasien (RM)
                      </span>
                      <span className="font-mono font-bold text-blue-700 text-xs">
                        {selectedRecord.recordId || selectedRecord.victimId || selectedRecord.id}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Usia</span>
                      <strong className="text-slate-800 text-xs">
                        {selectedRecord.victimAge ? `${selectedRecord.victimAge} Tahun` : 'Dewasa'}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Jenis Kelamin</span>
                      <strong className="text-slate-800 text-xs">
                        {selectedRecord.victimGender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Kategori</span>
                      <strong className="text-slate-800 text-xs">
                        {selectedRecord.victimCategory || 'Dewasa'}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Posko Evakuasi</span>
                      <strong className="text-slate-800 text-xs">{selectedRecord.location}</strong>
                    </div>
                  </div>
                </div>
              )}

              {modalActiveTab === 'triage' && (
                <div className="space-y-3.5 animate-in fade-in duration-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Tingkat Triase Terkonfirmasi
                      </span>
                      <div className="font-bold text-sm text-slate-900">
                        {getRecordTier(selectedRecord)}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getRecordTier(selectedRecord) === 'T0'
                          ? 'Emergency Override: Perlu respon seketika PSC 119.'
                          : getRecordTier(selectedRecord) === 'T1'
                          ? 'High Risk: Diperlukan evaluasi klinis spesialis jiwa.'
                          : getRecordTier(selectedRecord) === 'T2'
                          ? 'Moderate: Dukungan PFA berkelanjutan di posko.'
                          : 'Low Risk: Kondisi stabil dan adaptif.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Total Skor Integrasi
                      </span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {selectedRecord.score !== undefined ? `${selectedRecord.score} / 20 (SRQ)` : '-'}
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Skor integrasi total:{' '}
                        {selectedRecord.totalIntegratedScore ?? selectedRecord.score ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {modalActiveTab === 'protocol' && (
                <div className="space-y-3.5 animate-in fade-in duration-100">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Rekomendasi Protokol Tindakan:
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                      {selectedRecord.recommendedAction ||
                        'Dukungan psikososial standar sesuai panduan PFA.'}
                    </p>
                  </div>

                  {selectedRecord.transcript && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Transkrip Suara Wawancara (STT):
                      </span>
                      <p className="italic text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                        "{selectedRecord.transcript}"
                      </p>
                    </div>
                  )}

                  {selectedRecord.volunteerNotes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                        Catatan Khusus Relawan:
                      </span>
                      <p className="text-xs text-slate-700">{selectedRecord.volunteerNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {modalActiveTab === 'referral' && (
                <div className="space-y-3.5 animate-in fade-in duration-100">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Status Koordinasi Fasilitas Rujukan
                    </span>
                    <div className="flex items-center gap-2">
                      <IconBuildingHospital className="w-4 h-4 text-blue-600" stroke={1.8} />
                      <span className="font-semibold text-slate-900 text-xs">
                        {getRecordTier(selectedRecord) === 'T0'
                          ? 'Prioritas Koordinasi PSC 119 & IGD Jiwa'
                          : getRecordTier(selectedRecord) === 'T1'
                          ? 'Rujukan Terencana ke Poli Jiwa RSUD'
                          : 'Monitoring Posko / Perawatan Mandiri'}
                      </span>
                    </div>
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
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
