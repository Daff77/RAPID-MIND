import React from 'react';
import { ShieldExclamationIcon } from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';
import { IconBolt, IconUsers } from '@tabler/icons-react';

interface DashboardMetricsProps {
  totalKorban: number;
  activeAssessments: number;
  zonaMerahCount: number;
  avgTime?: string;
  onFilterAll?: () => void;
  onFilterT0?: () => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  totalKorban = 15,
  activeAssessments = 2,
  zonaMerahCount = 2,
  avgTime = '3:24',
  onFilterAll,
  onFilterT0,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Korban */}
      <div
        onClick={onFilterAll}
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
              <span className="text-2xl font-black text-slate-900">{totalKorban}</span>
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
              <span className="text-2xl font-black text-slate-900">{activeAssessments}</span>
              <span className="text-xs text-slate-400 font-medium">assessment</span>
            </div>
          </div>
        </div>
        <span className="text-xs text-slate-400 font-semibold">—</span>
      </div>

      {/* 3. Zona Merah */}
      <div
        onClick={onFilterT0}
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
              <span className="text-2xl font-black text-slate-900">{zonaMerahCount}</span>
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
              <span className="text-2xl font-black text-slate-900">{avgTime}</span>
              <span className="text-xs text-slate-400 font-medium">menit</span>
            </div>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
          -20%
        </span>
      </div>
    </div>
  );
};
