import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface PFAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteAssessment?: () => void;
  victimId?: string;
  location?: string;
}

export const PFAModal: React.FC<PFAModalProps> = ({
  isOpen,
  onClose,
  onCompleteAssessment,
}) => {
  if (!isOpen) return null;

  const steps = [
    { num: '01', title: 'Ensure safety', desc: 'Protect from immediate hazards or chaotic crowds.' },
    { num: '02', title: 'Approach calmly', desc: 'Introduce yourself with respect and patience.' },
    { num: '03', title: 'Listen', desc: 'Listen without pressuring survivor to talk.' },
    { num: '04', title: 'Help with immediate needs', desc: 'Provide water, shelter, and comfort.' },
    { num: '05', title: 'Connect to support', desc: 'Link to family tracing or medical station.' },
  ];

  const handleDone = () => {
    if (onCompleteAssessment) {
      onCompleteAssessment();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900">
              PFA Protocol Guidance
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5 Clean Steps */}
        <div className="p-4 space-y-2.5 overflow-y-auto">
          {steps.map((s) => (
            <div key={s.num} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50">
              <span className="font-mono text-xs font-black text-slate-400 shrink-0 mt-0.5">
                {s.num}
              </span>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {s.title}
                </span>
                <span className="text-[11px] text-slate-600 block leading-snug">
                  {s.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Single Primary Action: Done */}
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={handleDone}
            className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
