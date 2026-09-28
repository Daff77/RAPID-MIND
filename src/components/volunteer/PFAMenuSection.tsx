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
  Heart,
  AlertTriangle,
  Info,
  CheckSquare,
} from 'lucide-react';
import { LocationPost, SurvivorProfile } from '../../types/assessment';
import {
  PFA_PRINCIPLE,
  PFA_LOOK_ITEMS,
  PFA_VOLUNTEER_LOOK_TIP,
  PFA_LISTEN_GREETING_SCRIPT,
  PFA_DOS_AND_DONTS,
  PFA_GROUNDING_STEPS,
  PFA_LINK_LOGISTICS_ITEMS,
  PFA_LINK_SOCIAL_SCRIPT,
  PFA_CLOSING_SCRIPT,
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

  const [activeStep, setActiveStep] = useState<'look' | 'listen' | 'link'>('look');
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

    // Save as assessment record in state
    addAssessment({
      id: survivor.id,
      victimId: survivor.id,
      nik: survivor.nik,
      timestamp: `${timeHours}:${timeMins}`,
      location: survivor.posko,
      method: 'CHECKLIST',
      phase: 'acute_pfa',
      zone: selectedLook.some((i) => i.includes('Distres') || i.includes('Cedera') || i.includes('Mutisme') || i.includes('Amuk'))
        ? 'YELLOW'
        : 'GREEN',
      triageTier: 'T3',
      score: selectedLook.length,
      indicators: [...selectedLook, ...selectedLink],
      criticalTriggered: false,
      recommendedAction:
        'Intervensi PFA Look-Listen-Link (Fase Akut 72 Jam) selesai dicatat. Pantau pemulihan stres akut dan lanjutkan penapisan berkala SRQ-20 pada Fase Lanjutan (Hari 4-30).',
      volunteerNotes: `PFA Selesai di ${survivor.posko}. Catatan: ${listenNotes || 'Kebutuhan dasar terfasilitasi'}.`,
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
            Buku Saku Digital PFA · Menu Fase Akut (Hari 1–3)
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">
            Pertolongan Pertama Psikologis (Look - Listen - Link)
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
          title="Kembali ke Homescreen"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Core Principle Banner */}
      <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-xs text-blue-950 font-medium">
        <Heart className="w-4 h-4 text-blue-600 shrink-0" />
        <span>{PFA_PRINCIPLE}</span>
      </div>

      {/* 3 Step Tabs: Look -> Listen -> Link */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveStep('look')}
          className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 min-h-[44px] ${
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
          className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 min-h-[44px] ${
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
          className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 min-h-[44px] ${
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                👁️ TAHAP 1: LOOK (AMATI)
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                Observasi 10–15 Detik
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Lakukan pemindaian visual singkat selama 10–15 detik sebelum Anda mendekati penyintas.
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
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition min-h-[56px] ${
                    isChecked
                      ? item.isUrgent
                        ? 'bg-red-50 border-red-400 text-red-950 font-semibold'
                        : 'bg-blue-50 border-blue-400 text-blue-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold block">{item.label}</span>
                    {item.subtext && (
                      <span className="text-[11px] text-slate-500 block mt-0.5 font-normal leading-relaxed">
                        {item.subtext}
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      isChecked
                        ? item.isUrgent
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Volunteer Tip */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 leading-relaxed font-medium">
            {PFA_VOLUNTEER_LOOK_TIP}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveStep('listen')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition min-h-[48px]"
            >
              <span>Lanjut ke LISTEN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: LISTEN */}
      {activeStep === 'listen' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              👂 TAHAP 2: LISTEN (DENGARKAN)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fokus utama Anda adalah menenangkan dan memfasilitasi emosi penyintas.
            </p>
          </div>

          {/* 1. Sapa & Tawarkan Bantuan */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-blue-900 block">
              1. Sapa & Tawarkan Bantuan (Script Relawan):
            </span>
            <p className="text-xs text-blue-950 italic leading-relaxed font-medium">
              "{PFA_LISTEN_GREETING_SCRIPT}"
            </p>
          </div>

          {/* 2. Panduan Mengolah Emosi (Do's & Don'ts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                <span>✅ DO (Lakukan)</span>
              </span>
              <ul className="space-y-1.5 text-emerald-950 text-[11px] leading-relaxed">
                {PFA_DOS_AND_DONTS.dos.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
              <span className="text-xs font-extrabold text-rose-900 flex items-center gap-1.5">
                <span>❌ DON'T (Jangan Lakukan)</span>
              </span>
              <ul className="space-y-1.5 text-rose-950 text-[11px] leading-relaxed">
                {PFA_DOS_AND_DONTS.donts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-700 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. Teknik Grounding 5-4-3-2-1 */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">
                  {PFA_GROUNDING_STEPS.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGroundingUsed(!groundingUsed)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                  groundingUsed
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                }`}
              >
                {groundingUsed ? '✓ Latihan Dilakukan' : '+ Tandai Dilakukan'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {PFA_GROUNDING_STEPS.intro}
            </p>
            <div className="space-y-1.5 pt-1">
              {PFA_GROUNDING_STEPS.steps.map((st, i) => (
                <div key={i} className="p-2 bg-white border border-slate-200 rounded-xl text-xs flex items-start gap-2">
                  <span className="font-bold text-blue-600 shrink-0">{st.title}:</span>
                  <span className="text-slate-700 italic">"{st.script}"</span>
                </div>
              ))}
            </div>
          </div>

          {/* Volunteer Clinical Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Catatan Ungkapan & Kebutuhan Penyintas
            </label>
            <textarea
              value={listenNotes}
              onChange={(e) => setListenNotes(e.target.value)}
              rows={3}
              placeholder="Tuliskan keluhan utama, kekhawatiran, atau kebutuhan mendesak yang disampaikan penyintas..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl p-3 text-xs text-slate-900 outline-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-between">
            <button
              type="button"
              onClick={() => setActiveStep('look')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 min-h-[48px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('link')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition min-h-[48px]"
            >
              <span>Lanjut ke LINK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LINK */}
      {activeStep === 'link' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              🔗 TAHAP 3: LINK (HUBUNGKAN)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bantu penyintas menemukan kembali rasa kendali atas kebutuhan dasarnya.
            </p>
          </div>

          {/* 1. Kebutuhan Dasar Logistik */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              1. Kebutuhan Dasar Logistik Paling Mendesak:
            </span>
            <div className="space-y-2">
              {PFA_LINK_LOGISTICS_ITEMS.map((item) => {
                const isChecked = selectedLink.includes(item.label);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleLink(item.label)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition min-h-[56px] ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold block">{item.label}</span>
                      {item.subtext && (
                        <span className="text-[11px] text-slate-500 block mt-0.5 font-normal leading-relaxed">
                          {item.subtext}
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Menghubungkan Dukungan Sosial */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-blue-900 block">
              2. Menghubungkan Dukungan Sosial (Script Relawan):
            </span>
            <p className="text-xs text-blue-950 italic leading-relaxed font-medium">
              "{PFA_LINK_SOCIAL_SCRIPT}"
            </p>
          </div>

          {/* 3. Penutup Sesi PFA */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-slate-800 block">
              3. Penutup Sesi PFA (Script Relawan):
            </span>
            <p className="text-xs text-slate-700 italic leading-relaxed">
              "{PFA_CLOSING_SCRIPT}"
            </p>
          </div>

          {/* Action to Complete PFA */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => setActiveStep('listen')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[48px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => handleFinishPFA(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition min-h-[48px]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan PFA & Selesai</span>
              </button>

              <button
                type="button"
                onClick={() => handleFinishPFA(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition min-h-[48px]"
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
