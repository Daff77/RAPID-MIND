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
      record.id.toLowerCase().includes(search.toLowerCase()) ||
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
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-800 shadow-xs">
                  {selectedModalRecord.id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {renderZoneBadge(selectedModalRecord.zone)}
                    <span className="text-xs text-slate-500 font-mono">
                      {selectedModalRecord.timestamp}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-800 mt-0.5">
                    {selectedModalRecord.location} · {selectedModalRecord.method} Assessment
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalRecord(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto text-xs text-slate-700 leading-relaxed">
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
              <th className="py-2.5 px-3.5">Victim ID</th>
              <th className="py-2.5 px-3.5">Time</th>
              <th className="py-2.5 px-3.5">Location</th>
              <th className="py-2.5 px-3.5">Method</th>
              <th className="py-2.5 px-3.5">Risk Status</th>
              <th className="py-2.5 px-3.5">Sync Status</th>
              <th className="py-2.5 px-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length > 0 ? (
              paginated.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  className="hover:bg-slate-50/80 cursor-pointer transition"
                >
                  <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">
                    {row.id}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-500 font-mono">
                    {row.timestamp}
                  </td>
                  <td className="py-2.5 px-3.5 font-medium text-slate-800">
                    {row.location}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-500">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                      {row.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5">
                    {renderZoneBadge(row.zone)}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                      <CheckCircle className="w-3 h-3" />
                      Synced
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(row);
                      }}
                      className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No assessments found matching the search criteria.
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
