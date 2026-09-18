import React, { useState, useEffect } from 'react';
import { Mic, ClipboardCheck, ArrowLeft } from 'lucide-react';
import {
  AssessmentMethod,
  LocationPost,
  TriageAnalysisResult,
} from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';
import { VerbalAssessment } from './VerbalAssessment';
import { QuickChecklist } from './QuickChecklist';
import { TriageResultCard } from './TriageResultCard';
import { PFAModal } from './PFAModal';

interface NewAssessmentWizardProps {
  initialMethod?: AssessmentMethod;
  onAssessmentSaved?: () => void;
  onCancel?: () => void;
}

export const NewAssessmentWizard: React.FC<NewAssessmentWizardProps> = ({
  initialMethod = 'VERBAL',
  onAssessmentSaved,
  onCancel,
}) => {
  const { allAssessments, activeScenario, clearDemoScenario } = useAssessment();

  const nextIdDefault = `VCT-${String(allAssessments.length + 1).padStart(3, '0')}`;

  const [step, setStep] = useState<'context' | 'assessment' | 'result'>('context');
  const [victimId, setVictimId] = useState<string>(nextIdDefault);
  const [location, setLocation] = useState<LocationPost>('Posko A');
  const [method, setMethod] = useState<AssessmentMethod>(initialMethod);
  const [analysisResult, setAnalysisResult] = useState<TriageAnalysisResult | null>(null);
  const [transcriptUsed, setTranscriptUsed] = useState<string | undefined>();
  const [checklistUsed, setChecklistUsed] = useState<string[] | undefined>();
  const [isPFAModalOpen, setIsPFAModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (activeScenario) {
      setVictimId(activeScenario.victimId || nextIdDefault);
      setLocation(activeScenario.defaultLocation || 'Posko A');
      setMethod(activeScenario.method);
      setTranscriptUsed(activeScenario.transcript);
      setChecklistUsed(activeScenario.checklistIds);
      setStep('context');
    }
  }, [activeScenario]);

  const handleStartAssessment = () => {
    if (!victimId.trim()) return;
    setStep('assessment');
  };

  const handleAnalysisComplete = (
    result: TriageAnalysisResult,
    inputData: string | string[]
  ) => {
    setAnalysisResult(result);
    if (typeof inputData === 'string') {
      setTranscriptUsed(inputData);
    } else {
      setChecklistUsed(inputData);
    }
    setStep('result');
  };

  const handleReset = () => {
    clearDemoScenario();
    setStep('context');
    setVictimId(`VCT-${String(allAssessments.length + 2).padStart(3, '0')}`);
    setAnalysisResult(null);
    setTranscriptUsed(undefined);
    setChecklistUsed(undefined);
    setIsPFAModalOpen(false);
    if (onAssessmentSaved) onAssessmentSaved();
  };

  const posts: LocationPost[] = ['Posko A', 'Posko B', 'Posko C', 'Posko D'];

  return (
    <div className="max-w-lg mx-auto py-2 space-y-4">
      {/* PFA Guidance Modal */}
      <PFAModal
        isOpen={isPFAModalOpen}
        onClose={() => setIsPFAModalOpen(false)}
        victimId={victimId}
        location={location}
        onCompleteAssessment={() => {
          setIsPFAModalOpen(false);
          setStep('result');
        }}
      />

      {/* Subtle Step Indicator: Context → Assessment → Result */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-1.5 font-medium">
          {onCancel && step === 'context' && (
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-900 p-1 -ml-1 rounded transition"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <span className={step === 'context' ? 'font-bold text-blue-600' : ''}>
            Context
          </span>
          <span>→</span>
          <span className={step === 'assessment' ? 'font-bold text-blue-600' : ''}>
            Assessment
          </span>
          <span>→</span>
          <span className={step === 'result' ? 'font-bold text-blue-600' : ''}>
            Result
          </span>
        </div>
      </div>

      {/* STEP 1: CONTEXT CONFIGURATION */}
      {step === 'context' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-2xs animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              New Assessment
            </h2>
          </div>

          {/* 1. Victim ID */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Victim ID
              </label>
              <button
                type="button"
                onClick={() =>
                  setVictimId(`VCT-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`)
                }
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                Generate
              </button>
            </div>
            <input
              type="text"
              value={victimId}
              onChange={(e) => setVictimId(e.target.value)}
              placeholder="VCT-001"
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 outline-none transition"
            />
            <p className="text-[11px] text-slate-400">Use a synthetic ID.</p>
          </div>

          {/* 2. Location Post */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Location
            </label>
            <div className="grid grid-cols-2 gap-2">
              {posts.map((p) => {
                const isSelected = location === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLocation(p)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Assessment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('VERBAL')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  method === 'VERBAL'
                    ? 'bg-blue-50 border-blue-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Mic className={`w-4 h-4 mt-0.5 shrink-0 ${method === 'VERBAL' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <span className={`text-xs font-bold block ${method === 'VERBAL' ? 'text-blue-700' : 'text-slate-800'}`}>
                    Verbal
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Spoken response
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CHECKLIST')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  method === 'CHECKLIST'
                    ? 'bg-blue-50 border-blue-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ClipboardCheck className={`w-4 h-4 mt-0.5 shrink-0 ${method === 'CHECKLIST' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <span className={`text-xs font-bold block ${method === 'CHECKLIST' ? 'text-blue-700' : 'text-slate-800'}`}>
                    Checklist
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Rapid observation
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Single Primary Action: Continue */}
          <button
            type="button"
            onClick={handleStartAssessment}
            disabled={!victimId.trim()}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <span>Continue</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* STEP 2: ASSESSMENT SCREEN */}
      {step === 'assessment' && (
        <>
          {method === 'VERBAL' ? (
            <VerbalAssessment
              victimId={victimId}
              location={location}
              initialTranscript={transcriptUsed}
              onAnalysisComplete={(res, tr) => handleAnalysisComplete(res, tr)}
              onBack={() => setStep('context')}
            />
          ) : (
            <QuickChecklist
              victimId={victimId}
              location={location}
              initialSelections={checklistUsed}
              onAnalysisComplete={(res, sel) => handleAnalysisComplete(res, sel)}
              onOpenPFA={() => setIsPFAModalOpen(true)}
              onBack={() => setStep('context')}
            />
          )}
        </>
      )}

      {/* STEP 3: RESULT SCREEN */}
      {step === 'result' && analysisResult && (
        <TriageResultCard
          victimId={victimId}
          location={location}
          method={method}
          analysis={analysisResult}
          transcript={transcriptUsed}
          checklistSelections={checklistUsed}
          onOpenPFA={() => setIsPFAModalOpen(true)}
          onReset={handleReset}
        />
      )}
    </div>
  );
};
