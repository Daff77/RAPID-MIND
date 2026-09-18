import React from 'react';
import { useAssessment } from '../../context/AssessmentContext';

export const KPICards: React.FC = () => {
  const { kpiStats } = useAssessment();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Total Screenings
        </span>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
          {kpiStats.total}
        </div>
      </div>

      {/* Green */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Green
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {kpiStats.green}
          </span>
          <span className="text-xs font-semibold text-emerald-700">
            {kpiStats.greenPct}%
          </span>
        </div>
      </div>

      {/* Yellow */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            Yellow
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {kpiStats.yellow}
          </span>
          <span className="text-xs font-semibold text-amber-800">
            {kpiStats.yellowPct}%
          </span>
        </div>
      </div>

      {/* Red */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
            Red
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-black text-red-600 font-mono">
            {kpiStats.red}
          </span>
          <span className="text-xs font-bold text-red-600">
            {kpiStats.redPct}%
          </span>
        </div>
      </div>
    </div>
  );
};
