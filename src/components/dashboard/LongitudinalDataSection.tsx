import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { getStoredSurvivors } from '../../data/mockSurvivors';
import { AssessmentRecord, LocationPost, TriageTier } from '../../types/assessment';

type SortField = 'name' | 'tier' | 'posko' | 'recordsCount';
type SortOrder = 'asc' | 'desc';

export const LongitudinalDataSection: React.FC = () => {
  const { centralAssessments } = useAssessment();
  const storedSurvivors = useMemo(() => getStoredSurvivors(), []);

  const [search, setSearch] = useState('');
  const [filterPosko, setFilterPosko] = useState<'ALL' | LocationPost>('ALL');
  const [filterTier, setFilterTier] = useState<'ALL' | TriageTier>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrajectorySurvivor, setSelectedTrajectorySurvivor] = useState<{
    profile: {
      id: string;
      nik: string;
      name: string;
      age?: number | string;
      gender?: 'L' | 'P';
      posko: string;
      category?: string;
    };
    records: AssessmentRecord[];
    pfaCompletedAt?: string;
    pfaNotes?: string;
  } | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('tier');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const pageSize = 10;

  // Group assessments by survivor ID or NIK
  const groupedData = useMemo(() => {
    const map = new Map<
      string,
      {
        profile: {
          id: string;
          nik: string;
          name: string;
          age?: number | string;
          gender?: 'L' | 'P';
          posko: string;
          category?: string;
        };
        records: AssessmentRecord[];
        pfaCompletedAt?: string;
        pfaNotes?: string;
      }
    >();

    // 1. Populate registered survivors
    storedSurvivors.forEach((s) => {
      map.set(s.id, {
        profile: {
          id: s.id,
          nik: s.nik || 'NIK Belum Terdata',
          name: s.name,
          age: s.age,
          gender: s.gender,
          posko: s.posko,
          category: s.category,
        },
        records: [],
        pfaCompletedAt: s.pfaRecord?.completedAt,
        pfaNotes: s.pfaRecord?.listenNotes,
      });
    });

    // 2. Associate central assessments
    centralAssessments.forEach((r) => {
      const key = r.victimId || r.id || 'UNKNOWN';
      const existing = map.get(key);

      if (existing) {
        const isDuplicate = existing.records.some((rec) =>
          rec.recordId && r.recordId ? rec.recordId === r.recordId : false
        );
        if (!isDuplicate) {
          existing.records.push(r);
        }
      } else {
        map.set(key, {
          profile: {
            id: key,
            nik: r.nik || 'NIK Belum Terdata',
            name: r.victimName || `Penyintas ${key}`,
            age: r.victimAge,
            gender: r.victimGender,
            posko: r.location,
            category: r.victimCategory,
          },
          records: [r],
        });
      }
    });

    return Array.from(map.values());
  }, [centralAssessments, storedSurvivors]);

  // Determine current tier of a survivor
  const getSurvivorTier = (item: (typeof groupedData)[0]): TriageTier => {
    if (item.records.length > 0) {
      const latest = item.records[0];
      if (latest.triageTier) return latest.triageTier;
      if (latest.zone === 'RED') return latest.criticalTriggered ? 'T0' : 'T1';
      if (latest.zone === 'YELLOW') return 'T2';
      return 'T3';
    }
    return 'T3';
  };

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
    const q = search.trim().toLowerCase();
    const filtered = groupedData.filter((item) => {
      const matchesSearch =
        !q ||
        item.profile.name.toLowerCase().includes(q) ||
        item.profile.id.toLowerCase().includes(q) ||
        (item.profile.nik ? item.profile.nik.toLowerCase().includes(q) : false) ||
        item.profile.posko.toLowerCase().includes(q);

      const matchesPosko = filterPosko === 'ALL' || item.profile.posko === filterPosko;
      const currentTier = getSurvivorTier(item);
      const matchesTier = filterTier === 'ALL' || currentTier === filterTier;

      return matchesSearch && matchesPosko && matchesTier;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'tier') {
        comparison = getTierWeight(getSurvivorTier(a)) - getTierWeight(getSurvivorTier(b));
      } else if (sortField === 'name') {
        comparison = a.profile.name.localeCompare(b.profile.name);
      } else if (sortField === 'posko') {
        comparison = a.profile.posko.localeCompare(b.profile.posko);
      } else if (sortField === 'recordsCount') {
        comparison = a.records.length - b.records.length;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [groupedData, search, filterPosko, filterTier, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSorted.length / pageSize) || 1;
  const paginated = useMemo(() => {
    return filteredAndSorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

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

  const renderTierBadge = (tier: TriageTier) => {
    switch (tier) {
      case 'T0':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200"
            title="T0 Emergency"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>🚨 T0 Emergency</span>
          </span>
        );
      case 'T1':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200"
            title="T1 High Risk"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
            <span>🔴 T1 High Risk</span>
          </span>
        );
      case 'T2':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200"
            title="T2 Moderate"
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
            title="T3 Low Risk"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>🟢 T3 Low Risk</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Detailed Trajectory Modal */}
      {selectedTrajectorySurvivor && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-mono font-bold text-xs text-blue-700 shadow-2xs">
                  {selectedTrajectorySurvivor.profile.id.replace('RM-2026-', '').replace('VCT-', '')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Lintasan Pemulihan Psikologis (30 Hari): {selectedTrajectorySurvivor.profile.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-slate-700 font-semibold">{selectedTrajectorySurvivor.profile.id}</span>
                    <span>·</span>
                    <span className="font-mono">{selectedTrajectorySurvivor.profile.nik}</span>
                    <span>·</span>
                    <span className="font-medium text-slate-600">{selectedTrajectorySurvivor.profile.posko}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrajectorySurvivor(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs text-slate-700 leading-relaxed flex-1">
              {/* Acute PFA Card */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Fase Akut: Pertolongan Pertama Psikologis (PFA Hari 1–3)
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {selectedTrajectorySurvivor.pfaCompletedAt || 'Tercatat di Posko'}
                  </span>
                </div>
                <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-blue-100 text-xs">
                  {selectedTrajectorySurvivor.pfaNotes
                    ? `"${selectedTrajectorySurvivor.pfaNotes}"`
                    : 'Intervensi penstabilan emosi dasar Look-Listen-Link telah dilaksanakan.'}
                </p>
              </div>

              {/* Follow-up Sessions Timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Riwayat Sesi Penapisan Lanjutan SRQ-20 ({selectedTrajectorySurvivor.records.length} Sesi)
                  </span>
                  <span className="text-[11px] text-slate-500">Kronologis Terbaru di Atas</span>
                </div>

                {selectedTrajectorySurvivor.records.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedTrajectorySurvivor.records.map((rec, rIdx) => (
                      <div key={rec.recordId || `${rec.id}-${rIdx}`} className="p-3.5 bg-white space-y-2 hover:bg-slate-50/60 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {rec.recordId || `SESI-${rIdx + 1}`}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {rec.timestamp}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {rec.phase === 'acute_pfa' ? 'Intervensi PFA' : 'Wawancara SRQ-20'} ({rec.method})
                            </span>
                          </div>
                          {renderTierBadge(rec.triageTier || (rec.zone === 'RED' ? 'T1' : rec.zone === 'YELLOW' ? 'T2' : 'T3'))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block font-medium">Skor Integrasi Total:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {rec.totalIntegratedScore !== undefined ? `${rec.totalIntegratedScore} / 37` : `${rec.score} Point`}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Lokasi Asesmen:</span>
                            <span className="font-medium text-slate-800">{rec.location}</span>
                          </div>
                        </div>

                        {rec.indicators && rec.indicators.length > 0 && (
                          <div className="text-[11px] text-slate-600">
                            <span className="font-medium text-slate-500">Indikator:</span>{' '}
                            {rec.indicators.join(', ')}
                          </div>
                        )}

                        {rec.recommendedAction && (
                          <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <strong>Rekomendasi:</strong> {rec.recommendedAction}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 text-slate-400 text-xs text-center rounded-xl border border-slate-200">
                    Belum ada riwayat asesmen berkala SRQ-20 yang dicatat untuk penyintas ini.
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTrajectorySurvivor(null)}
                className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                DATA LONGITUDINAL PENAPISAN PENYINTAS (HARI 1 – 30)
              </h2>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                Pusat Pemantauan BPBD / Dinkes
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan lintasan pemulihan psikologis penyintas terdaftar dari fase akut (PFA) hingga skrining berkala SRQ-20.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">
              Total Penyintas Terpantau: <strong className="text-slate-900 font-mono">{filteredAndSorted.length}</strong> orang
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama penyintas, NIK, ID internal, atau posko..."
              className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={filterPosko}
              onChange={(e) => {
                setFilterPosko(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-xs text-slate-700 font-medium rounded-lg px-2.5 py-1.5 outline-none hover:border-slate-400 transition cursor-pointer shadow-2xs"
              aria-label="Filter Posko"
            >
              <option value="ALL">Semua Posko</option>
              <option value="Posko A">Posko A</option>
              <option value="Posko B">Posko B</option>
              <option value="Posko C">Posko C</option>
              <option value="Posko D">Posko D</option>
            </select>

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
                  {tier === 'ALL' ? 'Semua' : tier}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <span>Penyintas / ID & NIK</span>
                {renderSortIndicator('name')}
              </th>
              <th
                onClick={() => handleSort('posko')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <span>Posko</span>
                {renderSortIndicator('posko')}
              </th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Demografi</th>
              <th
                onClick={() => handleSort('tier')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <span>Status Triase Terkini</span>
                {renderSortIndicator('tier')}
              </th>
              <th
                onClick={() => handleSort('recordsCount')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <span>Total Sesi (30 Hari)</span>
                {renderSortIndicator('recordsCount')}
              </th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Asesmen Terakhir</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length > 0 ? (
              paginated.map((item) => {
                const currentTier = getSurvivorTier(item);
                const latestRecord = item.records[0];

                return (
                  <tr
                    key={item.profile.id}
                    onClick={() => setSelectedTrajectorySurvivor(item)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs">
                          {item.profile.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                          <span className="font-semibold text-blue-700">{item.profile.id}</span>
                          <span>·</span>
                          <span>{item.profile.nik}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800 text-xs">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.profile.posko}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="text-slate-700 text-xs">
                        {item.profile.category || 'Dewasa'} ({item.profile.age ? `${item.profile.age} th` : '-'}) ·{' '}
                        {item.profile.gender === 'L' ? 'L' : 'P'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderTierBadge(currentTier)}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.records.length} Sesi Terdata</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {latestRecord?.timestamp || item.pfaCompletedAt || '-'}
                    </td>

                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrajectorySurvivor(item);
                        }}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>Buka Lintasan</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                  Tidak ada rekam jejak penyintas yang sesuai dengan filter pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>

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

      {/* Mobile/Tablet Card Pattern (< 768px) */}
      <div className="block md:hidden space-y-2.5">
        {paginated.length > 0 ? (
          paginated.map((item) => {
            const currentTier = getSurvivorTier(item);
            const latestRecord = item.records[0];

            return (
              <div
                key={item.profile.id}
                onClick={() => setSelectedTrajectorySurvivor(item)}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5 cursor-pointer active:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{item.profile.name}</h3>
                    <div className="text-[11px] font-mono text-slate-500">
                      {item.profile.id} · {item.profile.nik}
                    </div>
                  </div>
                  {renderTierBadge(currentTier)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{item.profile.posko}</span>
                  </div>
                  <div className="text-right">
                    <span>{item.records.length} Sesi Terdata</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Update: {latestRecord?.timestamp || item.pfaCompletedAt || '-'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrajectorySurvivor(item);
                    }}
                    className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 font-semibold text-xs shadow-2xs"
                  >
                    Buka Lintasan
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
            Tidak ada rekam jejak penyintas yang sesuai.
          </div>
        )}
      </div>
    </div>
  );
};
