import React, { useState, useRef, useEffect } from 'react';
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
  X,
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
} from 'lucide-react';
import { SurvivorProfile } from '../../types/assessment';
import {
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
import { saveSurvivorToRegistry } from '../../data/seedSurvivors';

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

  const PFA_DRAFT_KEY = `rapidmind_pfa_draft_${survivor.id}`;

  const loadSavedPfaDraft = () => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(PFA_DRAFT_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse PFA draft', e);
    }
    return null;
  };

  const initialDraft = useRef(loadSavedPfaDraft()).current;
  const [draftRestoredBanner, setDraftRestoredBanner] = useState<boolean>(Boolean(initialDraft));

  // Auto-dismiss popup notification after 5 seconds
  useEffect(() => {
    if (draftRestoredBanner) {
      const timer = setTimeout(() => {
        setDraftRestoredBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [draftRestoredBanner]);

  const [activeStep, setActiveStep] = useState<'look' | 'listen' | 'link'>(
    initialDraft?.activeStep || 'look'
  );
  const [selectedLook, setSelectedLook] = useState<string[]>(
    initialDraft?.selectedLook || survivor.pfaRecord?.lookItems || []
  );
  const [listenNotes, setListenNotes] = useState<string>(
    initialDraft?.listenNotes !== undefined
      ? initialDraft.listenNotes
      : survivor.pfaRecord?.listenNotes || ''
  );
  const [groundingUsed, setGroundingUsed] = useState<boolean>(
    initialDraft?.groundingUsed !== undefined
      ? initialDraft.groundingUsed
      : survivor.pfaRecord?.groundingUsed || false
  );
  const [selectedLink, setSelectedLink] = useState<string[]>(
    initialDraft?.selectedLink || survivor.pfaRecord?.linkItems || []
  );

  // Auto-save PFA draft on every change so refresh never loses data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasData =
      selectedLook.length > 0 ||
      listenNotes.trim().length > 0 ||
      selectedLink.length > 0 ||
      groundingUsed;

    if (hasData) {
      localStorage.setItem(
        PFA_DRAFT_KEY,
        JSON.stringify({
          activeStep,
          selectedLook,
          listenNotes,
          groundingUsed,
          selectedLink,
          updatedAt: Date.now(),
        })
      );
    }
  }, [PFA_DRAFT_KEY, activeStep, selectedLook, listenNotes, groundingUsed, selectedLink]);

  // Browser refresh protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedData =
        selectedLook.length > 0 ||
        listenNotes.trim().length > 0 ||
        selectedLink.length > 0 ||
        groundingUsed;

      if (typeof window !== 'undefined' && hasUnsavedData) {
        try {
          localStorage.setItem(
            PFA_DRAFT_KEY,
            JSON.stringify({
              activeStep,
              selectedLook,
              listenNotes,
              groundingUsed,
              selectedLink,
              updatedAt: Date.now(),
            })
          );
        } catch {}
      }

      if (hasUnsavedData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [PFA_DRAFT_KEY, activeStep, selectedLook, listenNotes, selectedLink, groundingUsed]);

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
        lookItems:
          selectedLook.length > 0
            ? selectedLook
            : ['Observasi Visual PFA Selesai Ditelaah'],
        listenNotes: listenNotes.trim(),
        groundingUsed,
        linkItems: selectedLink,
      },
    };

    // Save survivor to persistent registry
    saveSurvivorToRegistry(updatedProfile);

    // Save as assessment record in state (PFA is acute non-scoring intervention)
    addAssessment({
      id: survivor.id,
      victimId: survivor.id,
      nik: survivor.nik,
      timestamp: `${timeHours}:${timeMins}`,
      location: survivor.posko,
      method: 'CHECKLIST',
      phase: 'acute_pfa',
      zone: 'GREEN',
      triageTier: 'T3',
      score: 0,
      indicators: [
        'Protokol PFA Look-Listen-Link Selesai',
        ...(selectedLink.length > 0 ? selectedLink : ['Kebutuhan Dasar Terpantau']),
      ],
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

    localStorage.removeItem(PFA_DRAFT_KEY);

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
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5 animate-in fade-in pb-8">
      {/* Pop-up Notifikasi Pemulihan Draf saat Refresh (Floating, Non-Intrusive) */}
      {draftRestoredBanner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto bg-slate-900/95 backdrop-blur-md text-white shadow-2xl rounded-2xl p-3.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 border border-slate-700/80 animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs leading-snug">
              <span className="font-bold text-white block">
                Draf PFA Dipulihkan
              </span>
              <span className="text-[11px] text-slate-300">
                Catatan dan data yang diisi sebelum refresh berhasil dipulihkan.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDraftRestoredBanner(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs font-semibold shrink-0 transition cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. PFA HEADER & SURVIVOR IDENTIFICATION */}
      {/* ------------------------------------------------------------------ */}
      <header className="space-y-3 border-b border-slate-100 pb-4">
        {/* Navigation & Phase Badge */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleBackWithDraft}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 min-h-[40px] transition cursor-pointer"
            title="Kembali ke pencarian dan simpan draf pengamatan"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Kembali (Simpan Draf)</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>PFA · Hari 1–3</span>
            </span>
            {survivor.pfaRecord?.completedAt && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <Save className="w-2.5 h-2.5" />
                <span>{survivor.pfaRecord.completedAt}</span>
              </span>
            )}
          </div>
        </div>

        {/* Section Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Pertolongan Pertama Psikologis (PFA)
          </h1>
        </div>

        {/* Survivor Profile Snapshot Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                {survivor.name}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                ({survivor.age} th, {survivor.gender === 'L' ? 'Laki-laki' : 'Perempuan'})
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

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Protokol Intervensi
            </span>
            <span className="text-xs font-bold text-slate-800">
              Stabilisasi Psikologis Lapangan
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* STEP PROGRESS CONNECTOR BAR: 01 LOOK ─── 02 LISTEN ─── 03 LINK     */}
        {/* ------------------------------------------------------------------ */}
        <div className="pt-1">
          <div
            className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200"
            role="tablist"
            aria-label="Tahapan Guided PFA"
          >
            {/* 01 LOOK */}
            <button
              type="button"
              role="tab"
              aria-selected={activeStep === 'look'}
              onClick={() => setActiveStep('look')}
              className={`min-h-[50px] rounded-lg px-2 py-2 flex flex-col items-center justify-center transition cursor-pointer ${
                activeStep === 'look'
                  ? 'bg-white text-slate-900 border border-slate-200 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <Eye className="w-3.5 h-3.5" />
                <span>01 LOOK</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {activeStep === 'look' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                )}
                <span className="text-[10px] font-normal text-slate-500">
                  Panduan Amati
                </span>
              </div>
            </button>

            {/* 02 LISTEN */}
            <button
              type="button"
              role="tab"
              aria-selected={activeStep === 'listen'}
              onClick={() => setActiveStep('listen')}
              className={`min-h-[50px] rounded-lg px-2 py-2 flex flex-col items-center justify-center transition cursor-pointer ${
                activeStep === 'listen'
                  ? 'bg-white text-slate-900 border border-slate-200 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <Ear className="w-3.5 h-3.5" />
                <span>02 LISTEN</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {activeStep === 'listen' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                )}
                <span className="text-[10px] font-normal text-slate-500">
                  Dengarkan & Validasi
                </span>
              </div>
            </button>

            {/* 03 LINK */}
            <button
              type="button"
              role="tab"
              aria-selected={activeStep === 'link'}
              onClick={() => setActiveStep('link')}
              className={`min-h-[50px] rounded-lg px-2 py-2 flex flex-col items-center justify-center transition cursor-pointer ${
                activeStep === 'link'
                  ? 'bg-white text-slate-900 border border-slate-200 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <Link2 className="w-3.5 h-3.5" />
                <span>03 LINK</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {activeStep === 'link' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                )}
                <span className="text-[10px] font-normal text-slate-500">
                  Hubungkan Bantuan
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TAHAP 1: LOOK (OBSERVE -> IDENTIFY -> ACT)                      */}
      {/* ------------------------------------------------------------------ */}
      {activeStep === 'look' && (
        <section className="space-y-4 animate-in fade-in" aria-labelledby="heading-look">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <h3 id="heading-look" className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Tahap 1: LOOK (Observasi Lapangan)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Lakukan pemindaian visual singkat selama 10–15 detik sebelum mendekati penyintas untuk memastikan keamanan dan mendeteksi distres berat.
              </p>
            </div>
            <span className="self-start sm:self-auto text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium shrink-0">
              Observasi 10–15 Detik
            </span>
          </div>

          {/* Human-Centric & Non-Data-Entry Principle Notice */}
          <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-950">
            <div>
              <span className="font-bold text-blue-900 block">
                Buku Saku Observasi Visual (Non-Data-Entry):
              </span>
              <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
                <strong>Prinsip Non-Data-Entry & Human-Centric:</strong> Panduan ini adalah buku saku untuk dibaca relawan, bukan formulir untuk dicentang di depan penyintas. Pindai keamanan posko dan tanda distres visual selama 10–15 detik, lalu hadirlah secara utuh untuk mendampingi penyintas.
              </p>
            </div>
          </div>

          {/* Kartu Panduan Visual (Non-Clickable Pocket Guide Cards) */}
          <div className="space-y-2.5" role="list" aria-label="Daftar panduan observasi visual PFA">
            {PFA_LOOK_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`w-full p-4 rounded-xl border text-left flex items-start justify-between gap-3.5 transition ${
                  item.isUrgent
                    ? 'bg-rose-50/40 border-rose-200 text-slate-900 shadow-2xs'
                    : 'bg-emerald-50/30 border-emerald-200 text-slate-900 shadow-2xs'
                }`}
                role="listitem"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      item.isUrgent
                        ? 'bg-rose-100/90 text-rose-700'
                        : 'bg-emerald-100/90 text-emerald-700'
                    }`}
                  >
                    {getLookItemIcon(item.id, item.isUrgent)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                        {item.label}
                      </span>
                      {item.isUrgent ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Perlu Atensi Medis / Rujuk T0
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Panduan Area Aman
                        </span>
                      )}
                    </div>
                    {item.subtext && (
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {item.subtext}
                      </p>
                    )}
                    {item.isUrgent && (
                      <p className="text-[11px] text-rose-700 mt-1.5 font-medium flex items-center gap-1">
                        <span>🚨 Tindakan Lapangan:</span> Jika menemukan tanda ini, arahkan segera ke Tenda Medis Posko atau tekan tombol mengambang <strong>SOS T0</strong> di kanan bawah.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition min-h-[56px] cursor-pointer"
            >
              <span>Lanjut ke Tahap 2: LISTEN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. TAHAP 2: LISTEN (CONVERSATION & GROUNDING)                      */}
      {/* ------------------------------------------------------------------ */}
      {activeStep === 'listen' && (
        <section className="space-y-4 animate-in fade-in" aria-labelledby="heading-listen">
          <div>
            <h3 id="heading-listen" className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Tahap 2: LISTEN (Dengarkan & Validasi)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Fokus utama: Menenangkan emosi, mendengarkan aktif tanpa menghakimi, dan memulihkan rasa aman penyintas.
            </p>
          </div>

          {/* 1. Sapa & Tawarkan Bantuan (Readable Field Reference) */}
          <div className="border-l-2 border-slate-300 pl-3 py-1 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider">
                1. Sapa & Tawarkan Bantuan (Naskah Relawan)
              </span>
            </div>
            <blockquote className="text-xs text-slate-800 italic leading-relaxed font-medium">
              "{PFA_LISTEN_GREETING_SCRIPT}"
            </blockquote>
            <p className="text-[11px] text-slate-500">
              Gunakan nada suara yang tenang, duduk sejajar dengan mata penyintas, dan beri ruang tanpa memaksakan jawaban.
            </p>
          </div>

          {/* 2. Panduan Sikap Relawan (DO & DON'T) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* DO Card */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>✓ DO (Dianjurkan Dilakukan)</span>
              </div>
              <ul className="space-y-2 text-emerald-950 text-[11px] leading-relaxed">
                {PFA_DOS_AND_DONTS.dos.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'T Card */}
            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>✕ DON'T (Hindari Dilakukan)</span>
              </div>
              <ul className="space-y-2 text-rose-950 text-[11px] leading-relaxed">
                {PFA_DOS_AND_DONTS.donts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-700 font-bold shrink-0">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. Calm Guided Exercise: Teknik Grounding 5-4-3-2-1 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {PFA_GROUNDING_STEPS.title}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Ajak penyintas melakukan latihan jika mengalami panik, cemas, atau napas memburu
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
                  <span>+ Tandai Latihan Dilakukan</span>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {PFA_GROUNDING_STEPS.intro}
            </p>

            {/* Guided Exercise Steps */}
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
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition min-h-[56px] cursor-pointer"
            >
              <span>Lanjut ke Tahap 3: LINK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. TAHAP 3: LINK (NEED -> CONNECT -> SUPPORT)                      */}
      {/* ------------------------------------------------------------------ */}
      {activeStep === 'link' && (
        <section className="space-y-4 animate-in fade-in" aria-labelledby="heading-link">
          <div>
            <h3 id="heading-link" className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Tahap 3: LINK (Hubungkan Kebutuhan & Bantuan)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Bantu penyintas menemukan kembali rasa kendali atas kebutuhan dasarnya, menghubungkan ke posko/keluarga, dan menutup sesi pendampingan.
            </p>
          </div>

          {/* 1. Kelompok Kebutuhan Dasar Logistik */}
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
                2. Menghubungkan Dukungan Sosial (Naskah Relawan)
              </span>
            </div>
            <blockquote className="p-3 bg-white/95 border-l-4 border-blue-600 rounded-r-lg text-xs text-slate-800 italic leading-relaxed font-medium">
              "{PFA_LINK_SOCIAL_SCRIPT}"
            </blockquote>
          </div>

          {/* 3. Penutup Sesi PFA */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800">
              <UserCheck className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold uppercase tracking-wider">
                3. Penutup Sesi PFA (Naskah Relawan)
              </span>
            </div>
            <blockquote className="p-3 bg-white border-l-4 border-slate-400 rounded-r-lg text-xs text-slate-700 italic leading-relaxed">
              "{PFA_CLOSING_SCRIPT}"
            </blockquote>
          </div>

          {/* 4. Ringkasan Observasi & Aksi Penyelesaian PFA */}
          <div className="pt-4 border-t border-slate-200/90 space-y-3">
            {/* Review Snapshot Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700">Ringkasan Sesi:</span>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded border border-emerald-200 font-semibold">
                  ✓ Panduan LOOK Ditelaah
                </span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                  {groundingUsed ? '✓ Grounding Dilakukan' : 'Tanpa Grounding'}
                </span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedLink.length > 0 ? `${selectedLink.length} Kebutuhan Difasilitasi` : 'Kebutuhan Terfasilitasi'}
                </span>
              </div>
            </div>

            {/* Action Buttons: Primary & Secondary */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setActiveStep('listen')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[50px] transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke LISTEN</span>
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFinishPFA(false)}
                  className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition min-h-[56px] cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  <span>Simpan PFA & Selesai</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinishPFA(true)}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition min-h-[56px] cursor-pointer"
                >
                  <span>Simpan & Lanjut ke SRQ-20</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};


