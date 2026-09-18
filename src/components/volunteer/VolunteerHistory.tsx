import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { AssessmentRecord, TriageZone } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';

export const VolunteerHistory: React.FC = () => {
  const { allAssessments } = useAssessment();
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<'ALL' | TriageZone>('ALL');

  const filtered = allAssessments.filter((record) => {
    const matchesSearch =
      record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = zoneFilter === 'ALL' || record.zone === zoneFilter;
    return matchesSearch && matchesZone;
  });

  const getZoneBadge = (zone: TriageZone) => {
    switch (zone) {
      case 'GREEN':
        return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">GREEN</span>;
      case 'YELLOW':
        return <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">YELLOW</span>;
      case 'RED':
        return <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">RED</span>;
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto py-2 animate-in fade-in">
      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID or Posko..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-600 shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Zone Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {(['ALL', 'GREEN', 'YELLOW', 'RED'] as const).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoneFilter(z)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                zoneFilter === z
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {z === 'ALL' ? 'All' : z}
            </button>
          ))}
        </div>
      </div>

      {/* History Records List */}
      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedRecord(item)}
              className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 cursor-pointer transition"
            >
              <div className="min-w-0">
                <span className="font-mono font-bold text-xs text-slate-900 block">
                  {item.id}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {item.location} · {item.timestamp}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {getZoneBadge(item.zone)}
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    item.syncStatus === 'synced'
                      ? 'text-slate-400'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.syncStatus === 'synced' ? 'SYNCED' : 'PENDING'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            No matching assessments.
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="font-mono font-bold text-sm text-slate-900 block">
                  {selectedRecord.id}
                </span>
                <span className="text-xs text-slate-500">
                  {selectedRecord.location} · {selectedRecord.timestamp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Triage Priority</span>
                {getZoneBadge(selectedRecord.zone)}
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Method</span>
                <span className="font-semibold text-slate-800">{selectedRecord.method}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Sync Status</span>
                <span className="font-bold text-slate-800 uppercase">{selectedRecord.syncStatus}</span>
              </div>
              {selectedRecord.indicators.length > 0 && (
                <div className="py-1">
                  <span className="text-slate-500 block mb-1">Indicators</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedRecord.indicators.map((ind, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedRecord.transcript && (
                <div className="py-1">
                  <span className="text-slate-500 block mb-0.5">Transcript</span>
                  <p className="text-slate-700 italic bg-slate-50 p-2 rounded-lg">"{selectedRecord.transcript}"</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
