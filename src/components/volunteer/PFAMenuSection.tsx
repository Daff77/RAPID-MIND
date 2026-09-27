import React, { useState } from 'react';
import {
  Eye,
  Ear,
  Link2,
  CheckCircle,
  Save,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Wind,
  Check,
  Sparkles,
} from 'lucide-react';
import { LocationPost, SurvivorProfile } from '../../types/assessment';
import {
  PFA_LOOK_ITEMS,
  PFA_LISTEN_GUIDELINES,
  PFA_LINK_ITEMS,
} from '../../data/pfaProtocol';
import { useAssessment } from '../../context/AssessmentContext';
import { saveSurvivorToRegistry } from '../../data/mockSurvivors';

interface PFAMenuSectionProps {
  survivor: SurvivorProfile;
  onComplete: (updatedSurvivor: SurvivorProfile) => void;
  onProceedToSRQ20?: (updatedSurvivor: SurvivorProfile) => void;
  onBack: () => void;
}

export const PFAMenuSection: React.FC<PFAMenuSectionProps> = ({
  survivor,
  onComplete,
  onProceedToSRQ20,
  onBack,
}) => {
  const { addAssessment } = useAssessment();

  const [activeStep, setActiveStep] = useState<'look' | 'listen' | 'link' | 'summary'>('look');
  const [selectedLook, setSelectedLook] = useState<string[]>(
    survivor.pfaRecord?.lookItems || []
  );
  const [listenNotes, setListenNotes] = useState<string>(
    survivor.pfaRecord?.listenNotes || ''
  );
  const [groundingUsed, setGroundingUsed] = useState<boolean>(
    survivor.pfaRecord?.groundingUsed || false
  );
  const [selectedLink, setSelectedLink] = useState<string[]>(
    survivor.pfaRecord?.linkItems || []
  );
  const [isSaved, setIsSaved] = useState(false);

  const toggleLook = (label: string) => {
    setSelectedLook((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const toggleLink = (label: string) => {
    setSelectedLink((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const handleFinishPFA = (andProceedToSRQ: boolean = false) => {
    const now = new Date();
    const timeHours = String(now.getHours()).padStart(2, '0');
    const timeMins = String(now.getMinutes()).padStart(2, '0');

    const updatedProfile: SurvivorProfile = {
      ...survivor,
      currentPhase: 'followup_srq20',
      pfaRecord: {
        completedAt: `${timeHours}:${timeMins} (Fase Akut Hari 1-3)`,
        lookItems: selectedLook,
        listenNotes: listenNotes.trim(),
        groundingUsed,
        linkItems: selectedLink,
      },
    };

    // Save survivor to persistent registry
    saveSurvivorToRegistry(updatedProfile);

    // Save as assessment record
    addAssessment({
      id: survivor.id,
      victimId: survivor.id,
      nik: survivor.nik,
      timestamp: `${timeHours}:${timeMins}`,
      location: survivor.posko,
      method: 'CHECKLIST',
      phase: 'acute_pfa',
      zone: selectedLook.some((i) => i.includes('Distres') || i.includes('Cedera')) ? 'YELLOW' : 'GREEN',
      triageTier: 'T3',
      score: selectedLook.length,
      indicators: [...selectedLook, ...selectedLink],
      criticalTriggered: false,
      recommendedAction:
        'Intervensi PFA Look-Listen-Link selesai. Pantau kestabilan emosi dan jadwalkan Wawancara SRQ-20 pada Fase Lanjutan (Hari 4-30).',
      volunteerNotes: `PFA Look-Listen-Link selesai di ${survivor.posko}. Catatan: ${listenNotes || '-'}`,
      victimName: survivor.name,
      victimAge: survivor.age,
      victimGender: survivor.gender,
      victimCategory: survivor.category,
    });

    setIsSaved(true);

    if (andProceedToSRQ && onProceedToSRQ20) {
      onProceedToSRQ20(updatedProfile);
    } else {
      onComplete(updatedProfile);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in">
      {/* Header Context */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
            Menu PFA (Fase Akut: Hari 1–3)
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">
            Pertolongan Pertama Psikologis (Look-Listen-Link)
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
            <span className="font-mono font-bold text-slate-800">{survivor.id}</span>
            <span>·</span>
            <span>{survivor.name} ({survivor.age} th)</span>
            <span>·</span>
            <span>{survivor.posko}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Step Tabs: Look -> Listen -> Link */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveStep('look')}
          className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeStep === 'look'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>1. LOOK</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('listen')}
          className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeStep === 'listen'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Ear className="w-3.5 h-3.5" />
          <span>2. LISTEN</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('link')}
          className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeStep === 'link'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>3. LINK</span>
        </button>
      </div>

      {/* STEP 1: LOOK */}
      {activeStep === 'look' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. LOOK — Observasi Visual & Tanda Bahaya
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Amati kondisi fisik, keselamatan lingkungan posko, dan tanda-tanda distres akut sebelum berinteraksi.
            </p>
          </div>

          <div className="space-y-2">
            {PFA_LOOK_ITEMS.map((item) => {
              const isChecked = selectedLook.includes(item.label);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleLook(item.label)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-start justify-between gap-3 transition ${
                    isChecked
                      ? item.isUrgent
                        ? 'bg-red-50 border-red-300 text-red-950 font-semibold'
                        : 'bg-blue-50 border-blue-300 text-blue-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold block">{item.label}</span>
                    {item.subtext && (
                      <span className="text-[11px] text-slate-500 block mt-0.5 font-normal">
                        {item.subtext}
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      isChecked
                        ? item.isUrgent
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

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveStep('listen')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <span>Lanjut ke LISTEN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: LISTEN */}
      {activeStep === 'listen' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. LISTEN — Panduan Dengar & Dialog Penenangan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hadir secara tulus, dengarkan keluhan emosional tanpa mendesak penyintas bercerita, dan berikan rasa aman.
            </p>
          </div>

          {/* Guided dialog tips */}
          <div className="space-y-2">
            {PFA_LISTEN_GUIDELINES.map((guide, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-800 block">
                  💡 {guide.title}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{guide.instruction}"
                </p>
              </div>
            ))}
          </div>

          {/* Guided Grounding Exercise Toggle */}
          <div className="p-3 rounded-2xl border border-blue-200 bg-blue-50/60 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold text-blue-900 block">
                  Teknik Grounding / Pernapasan Ritmik
                </span>
                <span className="text-[11px] text-blue-700 block">
                  Telah dipandu latihan napas dalam atau metode grounding 5-4-3-2-1
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGroundingUsed(!groundingUsed)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition shrink-0 ${
                groundingUsed
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              {groundingUsed ? '✓ Dilakukan' : '+ Tandai Dilakukan'}
            </button>
          </div>

          {/* Volunteer Clinical Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Catatan Ungkapan Perasaan Penyintas
            </label>
            <textarea
              value={listenNotes}
              onChange={(e) => setListenNotes(e.target.value)}
              rows={3}
              placeholder="Tuliskan keluhan utama, kekhawatiran, atau kebutuhan mendesak yang diungkapkan penyintas..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl p-3 text-xs text-slate-900 outline-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-between">
            <button
              type="button"
              onClick={() => setActiveStep('look')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('link')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <span>Lanjut ke LINK</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LINK */}
      {activeStep === 'link' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. LINK — Panduan Pemenuhan Kebutuhan Dasar
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hubungkan penyintas dengan sumber daya posko: makanan, shelter, reunifikasi keluarga, dan pos kesehatan.
            </p>
          </div>

          <div className="space-y-2">
            {PFA_LINK_ITEMS.map((item) => {
              const isChecked = selectedLink.includes(item.label);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleLink(item.label)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-start justify-between gap-3 transition ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold block">{item.label}</span>
                    {item.subtext && (
                      <span className="text-[11px] text-slate-500 block mt-0.5 font-normal">
                        {item.subtext}
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action to Complete PFA */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => setActiveStep('listen')}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => handleFinishPFA(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan PFA & Selesai</span>
              </button>

              <button
                type="button"
                onClick={() => handleFinishPFA(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <span>Simpan & Lanjut ke SRQ-20</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
