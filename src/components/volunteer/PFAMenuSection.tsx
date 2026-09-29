import React, { useState } from 'react';
import {
  Eye,
  Ear,
  Link2,
  CheckCircle2,
  Save,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Wind,
  Check,
  Heart,
  AlertTriangle,
  Info,
  Droplets,
  Shirt,
  Pill,
  Users,
  MessageSquare,
  PhoneCall,
  Activity,
  EyeOff,
  UserCheck,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { SurvivorProfile } from '../../types/assessment';
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
      zone: selectedLook.some((i) =>
        i.includes('Distres') ||
        i.includes('Cedera') ||
        i.includes('Mutisme') ||
        i.includes('Amuk')
      )
        ? 'YELLOW'
        : 'GREEN',
      triageTier: 'T3',
      score: selectedLook.length,
      indicators: [...selectedLook, ...selectedLink],
      criticalTriggered: false,
      recommendedAction:
        'Intervensi PFA Look-Listen-Link (Fase Akut 72 Jam) selesai dicatat. Pantau pemulihan stres akut dan lanjutkan penapisan berkala SRQ-20 pada Fase Lanjutan (Hari 4-30).',
      volunteerNotes: `PFA Selesai di ${survivor.posko}. Catatan: ${
        listenNotes || 'Kebutuhan dasar terfasilitasi'
      }.`,
      victimName: survivor.name,
      victimAge: survivor.age,
      victimGender: survivor.gender,
      victimCategory: survivor.category,
    });

    if (andProceedToSRQ && onProceedToSRQ20) {
      onProceedToSRQ20(updatedProfile);
    } else {
      onComplete(updatedProfile);
    }
  };

  const handleBackWithDraft = () => {
    // If any notes or checkboxes were marked, preserve draft in registry
    if (
      selectedLook.length > 0 ||
      listenNotes.trim() ||
      selectedLink.length > 0 ||
      groundingUsed
    ) {
      const now = new Date();
      const timeHours = String(now.getHours()).padStart(2, '0');
      const timeMins = String(now.getMinutes()).padStart(2, '0');

      const draftProfile: SurvivorProfile = {
        ...survivor,
        currentPhase: 'acute_pfa',
        pfaRecord: {
          completedAt: survivor.pfaRecord?.completedAt?.startsWith('Draf')
            ? survivor.pfaRecord.completedAt
            : `Draf (${timeHours}:${timeMins})`,
          lookItems: selectedLook,
          listenNotes: listenNotes.trim(),
          groundingUsed,
          linkItems: selectedLink,
        },
      };
      saveSurvivorToRegistry(draftProfile);
    }
    onBack();
  };

  const getLookItemIcon = (id: string, isUrgent?: boolean) => {
    switch (id) {
      case 'look_safety_environment':
        return <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'look_physical_injury':
        return <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />;
      case 'look_shock_mutism':
        return <EyeOff className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'look_hysteria':
        return <Activity className="w-5 h-5 text-orange-600 shrink-0" />;
      case 'look_agitation':
        return <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />;
      default:
        return isUrgent ? (
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
        ) : (
          <Eye className="w-5 h-5 text-blue-600 shrink-0" />
        );
    }
  };

  const getLinkItemIcon = (id: string) => {
    switch (id) {
      case 'link_water_food':
        return <Droplets className="w-5 h-5 text-blue-600 shrink-0" />;
      case 'link_blanket_clothes':
        return <Shirt className="w-5 h-5 text-indigo-600 shrink-0" />;
      case 'link_medication':
        return <Pill className="w-5 h-5 text-red-600 shrink-0" />;
      case 'link_baby_elderly':
        return <Users className="w-5 h-5 text-amber-600 shrink-0" />;
      default:
        return <Link2 className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 sm:p-6 space-y-5 animate-in fade-in pb-16">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP HEADER & SURVIVOR CONTEXT */}
      {/* ------------------------------------------------------------------ */}
      <header className="space-y-3 border-b border-slate-100 pb-4">
        {/* Navigation & Phase Pill */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleBackWithDraft}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 min-h-[40px] transition cursor-pointer"
            title="Kembali dan simpan draf pengamatan"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Kembali (Simpan Draf)</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>PFA · Hari 1–3</span>
            </span>
            {survivor.pfaRecord?.completedAt && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Save className="w-2.5 h-2.5" />
                <span>{survivor.pfaRecord.completedAt}</span>
              </span>
            )}
          </div>
        </div>

        {/* Survivor Tactical Identity Card */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900">
                {survivor.name}
              </h1>
              <span className="text-xs text-slate-500 font-medium">
                ({survivor.age} th, {survivor.gender})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {survivor.id}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{survivor.posko}</span>
              </span>
              <span>·</span>
              <span className="text-slate-600 font-medium">{survivor.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Target Sesi
              </span>
              <span className="text-xs font-bold text-slate-800">
                Stabilisasi Psikologis
              </span>
            </div>
          </div>
        </div>

        {/* Calm Core Principle Notice */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center gap-2.5 text-xs text-blue-950 font-medium">
          <Heart className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="leading-snug">{PFA_PRINCIPLE}</span>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. GUIDED WORKBENCH STEP NAVIGATION (LOOK -> LISTEN -> LINK) */}
      {/* ------------------------------------------------------------------ */}
      <nav
        className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80"
        role="tablist"
        aria-label="Tahapan Guided PFA"
      >
        {/* Step 1: LOOK */}
        <button
          type="button"
          role="tab"
          aria-selected={activeStep === 'look'}
          onClick={() => setActiveStep('look')}
          className={`min-h-[52px] rounded-xl px-2 py-2 flex flex-col items-center justify-center transition cursor-pointer ${
            activeStep === 'look'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs">
            <Eye className="w-3.5 h-3.5" />
            <span>01 LOOK</span>
          </div>
          <span className="text-[10px] font-normal text-slate-500 mt-0.5">
            {selectedLook.length > 0 ? `${selectedLook.length} indikator` : 'Observasi'}
          </span>
        </button>

        {/* Step 2: LISTEN */}
        <button
          type="button"
          role="tab"
          aria-selected={activeStep === 'listen'}
          onClick={() => setActiveStep('listen')}
          className={`min-h-[52px] rounded-xl px-2 py-2 flex flex-col items-center justify-center transition cursor-pointer ${
            activeStep === 'listen'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs">
            <Ear className="w-3.5 h-3.5" />
            <span>02 LISTEN</span>
          </div>
          <span className="text-[10px] font-normal text-slate-500 mt-0.5">
            {listenNotes.trim() || groundingUsed ? 'Tercatat' : 'Dengarkan'}
          </span>
        </button>

        {/* Step 3: LINK */}
        <button
          type="button"
          role="tab"
          aria-selected={activeStep === 'link'}
          onClick={() => setActiveStep('link')}
          className={`min-h-[52px] rounded-xl px-2 py-2 flex flex-col items-center justify-center transition cursor-pointer ${
            activeStep === 'link'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs">
            <Link2 className="w-3.5 h-3.5" />
            <span>03 LINK</span>
          </div>
          <span className="text-[10px] font-normal text-slate-500 mt-0.5">
            {selectedLink.length > 0 ? `${selectedLink.length} kebutuhan` : 'Hubungkan'}
          </span>
        </button>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* 3. STEP CONTENT SECTIONS */}
      {/* ------------------------------------------------------------------ */}

      {/* === STEP 1: LOOK (OBSERVE -> IDENTIFY -> RESPOND) === */}
      {activeStep === 'look' && (
        <section className="space-y-4 animate-in fade-in" aria-labelledby="heading-look">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  01 / 03
                </span>
                <h2 id="heading-look" className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Tahap 1: LOOK (Amati Kondisi Lapangan)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                OBSERVE → IDENTIFY → RESPOND. Lakukan pemindaian visual singkat selama 10–15 detik sebelum mendekati penyintas.
              </p>
            </div>
            <span className="self-start sm:self-auto text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium shrink-0">
              Observasi 10–15 Detik
            </span>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2.5" role="group" aria-label="Daftar observasi visual PFA">
            {PFA_LOOK_ITEMS.map((item) => {
              const isChecked = selectedLook.includes(item.label);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleLook(item.label)}
                  className={`w-full p-4 rounded-xl border text-left flex items-start justify-between gap-3.5 transition min-h-[58px] cursor-pointer ${
                    isChecked
                      ? item.isUrgent
                        ? 'bg-red-50/90 border-red-300 text-red-950 ring-1 ring-red-300'
                        : 'bg-blue-50/80 border-blue-300 text-blue-950 ring-1 ring-blue-300'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                  aria-pressed={isChecked}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">
                      {getLookItemIcon(item.id, item.isUrgent)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold block">
                          {item.label}
                        </span>
                        {item.isUrgent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                            Perlu Atensi Medis
                          </span>
                        )}
                      </div>
                      {item.subtext && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {item.subtext}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Accessible Checkmark Indicator */}
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isChecked
                        ? item.isUrgent
                          ? 'bg-red-600 border-red-600 text-white shadow-xs'
                          : 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span className="sr-only">Belum ditandai</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Volunteer Clinical Tip Box */}
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 leading-relaxed font-medium flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Petunjuk Sikap Relawan:</span>
              <p>{PFA_VOLUNTEER_LOOK_TIP}</p>
            </div>
          </div>

          {/* Navigation to Listen */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveStep('listen')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition min-h-[52px] cursor-pointer"
            >
              <span>Lanjut ke Tahap 2: LISTEN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* === STEP 2: LISTEN (CONVERSATIONAL & GROUNDING) === */}
      {activeStep === 'listen' && (
        <section className="space-y-4 animate-in fade-in" aria-labelledby="heading-listen">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                02 / 03
              </span>
              <h2 id="heading-listen" className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Tahap 2: LISTEN (Dengarkan & Tenangkan)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Fokus utama: Menenangkan emosi, mendengarkan aktif tanpa menghakimi, dan memulihkan rasa aman penyintas.
            </p>
          </div>

          {/* 1. Sapa & Tawarkan Bantuan (Script Relawan) */}
          <div className="p-4 bg-blue-50/80 border border-blue-200/90 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-900">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider">
                1. Sapa & Tawarkan Bantuan (Script Relawan)
              </span>
            </div>
            <blockquote className="p-3 bg-white/90 border-l-4 border-blue-500 rounded-r-lg text-xs text-slate-800 italic leading-relaxed font-medium">
              "{PFA_LISTEN_GREETING_SCRIPT}"
            </blockquote>
            <p className="text-[11px] text-blue-800">
              Gunakan nada suara yang tenang, duduk sejajar, dan berikan penyintas ruang untuk berbicara sesuai kesiapannya.
            </p>
          </div>

          {/* 2. Actionable Guidance: Do's & Don'ts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* DO Card */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>DO (Dianjurkan Dilakukan)</span>
              </div>
              <ul className="space-y-2 text-emerald-950 text-[11px] leading-relaxed">
                {PFA_DOS_AND_DONTS.dos.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'T Card */}
            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>DON'T (Hindari Dilakukan)</span>
              </div>
              <ul className="space-y-2 text-rose-950 text-[11px] leading-relaxed">
                {PFA_DOS_AND_DONTS.donts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold shrink-0">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. Teknik Grounding 5-4-3-2-1 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {PFA_GROUNDING_STEPS.title}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Gunakan jika penyintas panik, gemetar, atau napas memburu
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGroundingUsed(!groundingUsed)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 ${
                  groundingUsed
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50'
                }`}
              >
                {groundingUsed ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Latihan Telah Dilakukan</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>+ Tandai Latihan Dilakukan</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {PFA_GROUNDING_STEPS.intro}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PFA_GROUNDING_STEPS.steps.map((st, i) => (
                <div
                  key={i}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1"
                >
                  <span className="font-extrabold text-blue-700 block uppercase tracking-wider text-[11px]">
                    Langkah {i + 1}: {st.title}
                  </span>
                  <p className="text-slate-700 italic leading-relaxed text-[11px]">
                    "{st.script}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Volunteer Clinical Notes */}
          <div className="space-y-1.5">
            <label
              htmlFor="pfa-listen-notes"
              className="text-xs font-bold text-slate-800 flex items-center justify-between"
            >
              <span>Catatan Ungkapan & Kebutuhan Penyintas</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Opsional / dapat dilengkapi bertahap
              </span>
            </label>
            <textarea
              id="pfa-listen-notes"
              value={listenNotes}
              onChange={(e) => setListenNotes(e.target.value)}
              rows={3}
              placeholder="Tuliskan keluhan utama, kekhawatiran spesifik, atau kebutuhan mendesak yang disampaikan penyintas..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl p-3 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed min-h-[96px] transition"
            />
          </div>

          {/* Navigation Controls */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => setActiveStep('look')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[50px] transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke LOOK</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('link')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition min-h-[52px] cursor-pointer"
            >
              <span>Lanjut ke Tahap 3: LINK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* === STEP 3: LINK (NEED -> CONNECT -> SUPPORT) === */}
      {activeStep === 'link' && (
        <section className="space-y-4 animate-in fade-in" aria-labelledby="heading-link">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                03 / 03
              </span>
              <h2 id="heading-link" className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Tahap 3: LINK (Hubungkan Kebutuhan & Bantuan)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              NEED → CONNECT → SUPPORT. Bantu penyintas menemukan kembali rasa kendali atas kebutuhan dasarnya dan sambungkan ke posko/keluarga.
            </p>
          </div>

          {/* 1. Kebutuhan Dasar Logistik */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 block">
                1. Kebutuhan Dasar Logistik Paling Mendesak:
              </span>
              <span className="text-[11px] text-slate-400">
                Pilih yang perlu difasilitasi
              </span>
            </div>
            <div className="space-y-2.5" role="group" aria-label="Kebutuhan dasar logistik">
              {PFA_LINK_LOGISTICS_ITEMS.map((item) => {
                const isChecked = selectedLink.includes(item.label);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleLink(item.label)}
                    className={`w-full p-4 rounded-xl border text-left flex items-start justify-between gap-3.5 transition min-h-[58px] cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                    aria-pressed={isChecked}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">{getLinkItemIcon(item.id)}</div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold block">
                          {item.label}
                        </span>
                        {item.subtext && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {item.subtext}
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <span className="sr-only">Belum dipilih</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Menghubungkan Dukungan Sosial */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-900">
              <PhoneCall className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider">
                2. Menghubungkan Dukungan Sosial (Script Relawan)
              </span>
            </div>
            <blockquote className="p-3 bg-white/90 border-l-4 border-blue-500 rounded-r-lg text-xs text-slate-800 italic leading-relaxed font-medium">
              "{PFA_LINK_SOCIAL_SCRIPT}"
            </blockquote>
          </div>

          {/* 3. Penutup Sesi PFA */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800">
              <UserCheck className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold uppercase tracking-wider">
                3. Penutup Sesi PFA (Script Relawan)
              </span>
            </div>
            <blockquote className="p-3 bg-white border-l-4 border-slate-400 rounded-r-lg text-xs text-slate-700 italic leading-relaxed">
              "{PFA_CLOSING_SCRIPT}"
            </blockquote>
          </div>

          {/* Action Footer: Complete PFA or Proceed to SRQ-20 */}
          <div className="pt-4 border-t border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveStep('listen')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[50px] transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke LISTEN</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleFinishPFA(false)}
                className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition min-h-[52px] cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>Simpan PFA & Selesai</span>
              </button>

              <button
                type="button"
                onClick={() => handleFinishPFA(true)}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition min-h-[52px] cursor-pointer"
              >
                <span>Simpan & Lanjut ke SRQ-20</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

