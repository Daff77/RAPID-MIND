import React from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';
import {
  IconUsers,
  IconAlertTriangle,
  IconShieldExclamation,
  IconActivityHeartbeat,
  IconCircleCheck,
  IconStethoscope,
  IconArrowUpRight,
  IconArrowDownRight,
  IconMinus,
} from '@tabler/icons-react';

export const KPICards: React.FC = () => {
  const { centralAssessments, kpiStats } = useAssessment();
  const { allUsers } = useAuth();

  const totalSurvivors = kpiStats?.total || 9;
  const totalAssessments = kpiStats?.totalAssessments || centralAssessments.length || 21;
  const t0Count = kpiStats?.t0Count !== undefined ? kpiStats.t0Count : 1;
  const t1Count = kpiStats?.t1Count !== undefined ? kpiStats.t1Count : 0;
  const t2Count = kpiStats?.t2Count !== undefined ? kpiStats.t2Count : 4;
  const t3Count = kpiStats?.t3Count !== undefined ? kpiStats.t3Count : 4;
  const total = totalSurvivors || 1;
  const activeVolunteersCount = allUsers?.filter((u) => u.role === 'volunteer').length || 1;

  const t0Pct = Math.round((t0Count / total) * 100);
  const t1Pct = Math.round((t1Count / total) * 100);
  const t2Pct = Math.round((t2Count / total) * 100);
  const t3Pct = Math.round((t3Count / total) * 100);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. Total Penyintas */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Penyintas
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <IconUsers className="w-4 h-4" stroke={1.8} />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {totalSurvivors}
            </span>
            <span className="text-xs font-semibold text-slate-400">jiwa</span>
          </div>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <IconArrowUpRight className="w-3 h-3" />
            +12% <span className="hidden xl:inline font-normal text-slate-500">kemarin</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-slate-100">
          <strong className="text-slate-700 font-semibold">{totalAssessments}</strong> rekam skrining aktif
        </div>
      </div>

      {/* 2. T0 — Emergency */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-600" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
              T0 — Emergency
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <IconShieldExclamation className="w-4 h-4" stroke={1.8} />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-red-600 font-mono tracking-tight">
              {t0Count}
            </span>
            <span className="text-xs font-bold text-red-600 font-mono">
              ({t0Pct}%)
            </span>
          </div>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
            <IconArrowUpRight className="w-3 h-3 text-red-600" />
            +1 <span className="hidden xl:inline font-normal text-slate-500">hari ini</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-600 font-medium truncate pt-1 border-t border-slate-100">
          Siaga PSC 119 & IGD Jiwa
        </div>
      </div>

      {/* 3. T1 — High Risk */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">
              T1 — High Risk
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <IconAlertTriangle className="w-4 h-4" stroke={1.8} />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {t1Count}
            </span>
            <span className="text-xs font-semibold text-orange-700 font-mono">
              ({t1Pct}%)
            </span>
          </div>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
            <IconMinus className="w-3 h-3 text-slate-400" />
            sama
          </span>
        </div>

        <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-slate-100">
          SRQ ≥ 15 · Rujuk Sp.KJ
        </div>
      </div>

      {/* 4. T2 — Moderate */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              T2 — Moderate
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <IconActivityHeartbeat className="w-4 h-4" stroke={1.8} />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {t2Count}
            </span>
            <span className="text-xs font-semibold text-amber-800 font-mono">
              ({t2Pct}%)
            </span>
          </div>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <IconArrowDownRight className="w-3 h-3" />
            -2 <span className="hidden xl:inline font-normal text-slate-500">kemarin</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-slate-100">
          SRQ 7–14 · Pendampingan PFA
        </div>
      </div>

      {/* 5. T3 — Low Risk */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              T3 — Low Risk
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IconCircleCheck className="w-4 h-4" stroke={1.8} />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {t3Count}
            </span>
            <span className="text-xs font-semibold text-emerald-700 font-mono">
              ({t3Pct}%)
            </span>
          </div>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <IconArrowUpRight className="w-3 h-3" />
            +1 <span className="hidden xl:inline font-normal text-slate-500">kemarin</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-slate-100">
          SRQ 0–6 · Komunitas/Stabil
        </div>
      </div>
    </div>
  );
};
