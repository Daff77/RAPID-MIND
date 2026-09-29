import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAssessment } from '../../context/AssessmentContext';
import { LocationPost } from '../../types/assessment';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';

// Tooltips declared outside render to prevent re-creation during render (resolves ESLint react/static-components)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-md text-xs space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-slate-900">{data.name}</span>
        </div>
        <div className="text-slate-600 font-mono text-[11px]">
          {data.value} Kasus ({data.pct}%)
        </div>
      </div>
    );
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-md text-xs space-y-1">
        <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">{label}</span>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
            <span style={{ color: entry.color }} className="font-semibold">
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-slate-800">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const TriageCharts: React.FC = () => {
  const { centralAssessments, kpiStats } = useAssessment();

  const total = kpiStats.total || 1;

  // 4-Tier Triage Distribution
  const pieData = useMemo(() => {
    return [
      {
        name: 'T0 · Emergency',
        value: kpiStats.t0Count,
        color: '#DC2626',
        pct: Math.round((kpiStats.t0Count / total) * 100),
      },
      {
        name: 'T1 · High Risk',
        value: kpiStats.t1Count,
        color: '#EA580C',
        pct: Math.round((kpiStats.t1Count / total) * 100),
      },
      {
        name: 'T2 · Moderate',
        value: kpiStats.t2Count,
        color: '#EAB308',
        pct: Math.round((kpiStats.t2Count / total) * 100),
      },
      {
        name: 'T3 · Low Risk',
        value: kpiStats.t3Count,
        color: '#16A34A',
        pct: Math.round((kpiStats.t3Count / total) * 100),
      },
    ];
  }, [kpiStats, total]);

  // Breakdown by Response Post (Posko A, B, C, D)
  const locationBarData = useMemo(() => {
    const locations: LocationPost[] = ['Posko A', 'Posko B', 'Posko C', 'Posko D'];
    return locations.map((loc) => {
      const recordsAtLoc = centralAssessments.filter((r) => r.location === loc);
      return {
        name: loc,
        'T3 Low': recordsAtLoc.filter((r) => r.triageTier === 'T3' || r.zone === 'GREEN').length,
        'T2 Moderate': recordsAtLoc.filter((r) => r.triageTier === 'T2' || r.zone === 'YELLOW').length,
        'T1 High': recordsAtLoc.filter(
          (r) => r.triageTier === 'T1' || (r.zone === 'RED' && !r.criticalTriggered)
        ).length,
        'T0 Emergency': recordsAtLoc.filter(
          (r) => r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)
        ).length,
      };
    });
  }, [centralAssessments]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Donut Chart - Triage Distribution (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PieIcon className="w-3.5 h-3.5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Distribusi Tingkat Triase
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 font-semibold">
            {kpiStats.total} Jiwa
          </span>
        </div>

        <div className="h-52 relative my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={78}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-slate-900 font-mono tracking-tight">{kpiStats.total}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Penyintas</span>
          </div>
        </div>

        {/* 4-Tier Scannable Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-2.5 border-t border-slate-100">
          <div className="p-1 rounded bg-red-50/50 border border-red-100">
            <span className="text-[10px] text-red-700 font-bold block">T0 · Emergens</span>
            <span className="font-mono font-black text-red-700 text-xs">
              {kpiStats.t0Count} <span className="font-normal text-[10px]">({Math.round((kpiStats.t0Count / total) * 100)}%)</span>
            </span>
          </div>
          <div className="p-1 rounded bg-orange-50/50 border border-orange-100">
            <span className="text-[10px] text-orange-700 font-bold block">T1 · High</span>
            <span className="font-mono font-black text-orange-700 text-xs">
              {kpiStats.t1Count} <span className="font-normal text-[10px]">({Math.round((kpiStats.t1Count / total) * 100)}%)</span>
            </span>
          </div>
          <div className="p-1 rounded bg-amber-50/50 border border-amber-100">
            <span className="text-[10px] text-amber-800 font-bold block">T2 · Moderate</span>
            <span className="font-mono font-black text-amber-800 text-xs">
              {kpiStats.t2Count} <span className="font-normal text-[10px]">({Math.round((kpiStats.t2Count / total) * 100)}%)</span>
            </span>
          </div>
          <div className="p-1 rounded bg-emerald-50/50 border border-emerald-100">
            <span className="text-[10px] text-emerald-700 font-bold block">T3 · Low</span>
            <span className="font-mono font-black text-emerald-700 text-xs">
              {kpiStats.t3Count} <span className="font-normal text-[10px]">({Math.round((kpiStats.t3Count / total) * 100)}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Stacked Bar Chart - Cases by Response Post (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Beban Kasus per Posko Bencana
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            4 Sektor Operasional
          </span>
        </div>

        <div className="h-56 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={locationBarData}
              margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} iconType="circle" />
              <Bar dataKey="T3 Low" stackId="a" fill="#16A34A" />
              <Bar dataKey="T2 Moderate" stackId="a" fill="#EAB308" />
              <Bar dataKey="T1 High" stackId="a" fill="#EA580C" />
              <Bar dataKey="T0 Emergency" stackId="a" fill="#DC2626" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
