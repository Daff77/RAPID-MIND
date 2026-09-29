import React from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, AlertTriangle, Activity, CheckCircle, Users, UserCheck } from 'lucide-react';

export const KPICards: React.FC = () => {
  const { centralAssessments, kpiStats } = useAssessment();
  const { allUsers } = useAuth();

  const totalSurvivors = kpiStats.total;
  const totalAssessments = kpiStats.totalAssessments || centralAssessments.length;
  const t0Count = kpiStats.t0Count;
  const t1Count = kpiStats.t1Count;
  const t2Count = kpiStats.t2Count;
  const t3Count = kpiStats.t3Count;
  const total = totalSurvivors || 1;
  const activeVolunteersCount = allUsers.filter((u) => u.role === 'volunteer').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Penyintas */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Penyintas
          </span>
          <Users className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="my-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {totalSurvivors.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] font-medium text-slate-400">Jiwa</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 truncate block">
          {totalAssessments} rekam skrining aktif
        </span>
      </div>

      {/* 2. T0 Emergency */}
      <div className="bg-white border-l-4 border-l-red-600 border-y border-r border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
              T0 · Emergency
            </span>
          </div>
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
        </div>
        <div className="my-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-red-600 font-mono tracking-tight">
              {t0Count}
            </span>
            <span className="text-[11px] font-bold text-red-600">
              ({Math.round((t0Count / total) * 100)}%)
            </span>
          </div>
        </div>
        <span className="text-[11px] text-slate-600 font-medium truncate block">
          Siaga PSC 119 & IGD Jiwa
        </span>
      </div>

      {/* 3. T1 High Risk */}
      <div className="bg-white border-l-4 border-l-orange-500 border-y border-r border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">
              T1 · High Risk
            </span>
          </div>
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
        </div>
        <div className="my-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {t1Count}
            </span>
            <span className="text-[11px] font-semibold text-orange-700">
              ({Math.round((t1Count / total) * 100)}%)
            </span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 truncate block">
          SRQ ≥ 11 · Rujuk Sp.KJ
        </span>
      </div>

      {/* 4. T2 Moderate Risk */}
      <div className="bg-white border-l-4 border-l-amber-500 border-y border-r border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              T2 · Moderate
            </span>
          </div>
          <Activity className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="my-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {t2Count}
            </span>
            <span className="text-[11px] font-semibold text-amber-800">
              ({Math.round((t2Count / total) * 100)}%)
            </span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 truncate block">
          SRQ 6–10 · Pendampingan PFA
        </span>
      </div>

      {/* 5. T3 Low Risk */}
      <div className="bg-white border-l-4 border-l-emerald-600 border-y border-r border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              T3 · Low Risk
            </span>
          </div>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="my-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {t3Count}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">
              ({Math.round((t3Count / total) * 100)}%)
            </span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 truncate block">
          SRQ 0–5 · Komunitas/Stabil
        </span>
      </div>

      {/* 6. Relawan Aktif */}
      <div className="bg-white border-l-4 border-l-blue-600 border-y border-r border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
            Relawan Aktif
          </span>
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="my-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-900 font-mono tracking-tight">
              {activeVolunteersCount}
            </span>
            <span className="text-[11px] font-medium text-blue-700">Personel</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 truncate block">
          Tersebar di 4 Posko Bencana
        </span>
      </div>
    </div>
  );
};
