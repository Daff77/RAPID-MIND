import React from 'react';
import { Plus, Mic, ClipboardCheck, ArrowRight, ChevronRight } from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { AssessmentMethod, TriageZone } from '../../types/assessment';

interface VolunteerHomeProps {
  onStartNewAssessment: (method?: AssessmentMethod) => void;
  onViewHistory: () => void;
  onGoToDashboard?: () => void;
}

export const VolunteerHome: React.FC<VolunteerHomeProps> = ({
  onStartNewAssessment,
  onViewHistory,
}) => {
  const { allAssessments } = useAssessment();
  const recentThree = allAssessments.slice(0, 3);

  const getRiskPill = (zone: TriageZone) => {
    switch (zone) {
      case 'GREEN':
        return (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            GREEN
          </span>
        );
      case 'YELLOW':
        return (
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            YELLOW
          </span>
        );
      case 'RED':
        return (
          <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            RED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto py-2">
      {/* 1. Primary Action Section */}
      <section className="text-center sm:text-left space-y-3 pt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Ready for assessment
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Perform rapid initial psychological triage in the field.
          </p>
        </div>

        {/* The ONE obvious primary CTA */}
        <button
          type="button"
          onClick={() => onStartNewAssessment()}
          className="w-full h-12 sm:h-13 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Start Assessment</span>
        </button>
      </section>

      {/* 2. Direct Method Selection */}
      <section className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Or Select Method
        </span>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onStartNewAssessment('VERBAL')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-left transition flex items-center gap-3 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-100 transition-colors">
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                Verbal
              </span>
              <span className="text-[11px] text-slate-500 block truncate">
                Spoken voice
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onStartNewAssessment('CHECKLIST')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-left transition flex items-center gap-3 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                Checklist
              </span>
              <span className="text-[11px] text-slate-500 block truncate">
                Rapid observation
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 3. Recent Assessments */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Recent Assessments
          </span>
          <button
            type="button"
            onClick={onViewHistory}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
          >
            <span>History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
          {recentThree.length > 0 ? (
            recentThree.map((item) => (
              <div
                key={item.id}
                onClick={onViewHistory}
                className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {item.id}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500 truncate">
                    {item.location} · {item.timestamp}
                  </span>
                </div>
                <div className="shrink-0">{getRiskPill(item.zone)}</div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No recent assessments yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
