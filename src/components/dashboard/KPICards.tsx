import React from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, AlertTriangle, Activity, CheckCircle, Users, UserCheck } from 'lucide-react';

export const KPICards: React.FC = () => {
  const { centralAssessments } = useAssessment();
  const { allUsers } = useAuth();

  const t0Count = centralAssessments.filter(
    (r) => r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)
  ).length;

  const t1Count = centralAssessments.filter(
    (r) => r.triageTier === 'T1' || (r.zone === 'RED' && !r.criticalTriggered)
  ).length;

  const t2Count = centralAssessments.filter(
    (r) => r.triageTier === 'T2' || r.zone === 'YELLOW'
  ).length;

  const t3Count = centralAssessments.filter(
    (r) => r.triageTier === 'T3' || r.zone === 'GREEN'
  ).length;

  const total = centralAssessments.length || 1;
  const activeVolunteersCount = allUsers.filter((u) => u.role === 'volunteer').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Penyintas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Total Penyintas
          </span>
          <Users className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {centralAssessments.length}
          </span>
          <span className="text-[10px] text-slate-400">Jiwa</span>
        </div>
        <span className="text-[10px] text-slate-500 block truncate">
          Terdata di Semua Posko
        </span>
      </div>

      {/* 2. T0 Emergency */}
      <div className="bg-white border-2 border-red-500 rounded-2xl p-3.5 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider">
              T0 · Emergency
            </span>
          </div>
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl sm:text-2xl font-black text-red-600 font-mono">
            {t0Count}
          </span>
          <span className="text-[10px] font-bold text-red-600">
            {Math.round((t0Count / total) * 100)}%
          </span>
        </div>
        <span className="text-[10px] text-red-800 font-medium block truncate">
          Siaga PSC 119 & IGD RS
        </span>
      </div>

      {/* 3. T1 High Risk */}
      <div className="bg-white border border-red-200 rounded-2xl p-3.5 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">
              T1 · High Risk
            </span>
          </div>
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {t1Count}
          </span>
          <span className="text-[10px] font-semibold text-red-700">
            {Math.round((t1Count / total) * 100)}%
          </span>
        </div>
        <span className="text-[10px] text-slate-500 block truncate">
          SRQ ≥ 11 (Sp.KJ/Psikolog)
        </span>
      </div>

      {/* 4. T2 Moderate Risk */}
      <div className="bg-white border border-amber-200 rounded-2xl p-3.5 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              T2 · Moderate
            </span>
          </div>
          <Activity className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {t2Count}
          </span>
          <span className="text-[10px] font-semibold text-amber-800">
            {Math.round((t2Count / total) * 100)}%
          </span>
        </div>
        <span className="text-[10px] text-slate-500 block truncate">
          SRQ 6–10 (Pendampingan)
        </span>
      </div>

      {/* 5. T3 Low Risk */}
      <div className="bg-white border border-emerald-200 rounded-2xl p-3.5 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              T3 · Low Risk
            </span>
          </div>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {t3Count}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700">
            {Math.round((t3Count / total) * 100)}%
          </span>
        </div>
        <span className="text-[10px] text-slate-500 block truncate">
          SRQ 0–5 (Stabil)
        </span>
      </div>

      {/* 6. Relawan Aktif */}
      <div className="bg-white border border-blue-200 rounded-2xl p-3.5 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
            Relawan Aktif
          </span>
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl sm:text-2xl font-black text-blue-900 font-mono">
            {activeVolunteersCount}
          </span>
          <span className="text-[10px] text-blue-700">Personel</span>
        </div>
        <span className="text-[10px] text-blue-600 block truncate">
          Penugasan Tersebar di Posko
        </span>
      </div>
    </div>
  );
};
