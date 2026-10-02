import React from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { IconMapPin } from '@tabler/icons-react';
import { AssessmentRecord, TriageTier, T0EmergencyStatus } from '../../types/assessment';

export type QueueFilter = 'ALL' | 'T0' | 'T1' | 'T2' | 'T3';

interface AssessmentQueueProps {
  records: AssessmentRecord[];
  totalCandidateCount: number;
  selectedRecordId: string;
  onSelectRecord: (id: string) => void;
  activeFilter: QueueFilter;
  onFilterChange: (filter: QueueFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  getRecordTier: (record: AssessmentRecord) => TriageTier;
  getRecordT0Status: (record: AssessmentRecord) => T0EmergencyStatus | undefined;
}

export const AssessmentQueue: React.FC<AssessmentQueueProps> = ({
  records,
  totalCandidateCount,
  selectedRecordId,
  onSelectRecord,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  getRecordTier,
  getRecordT0Status,
}) => {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-xs">
      {/* Header with Title and Patient Counter Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Antrean Korban</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Urutkan berdasarkan prioritas dan waktu masuk.
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
          {records.length} Pasien
        </span>
      </div>

      {/* Filter Tabs / Chips: Semua, T0, T1, T2, T3 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => onFilterChange('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          Semua
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('T0')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
            activeFilter === 'T0'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold'
          }`}
        >
          T0
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('T1')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
            activeFilter === 'T1'
              ? 'bg-orange-600 text-white shadow-2xs'
              : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 font-semibold'
          }`}
        >
          T1
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('T2')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
            activeFilter === 'T2'
              ? 'bg-amber-500 text-white shadow-2xs'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-semibold'
          }`}
        >
          T2
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('T3')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
            activeFilter === 'T3'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold'
          }`}
        >
          T3
        </button>
      </div>

      {/* Search Input: Cari nama, ID, atau gejala */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama, ID, atau gejala..."
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-600 transition"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {/* Counter summary text */}
      <div className="text-[11px] text-slate-400 px-0.5 pt-0.5 border-b border-slate-100 pb-2">
        Menampilkan {records.length} dari {totalCandidateCount} pasien
      </div>

      {/* Queue Card List */}
      <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
        {records.length > 0 ? (
          records.map((item) => {
            const tier = getRecordTier(item);
            const t0Stat = getRecordT0Status(item);
            const isSelected = selectedRecordId === item.id;
            const rmId = item.rmCode || item.recordId || item.id;

            // Initial for avatar circle
            const initialLetter = (item.victimName || 'P').trim()[0].toUpperCase();

            // Color scheme based on triage tier
            const avatarBg =
              tier === 'T0'
                ? 'bg-rose-100 text-rose-700 border-rose-300'
                : tier === 'T1'
                ? 'bg-orange-100 text-orange-700 border-orange-300'
                : tier === 'T2'
                ? 'bg-amber-100 text-amber-700 border-amber-300'
                : 'bg-emerald-100 text-emerald-700 border-emerald-300';

            return (
              <div
                key={item.id}
                onClick={() => onSelectRecord(item.id)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer relative ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50/20 shadow-2xs ring-1 ring-blue-300'
                    : 'border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                }`}
              >
                {/* Top Row: Avatar + Name + RM + Triage Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${avatarBg}`}
                    >
                      {initialLetter}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs leading-tight">
                        {item.victimName || 'Penyintas Tanpa Nama'}
                      </h3>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {rmId}
                      </p>
                    </div>
                  </div>

                  {/* Triage Badge */}
                  <div>
                    {tier === 'T0' ? (
                      <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                        <span>●</span>
                        <span>{t0Stat === 'T0-Confirmed' ? 'T0 · CONFIRMED' : 'T0 · SUSPECT'}</span>
                      </span>
                    ) : tier === 'T1' ? (
                      <span className="bg-orange-50 text-orange-800 font-bold text-[9px] px-2 py-0.5 rounded-lg border border-orange-200">
                        ▲ T1 · HIGH RISK
                      </span>
                    ) : tier === 'T2' ? (
                      <span className="bg-amber-50 text-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-lg border border-amber-200">
                        ⚡ T2 · MODERATE RISK
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <span>♥</span>
                        <span>T3 · LOW RISK</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Location & Assessment Time */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pl-9">
                  <div className="flex items-center gap-1">
                    <IconMapPin className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                    <ClockIcon className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </div>
                </div>

                {/* Bottom Row: Clinical Summary / Red Flag Snippet */}
                <div className="mt-1.5 pl-9 flex items-center justify-between">
                  {tier === 'T0' ? (
                    <p className="text-[11px] text-rose-700 font-semibold line-clamp-1">
                      RED FLAG TRIGGERED ({t0Stat || 'T0-SUSPECT'}):{' '}
                      <span className="font-normal text-slate-600">
                        {item.transcript || item.volunteerNotes || 'Kondisi kegawatdaruratan psikiatri/medis di lapangan.'}
                      </span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                      Wawancara SRQ-20 ({item.method || 'VERBAL'}). Skor: {item.score}/20 (Risiko: {item.riskFactorScore ?? 0}, Fungsi: {item.functionalScoreTotal ?? 0}). {item.transcript || item.volunteerNotes || ''}
                    </p>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 ml-1" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-bold text-slate-600">Belum ada assessment</p>
            <p className="text-[11px]">
              Tidak ada pasien di antrean dengan kriteria filter {activeFilter === 'ALL' ? 'ini' : activeFilter}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
