import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { AssessmentRecord } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';

export const PriorityRedPanel: React.FC = () => {
  const { centralAssessments } = useAssessment();
  const [selected, setSelected] = useState<AssessmentRecord | null>(null);

  const redRecords = centralAssessments.filter((r) => r.zone === 'RED').slice(0, 3);

  if (redRecords.length === 0) return null;

  return (
    <div className="bg-white border border-red-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-red-700 text-xs sm:text-sm">
          <ShieldAlert className="w-4 h-4" />
          <span>Priority Red Attention ({redRecords.length})</span>
        </div>
        <span className="text-[11px] text-slate-400">Immediate action</span>
      </div>

      <div className="divide-y divide-slate-100">
        {redRecords.map((r) => (
          <div
            key={r.id}
            onClick={() => setSelected(r)}
            className="py-2.5 flex items-center justify-between gap-3 hover:bg-red-50/30 px-2 rounded-lg cursor-pointer transition text-xs"
          >
            <div className="min-w-0">
              <span className="font-mono font-bold text-slate-900 mr-2">{r.id}</span>
              <span className="text-slate-500">{r.location} · {r.timestamp}</span>
              {r.indicators.length > 0 && (
                <span className="text-red-700 font-medium block truncate mt-0.5">
                  {r.indicators.slice(0, 2).join(', ')}
                </span>
              )}
            </div>
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-[11px] shrink-0"
            >
              Review
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <span className="font-mono font-bold text-slate-900">{selected.id}</span>
                <span className="text-xs text-slate-500 block">{selected.location} · {selected.timestamp}</span>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-red-700 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">
                {selected.recommendedAction}
              </p>
              {selected.transcript && (
                <p className="text-slate-700 italic bg-slate-50 p-2 rounded-lg">"{selected.transcript}"</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full h-9 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
