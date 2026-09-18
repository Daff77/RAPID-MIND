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

export const TriageCharts: React.FC = () => {
  const { centralAssessments, kpiStats } = useAssessment();

  const pieData = useMemo(() => {
    return [
      { name: 'Green', value: kpiStats.green, color: '#16A34A', pct: kpiStats.greenPct },
      { name: 'Yellow', value: kpiStats.yellow, color: '#EAB308', pct: kpiStats.yellowPct },
      { name: 'Red', value: kpiStats.red, color: '#DC2626', pct: kpiStats.redPct },
    ];
  }, [kpiStats]);

  const locationBarData = useMemo(() => {
    const locations: LocationPost[] = ['Posko A', 'Posko B', 'Posko C', 'Posko D'];
    return locations.map((loc) => {
      const recordsAtLoc = centralAssessments.filter((r) => r.location === loc);
      return {
        name: loc,
        Green: recordsAtLoc.filter((r) => r.zone === 'GREEN').length,
        Yellow: recordsAtLoc.filter((r) => r.zone === 'YELLOW').length,
        Red: recordsAtLoc.filter((r) => r.zone === 'RED').length,
      };
    });
  }, [centralAssessments]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-md text-xs">
          <span className="font-bold text-slate-900 block">{data.name}</span>
          <span className="text-slate-600 font-mono">{data.value} cases ({data.pct}%)</span>
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-md text-xs space-y-0.5">
          <span className="font-bold text-slate-900 block border-b border-slate-100 pb-0.5">{label}</span>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex justify-between gap-2">
              <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
              <span className="font-mono font-bold text-slate-800">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Donut Chart - Triage Breakdown (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Triage Distribution
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {kpiStats.total} total
          </span>
        </div>

        <div className="h-48 relative my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
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
            <span className="text-lg font-black text-slate-900 font-mono">{kpiStats.total}</span>
            <span className="text-[9px] uppercase font-bold text-slate-400">Total</span>
          </div>
        </div>

        {/* Concise Legend */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-2 border-t border-slate-100">
          <div className="text-emerald-700 font-bold">
            🟢 {kpiStats.green} <span className="text-[10px] text-slate-400 font-normal">({kpiStats.greenPct}%)</span>
          </div>
          <div className="text-amber-700 font-bold">
            🟡 {kpiStats.yellow} <span className="text-[10px] text-slate-400 font-normal">({kpiStats.yellowPct}%)</span>
          </div>
          <div className="text-red-700 font-bold">
            🔴 {kpiStats.red} <span className="text-[10px] text-slate-400 font-normal">({kpiStats.redPct}%)</span>
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart - Cases by Location (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Cases by Response Post
          </h3>
        </div>

        <div className="h-56 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={locationBarData}
              margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} iconType="circle" />
              <Bar dataKey="Green" stackId="a" fill="#16A34A" />
              <Bar dataKey="Yellow" stackId="a" fill="#EAB308" />
              <Bar dataKey="Red" stackId="a" fill="#DC2626" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
