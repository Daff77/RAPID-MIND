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
        return (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            T3 / STABLE
          </span>
        );
      case 'YELLOW':
        return (
          <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            T2 / WARNING
          </span>
        );
      case 'RED':
        return (
          <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
            T1 / EMERGENCY
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto py-2 animate-in fade-in">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Riwayat Skrining</h2>
          <p className="text-xs text-slate-500">Daftar pemeriksaan lapangan dan status sinkronisasi</p>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {filtered.length} Rekam
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID Pasien atau Posko..."
            className="w-full pl-9 pr-3 min-h-[44px] bg-white border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
        </div>

        {/* Zone Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-xs">
          {(['ALL', 'GREEN', 'YELLOW', 'RED'] as const).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoneFilter(z)}
              className={`min-h-[36px] px-3 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                zoneFilter === z
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {z === 'ALL' ? 'Semua Status' : z === 'GREEN' ? 'T3 Stabil' : z === 'YELLOW' ? 'T2 Sedang' : 'T1/T0 Darurat'}
            </button>
          ))}
        </div>
      </div>

      {/* History Records List: Compact rows with dividers instead of wrapped card */}
      <div className="divide-y divide-slate-100 border-t border-b border-slate-200">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedRecord(item)}
              className="py-3 px-1.5 flex items-center justify-between gap-3 hover:bg-slate-50/90 active:bg-slate-100 cursor-pointer transition rounded-md"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                    {item.id}
                  </span>
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {item.location}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>{item.timestamp}</span>
                  <span>·</span>
                  <span className="capitalize">{item.method}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {getZoneBadge(item.zone)}
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    item.syncStatus === 'synced'
                      ? 'text-slate-400 bg-slate-50 border border-slate-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  {item.syncStatus === 'synced' ? 'Tersinkron' : 'Pending'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-xs text-slate-400">
            Tidak ada riwayat penapisan yang cocok.
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl overflow-hidden p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-base text-slate-900 block">
                  {selectedRecord.id}
                </span>
                <span className="text-xs text-slate-500">
                  {selectedRecord.location} · {selectedRecord.timestamp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Tutup detail rekam medis"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Prioritas Triase</span>
                {getZoneBadge(selectedRecord.zone)}
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Metode</span>
                <span className="font-semibold text-slate-800">{selectedRecord.method}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Status Sinkronisasi</span>
                <span className="font-bold text-slate-800 uppercase">{selectedRecord.syncStatus}</span>
              </div>
              {selectedRecord.indicators.length > 0 && (
                <div className="py-1.5">
                  <span className="text-slate-500 block mb-1">Indikator Terdeteksi</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedRecord.indicators.map((ind, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedRecord.transcript && (
                <div className="py-1.5">
                  <span className="text-slate-500 block mb-1">Transkrip Percakapan</span>
                  <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    "{selectedRecord.transcript}"
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="w-full min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

