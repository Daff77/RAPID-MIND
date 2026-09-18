import React from 'react';
import { Play, Sparkles, RefreshCw, X } from 'lucide-react';
import { DEMO_SCENARIOS, DemoScenario } from '../../data/demoScenarios';
import { useAssessment } from '../../context/AssessmentContext';

interface DemoPresetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioActivated: (scenario: DemoScenario) => void;
}

export const DemoPresetsPanel: React.FC<DemoPresetsPanelProps> = ({
  isOpen,
  onClose,
  onScenarioActivated,
}) => {
  const { applyDemoScenario, resetDemoData } = useAssessment();

  if (!isOpen) return null;

  const handleLaunch = (scenario: DemoScenario) => {
    applyDemoScenario(scenario);
    onScenarioActivated(scenario);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Demo Walkthrough Scenarios</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto text-xs">
          <p className="text-slate-500 leading-relaxed">
            Select a verified field screening scenario below to instantly populate the assessment workflow.
          </p>

          <div className="space-y-2.5">
            {DEMO_SCENARIOS.map((sc) => {
              const isGreen = sc.expectedZone === 'GREEN';
              const isYellow = sc.expectedZone === 'YELLOW';

              return (
                <div
                  key={sc.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 transition flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            isGreen
                              ? 'bg-emerald-100 text-emerald-800'
                              : isYellow
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {sc.expectedZone}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {sc.victimId} · {sc.defaultLocation}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{sc.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">{sc.subtitle}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLaunch(sc)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Launch</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Reset central database to benchmark</span>
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                onClose();
              }}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              <span>Reset 248 records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
