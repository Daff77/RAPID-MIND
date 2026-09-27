import React from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { ShieldAlert, AlertTriangle, Activity, CheckCircle } from 'lucide-react';

export const KPICards: React.FC = () => {
  const { centralAssessments, kpiStats } = useAssessment();

  const t0Count = centralAssessments.filter(
    (r) => r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)
  ).length;

  const t1Count = centralAssessments.filter(
    (r) => r.triageTier === 'T1' || (r.zone === 'RED' && !r.criticalTriggered)
  ).length;

  const t2Count = centralAssessments.filter(
    (r) => r.triageTier === 'T2' || r.zone === 'YELLOW'
  ).length;

  const t3Count = centralAssessments.filter(
    (r) => r.triageTier === 'T3' || r.zone === 'GREEN'
  ).length;

  const total = centralAssessments.length || 1;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* T0 Emergency */}
      <div className="bg-white border-2 border-red-500 rounded-2xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-[11px] font-extrabold text-red-700 uppercase tracking-wider">
              T0 · Emergency
            </span>
          </div>
          <ShieldAlert className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-black text-red-600 font-mono">
            {t0Count}
          </span>
          <span className="text-xs font-bold text-red-600">
            {Math.round((t0Count / total) * 100)}%
          </span>
        </div>
        <span className="text-[10px] text-red-800 font-medium block">
          Peringatan Rujukan PSC 119
        </span>
      </div>

      {/* T1 High Risk */}
      <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
              T1 · High Risk
            </span>
          </div>
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {t1Count}
          </span>
          <span className="text-xs font-semibold text-red-700">
            {Math.round((t1Count / total) * 100)}%
          </span>
        </div>
        <span className="text-[10px] text-slate-500 block">
          SRQ-20 ≥ 11 (Psikolog/Sp.KJ)
        </span>
      </div>

      {/* T2 Moderate Risk */}
      <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              T2 · Moderate
            </span>
          </div>
          <Activity className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {t2Count}
          </span>
          <span className="text-xs font-semibold text-amber-800">
            {Math.round((t2Count / total) * 100)}%
          </span>
        </div>
        <span className="text-[10px] text-slate-500 block">
          SRQ-20 6–10 (Pendamping PFA)
        </span>
      </div>

      {/* T3 Low Risk / Total */}
      <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              T3 · Low Risk
            </span>
          </div>
          <CheckCircle className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {t3Count}
          </span>
          <span className="text-xs font-semibold text-emerald-700">
            {Math.round((t3Count / total) * 100)}%
          </span>
        </div>
        <span className="text-[10px] text-slate-500 block">
          Total: {centralAssessments.length} Penyintas
        </span>
      </div>
    </div>
  );
};
