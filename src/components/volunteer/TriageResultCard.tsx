import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Save,
  RotateCcw,
  Check,
  User as UserIcon,
} from 'lucide-react';
import { TriageAnalysisResult, LocationPost, AssessmentMethod, VictimData } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';

interface TriageResultCardProps {
  victimId: string;
  location: LocationPost;
  victimData?: VictimData;
  method: AssessmentMethod;
  analysis: TriageAnalysisResult;
  transcript?: string;
  checklistSelections?: string[];
  onOpenPFA?: () => void;
  onReset: () => void;
}

export const TriageResultCard: React.FC<TriageResultCardProps> = ({
  victimId,
  location,
  victimData,
  method,
  analysis,
  transcript,
  checklistSelections,
  onOpenPFA,
  onReset,
}) => {
  const { addAssessment } = useAssessment();
  const { currentUser } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const zoneConfig = {
    GREEN: {
      title: 'GREEN',
      subtitle: 'Routine monitoring',
      icon: CheckCircle2,
      containerClass: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      badgeClass: 'bg-emerald-600 text-white',
    },
    YELLOW: {
      title: 'YELLOW',
      subtitle: 'Follow-up recommended',
      icon: AlertTriangle,
      containerClass: 'bg-amber-50 border-amber-200 text-amber-900',
      badgeClass: 'bg-amber-500 text-white',
    },
    RED: {
      title: 'RED',
      subtitle: 'Immediate attention',
      icon: ShieldAlert,
      containerClass: 'bg-red-50 border-red-200 text-red-900',
      badgeClass: 'bg-red-600 text-white',
    },
  }[analysis.zone];

  const ZoneIcon = zoneConfig.icon;

  const handleSave = () => {
    if (isSaved) return;

    const now = new Date();
    const timeHours = String(now.getHours()).padStart(2, '0');
    const timeMins = String(now.getMinutes()).padStart(2, '0');

    const result = addAssessment({
      id: victimId,
      timestamp: `${timeHours}:${timeMins}`,
      location,
      method,
      zone: analysis.zone,
      score: analysis.score,
      indicators: analysis.indicators,
      criticalTriggered: analysis.criticalTriggered,
      transcript,
      checklistSelections,
      recommendedAction: analysis.recommendedAction,
      volunteerId: currentUser?.badgeNumber || 'VOL-042',
      volunteerNotes: `Asesmen ${method.toLowerCase()} di ${location}. Korban: ${victimData?.name || victimId}.`,
      victimName: victimData?.name,
      victimAge: victimData?.age,
      victimGender: victimData?.gender,
      victimCategory: victimData?.category,
    });

    setIsSaved(true);
    setSaveMessage(result.isOfflineSaved ? 'Tersimpan lokal di HP (siap sinkronisasi)' : 'Tersinkronisasi ke Pusat Komando & Portal RS');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs animate-in fade-in">
      {/* Context info with Victim Profile */}
      <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-800">{victimId}</span>
          {victimData?.name && (
            <>
              <span className="text-slate-300">·</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <UserIcon className="w-3 h-3 text-blue-600" />
                {victimData.name} ({victimData.age ? `${victimData.age} th` : ''} {victimData.gender ? `• ${victimData.gender}` : ''})
              </span>
            </>
          )}
        </div>
        <span>{location} · {method}</span>
      </div>

      {/* Main Status */}
      <div className={`p-4 rounded-xl border ${zoneConfig.containerClass} flex items-center gap-3.5`}>
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs">
          <ZoneIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight">{zoneConfig.title}</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${zoneConfig.badgeClass}`}>
              {analysis.zone}
            </span>
          </div>
          <span className="text-xs font-semibold block">{zoneConfig.subtitle}</span>
          <span className="text-[11px] text-slate-600 block">
            {analysis.indicators.length} indikator terdeteksi
          </span>
        </div>
      </div>

      {/* Detected Indicators */}
      {analysis.indicators.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Indikator Gejala Terdeteksi
          </span>
          <div className="flex flex-wrap gap-1.5">
            {analysis.indicators.map((ind, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-medium"
              >
                ✓ {ind}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Transcript or Checklist Summary */}
      {transcript && (
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Transkrip STT (Perekaman Suara)
          </span>
          <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 italic leading-relaxed">
            "{transcript}"
          </p>
        </div>
      )}

      {checklistSelections && checklistSelections.length > 0 && (
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Checklist Pilihan Observasi ({checklistSelections.length})
          </span>
          <div className="flex flex-wrap gap-1">
            {checklistSelections.map((cId) => (
              <span key={cId} className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-semibold border border-blue-200">
                {cId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next Action */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Protokol Tindakan Yang Direkomendasikan
        </span>
        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          {analysis.recommendedAction}
        </p>
      </div>

      {/* Save Outcome Message */}
      {saveMessage && (
        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 flex flex-col gap-2">
        {analysis.zone === 'RED' && onOpenPFA && (
          <button
            type="button"
            onClick={onOpenPFA}
            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Lihat Panduan PFA Lapangan</span>
          </button>
        )}

        {!isSaved ? (
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Hasil Asesmen</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mulai Asesmen Baru</span>
          </button>
        )}
      </div>
    </div>
  );
};
