import React, { useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
} from 'lucide-react';
import { AssessmentRecord, TriageZone, LocationPost } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';

interface RecentAssessmentsTableProps {
  onSelectRecord?: (record: AssessmentRecord) => void;
}

export const RecentAssessmentsTable: React.FC<RecentAssessmentsTableProps> = ({
  onSelectRecord,
}) => {
  const { centralAssessments } = useAssessment();
  const [search, setSearch] = useState('');
  const [filterZone, setFilterZone] = useState<'ALL' | TriageZone>('ALL');
  const [filterLocation, setFilterLocation] = useState<'ALL' | LocationPost>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedModalRecord, setSelectedModalRecord] = useState<AssessmentRecord | null>(null);

  const pageSize = 10;

  const filtered = centralAssessments.filter((record) => {
    const matchesSearch =
      (record.recordId && record.recordId.toLowerCase().includes(search.toLowerCase())) ||
      record.id.toLowerCase().includes(search.toLowerCase()) ||
      (record.victimId && record.victimId.toLowerCase().includes(search.toLowerCase())) ||
      (record.victimName && record.victimName.toLowerCase().includes(search.toLowerCase())) ||
      record.location.toLowerCase().includes(search.toLowerCase()) ||
      (record.transcript && record.transcript.toLowerCase().includes(search.toLowerCase())) ||
      (record.volunteerNotes && record.volunteerNotes.toLowerCase().includes(search.toLowerCase()));

    const matchesZone = filterZone === 'ALL' || record.zone === filterZone;
    const matchesLocation = filterLocation === 'ALL' || record.location === filterLocation;

    return matchesSearch && matchesZone && matchesLocation;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRowClick = (record: AssessmentRecord) => {
    if (onSelectRecord) {
      onSelectRecord(record);
    } else {
      setSelectedModalRecord(record);
    }
  };

  const renderPhaseBadge = (record: AssessmentRecord) => {
    if (record.triageTier === 'T0' || (record.zone === 'RED' && record.criticalTriggered)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
          🚨 T0 Red Flag
        </span>
      );
    }
    if (record.phase === 'acute_pfa') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          🛡️ PFA (Fase Akut)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        📋 SRQ-20 ({record.triageTier || 'Triase'})
      </span>
    );
  };

  const renderZoneBadge = (zone: TriageZone) => {
    switch (zone) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Green
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Yellow
          </span>
        );
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            Red
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
      {/* Detail Inspection Modal */}
      {selectedModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center font-mono font-bold text-[10px] text-blue-700 shadow-xs">
                  <span className="text-[9px] text-blue-500 uppercase">LOG</span>
                  <span className="text-[10px]">{selectedModalRecord.recordId ? selectedModalRecord.recordId.slice(-4) : 'ASM'}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {renderZoneBadge(selectedModalRecord.zone)}
                    {renderPhaseBadge(selectedModalRecord)}
                    <span className="text-xs text-slate-500 font-mono">
                      {selectedModalRecord.timestamp}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-800 mt-1">
                    Penyintas: <span className="font-mono font-bold text-slate-900">{selectedModalRecord.victimId || selectedModalRecord.id}</span>
                    {selectedModalRecord.victimName ? ` (${selectedModalRecord.victimName})` : ''} · {selectedModalRecord.location}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalRecord(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto text-xs text-slate-700 leading-relaxed">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">No. Tiket Asesmen</span>
                  <span className="font-mono font-bold text-blue-700">{selectedModalRecord.recordId || `ASM-${selectedModalRecord.id}`}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ID Penyintas / Korban</span>
                  <span className="font-mono font-bold text-slate-800">{selectedModalRecord.victimId || selectedModalRecord.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Risk Score
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    {selectedModalRecord.score} / 5
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Sync Status
                  </span>
                  <span className="text-emerald-700 font-semibold mt-0.5 inline-block">
                    ✓ Synced to Central Hub
                  </span>
                </div>
              </div>

              {selectedModalRecord.transcript && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">
                    Speech Transcript:
                  </span>
                  <p className="italic text-slate-800">"{selectedModalRecord.transcript}"</p>
                </div>
              )}

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">
                  Detected Indicators:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedModalRecord.indicators.length > 0 ? (
                    selectedModalRecord.indicators.map((ind, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs"
                      >
                        ✓ {ind}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No acute risk indicators.</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">
                  Recommended Protocol:
                </span>
                <p className="text-slate-800 leading-normal">
                  {selectedModalRecord.recommendedAction}
                </p>
              </div>

              {selectedModalRecord.volunteerNotes && (
                <div className="text-[11px] text-slate-500 pt-1">
                  <span>Log Notes: {selectedModalRecord.volunteerNotes}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedModalRecord(null)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            RECENT ACTIVITY — ASSESSMENTS REGISTRY
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registry of all psychological triage screenings submitted across response stations.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong className="text-slate-900 font-mono">{filtered.length}</strong> matching records
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search victim ID, post, transcript keywords..."
            className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-900 outline-none shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterLocation}
            onChange={(e) => {
              setFilterLocation(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-300 text-xs text-slate-700 rounded-lg px-2.5 py-2 outline-none"
          >
            <option value="ALL">All Stations</option>
            <option value="Posko A">Posko A</option>
            <option value="Posko B">Posko B</option>
            <option value="Posko C">Posko C</option>
            <option value="Posko D">Posko D</option>
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'GREEN', 'YELLOW', 'RED'] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => {
                  setFilterZone(z);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  filterZone === z
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {z === 'ALL' ? 'All' : z === 'GREEN' ? '🟢' : z === 'YELLOW' ? '🟡' : '🔴'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
            <tr>
              <th className="py-2.5 px-3.5 whitespace-nowrap">No. Record</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Penyintas / Korban</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Tahap / Jenis</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Waktu</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Lokasi</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Metode</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Status Risiko</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Sinkronisasi</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length > 0 ? (
              paginated.map((row, idx) => {
                const rowKey = row.recordId || `${row.id}-${row.phase}-${row.timestamp}-${idx}`;
                const victimId = row.victimId || row.id;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => handleRowClick(row)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3.5 font-mono font-bold text-blue-700 text-[11px] whitespace-nowrap">
                      {row.recordId || `ASM-${row.id}`}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900 text-xs">{victimId}</span>
                        {row.victimName && (
                          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                            {row.victimName} {row.victimAge ? `(${row.victimAge} th)` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderPhaseBadge(row)}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {row.timestamp}
                    </td>
                    <td className="py-2.5 px-3.5 font-medium text-slate-800 whitespace-nowrap">
                      {row.location}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                        {row.method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderZoneBadge(row.zone)}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                        <CheckCircle className="w-3 h-3" />
                        Synced
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  Belum ada riwayat asesmen yang tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
        <div>
          Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white border border-slate-300 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white border border-slate-300 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
