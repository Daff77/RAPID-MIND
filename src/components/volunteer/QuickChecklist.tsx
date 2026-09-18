import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Check,
} from 'lucide-react';
import { LocationPost, TriageAnalysisResult } from '../../types/assessment';
import { analyzeChecklist } from '../../services/triageEngine';

interface QuickChecklistProps {
  victimId: string;
  location: LocationPost;
  initialSelections?: string[];
  onAnalysisComplete: (result: TriageAnalysisResult, selectedIds: string[]) => void;
  onOpenPFA: () => void;
  onBack: () => void;
}

interface ChecklistCategory {
  title: string;
  items: {
    id: string;
    label: string;
    isCritical?: boolean;
  }[];
}

export const QuickChecklist: React.FC<QuickChecklistProps> = ({
  victimId,
  location,
  initialSelections = [],
  onAnalysisComplete,
  onOpenPFA,
  onBack,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelections);

  const categories: ChecklistCategory[] = [
    {
      title: 'EMOTIONAL',
      items: [
        { id: 'emo_crying', label: 'Persistent crying' },
        { id: 'emo_anxiety', label: 'Severe anxiety / panic' },
        { id: 'emo_agitation', label: 'Extreme agitation' },
      ],
    },
    {
      title: 'COGNITIVE',
      items: [
        { id: 'cog_confusion', label: 'Confusion / disorientation' },
        { id: 'cog_unresponsive', label: 'Unresponsive', isCritical: true },
        { id: 'cog_loss_control', label: 'Loss of control', isCritical: true },
      ],
    },
    {
      title: 'SAFETY',
      items: [
        { id: 'safe_harm_self', label: 'Risk of harm to self', isCritical: true },
        { id: 'safe_harm_others', label: 'Risk of harm to others', isCritical: true },
      ],
    },
  ];

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    const analysis = analyzeChecklist(selectedIds);
    onAnalysisComplete(analysis, selectedIds);
  };

  const hasCriticalSelected = selectedIds.some((id) =>
    ['cog_unresponsive', 'cog_loss_control', 'safe_harm_self', 'safe_harm_others'].includes(id)
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
      {/* Context Bar */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900">{victimId}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 font-medium">{location}</span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {selectedIds.length} selected
        </span>
      </div>

      {/* Critical Red Warning Banner */}
      {hasCriticalSelected && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-red-700">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>RED ZONE: Immediate attention required</span>
          </div>
          <button
            type="button"
            onClick={onOpenPFA}
            className="px-2.5 py-1 rounded bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition shrink-0"
          >
            PFA Guidance
          </button>
        </div>
      )}

      {/* Checklist Sections */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.title} className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {cat.title}
            </span>
            <div className="space-y-1">
              {cat.items.map((item) => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                      isChecked
                        ? item.isCritical
                          ? 'bg-red-50/70 border-red-300 text-red-950 font-semibold'
                          : 'bg-blue-50/70 border-blue-300 text-blue-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs">{item.label}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked
                          ? item.isCritical
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleComplete}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition"
        >
          <span>Complete Assessment</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
