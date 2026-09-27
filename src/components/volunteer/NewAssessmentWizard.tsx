import React, { useState, useEffect } from 'react';
import {
  Mic,
  ClipboardCheck,
  ArrowLeft,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  AssessmentMethod,
  LocationPost,
  TriageAnalysisResult,
  VictimData,
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

export function getCategoryFromAge(ageVal: string | number): 'Anak' | 'Remaja' | 'Dewasa' | 'Lansia' {
  const num = typeof ageVal === 'number' ? ageVal : parseInt(ageVal, 10);
  if (isNaN(num) || num < 0) return 'Dewasa';
  if (num < 12) return 'Anak';
  if (num <= 18) return 'Remaja';
  if (num < 60) return 'Dewasa';
  return 'Lansia';
}

export const NewAssessmentWizard: React.FC<NewAssessmentWizardProps> = ({
  initialMethod = 'VERBAL',
  onAssessmentSaved,
  onCancel,
}) => {
  const { allAssessments, activeScenario, clearDemoScenario } = useAssessment();

  const nextIdDefault = `VCT-${String(allAssessments.length + 1).padStart(3, '0')}`;

  const [step, setStep] = useState<'context' | 'assessment' | 'result'>('context');

  // Enhanced Victim Data fields (Requirement 4)
  const [victimId, setVictimId] = useState<string>(nextIdDefault);
  const [victimName, setVictimName] = useState<string>('Siti Rahayu');
  const [victimAge, setVictimAge] = useState<string>('34');
  const [victimGender, setVictimGender] = useState<'L' | 'P'>('P');
  const [victimCategory, setVictimCategory] = useState<'Anak' | 'Remaja' | 'Dewasa' | 'Lansia'>('Dewasa');
  const [initialCondition, setInitialCondition] = useState<string>('Mengeluh pusing dan tampak cemas');

  const handleAgeChange = (val: string) => {
    setVictimAge(val);
    setVictimCategory(getCategoryFromAge(val));
  };

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
      if (activeScenario.title) {
        setVictimName(activeScenario.title.split('—')[0]?.trim() || 'Korban Kasus Demo');
      }
      setStep('context');
    }
  }, [activeScenario]);

  // Is victim data available & valid for STT?
  const isVictimDataAvailable = Boolean(victimId.trim() && victimName.trim());

  const currentVictimData: VictimData = {
    id: victimId.trim(),
    name: victimName.trim(),
    age: victimAge ? parseInt(victimAge) || victimAge : undefined,
    gender: victimGender,
    category: victimCategory,
    initialCondition: initialCondition.trim() || undefined,
    isAvailable: isVictimDataAvailable,
  };

  const handlePopulateDemoVictim = () => {
    setVictimId(`VCT-${String(Math.floor(Math.random() * 800) + 200).padStart(3, '0')}`);
    setVictimName('Ibu Ratna Wulandari');
    setVictimAge('38');
    setVictimGender('P');
    setVictimCategory(getCategoryFromAge(38));
    setInitialCondition('Tampak gemetar, mengeluh pusing dan sesak napas');
    setLocation('Posko A');
  };

  const handleStartAssessment = () => {
    if (!victimId.trim() || !victimName.trim()) return;
    setStep('assessment');
  };

  const handleAnalysisComplete = (
    result: TriageAnalysisResult,
    inputTranscriptOrItems: string | string[],
    checklistSelections?: string[]
  ) => {
    setAnalysisResult(result);
    if (typeof inputTranscriptOrItems === 'string') {
      setTranscriptUsed(inputTranscriptOrItems);
      setChecklistUsed(checklistSelections);
    } else {
      setChecklistUsed(inputTranscriptOrItems);
    }
    setStep('result');
  };

  const handleReset = () => {
    clearDemoScenario();
    setStep('context');
    setVictimId(`VCT-${String(allAssessments.length + 2).padStart(3, '0')}`);
    setVictimName('');
    setAnalysisResult(null);
    setTranscriptUsed(undefined);
    setChecklistUsed(undefined);
    setIsPFAModalOpen(false);
    if (onAssessmentSaved) onAssessmentSaved();
  };

  const posts: LocationPost[] = ['Posko A', 'Posko B', 'Posko C', 'Posko D'];

  return (
    <div className="max-w-lg mx-auto py-2 space-y-4 font-sans">
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

      {/* Subtle Step Indicator: Data Korban → Asesmen STT → Hasil */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-1.5 font-medium">
          {onCancel && step === 'context' && (
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-900 p-1 -ml-1 rounded transition"
              title="Kembali"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <span className={step === 'context' ? 'font-bold text-blue-600' : ''}>
            1. Data Korban
          </span>
          <span>→</span>
          <span className={step === 'assessment' ? 'font-bold text-blue-600' : ''}>
            2. Asesmen {method === 'VERBAL' ? 'STT' : 'Checklist'}
          </span>
          <span>→</span>
          <span className={step === 'result' ? 'font-bold text-blue-600' : ''}>
            3. Hasil Triase
          </span>
        </div>
      </div>

      {/* STEP 1: DATA KORBAN & KONFIGURASI (Requirement 4: Data Korban Tersedia) */}
      {step === 'context' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Pendaftaran & Data Korban
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan data korban tersedia sebelum memulai perekaman suara STT.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePopulateDemoVictim}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition flex items-center gap-1 shrink-0"
              title="Isi otomatis dengan data korban demo"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Contoh Korban</span>
            </button>
          </div>

          {/* 1. Status Ketersediaan Data Korban (Requirement 4 Indicator) */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              isVictimDataAvailable
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isVictimDataAvailable ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block">
                  {isVictimDataAvailable
                    ? 'Status: Data Korban Tersedia'
                    : 'Status: Data Korban Belum Lengkap'}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {isVictimDataAvailable
                    ? 'Fitur STT (Speech-to-Text) siap digunakan untuk korban ini.'
                    : 'Fitur STT baru dapat digunakan setelah nama dan data korban diisi.'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Victim ID & Nama Korban */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  ID Korban *
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setVictimId(`VCT-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`)
                  }
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Acak ID
                </button>
              </div>
              <input
                type="text"
                value={victimId}
                onChange={(e) => setVictimId(e.target.value)}
                placeholder="VCT-001"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono text-slate-900 outline-none transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Nama Lengkap / Inisial Korban *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={victimName}
                  onChange={(e) => setVictimName(e.target.value)}
                  placeholder="Contoh: Siti Rahayu"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition"
                  required
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 3. Usia, Kategori, & Jenis Kelamin */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Usia (Tahun)
              </label>
              <input
                type="number"
                value={victimAge}
                onChange={(e) => handleAgeChange(e.target.value)}
                placeholder="34"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">
                  Kelompok
                </label>
                <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  Otomatis
                </span>
              </div>
              <input
                type="text"
                readOnly
                value={
                  victimCategory === 'Anak' ? 'Anak (<12 th)' :
                  victimCategory === 'Remaja' ? 'Remaja (12-18 th)' :
                  victimCategory === 'Dewasa' ? 'Dewasa (19-59 th)' :
                  'Lansia (60+ th)'
                }
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none cursor-default select-none transition"
                title="Kelompok otomatis ditentukan berdasarkan input usia"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Jenis Kelamin
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setVictimGender('L')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    victimGender === 'L'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  L
                </button>
                <button
                  type="button"
                  onClick={() => setVictimGender('P')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    victimGender === 'P'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  P
                </button>
              </div>
            </div>
          </div>

          {/* 4. Lokasi Posko Lapangan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Posko Pengungsian / Skrining
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {posts.map((p) => {
                const isSelected = location === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLocation(p)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition ${
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

          {/* 5. Metode Asesmen */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Metode Asesmen Psikologis
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
                    Verbal (STT + Checklist)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Perekaman suara & observasi
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
                    Checklist Saja
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Observasi cepat tanda gejala
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleStartAssessment}
            disabled={!isVictimDataAvailable}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <span>Lanjutkan ke Asesmen {method === 'VERBAL' ? 'STT' : 'Checklist'}</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* STEP 2: ASSESSMENT SCREEN (STT with integrated Checklist or Quick Checklist) */}
      {step === 'assessment' && (
        <>
          {method === 'VERBAL' ? (
            <VerbalAssessment
              victimId={victimId}
              location={location}
              victimData={currentVictimData}
              isVictimDataAvailable={isVictimDataAvailable}
              initialTranscript={transcriptUsed}
              initialChecklist={checklistUsed}
              onAnalysisComplete={(res, tr, chk) => handleAnalysisComplete(res, tr, chk)}
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
          victimData={currentVictimData}
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
