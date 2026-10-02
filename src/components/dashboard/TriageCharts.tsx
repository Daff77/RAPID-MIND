import React, { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAssessment } from '../../context/AssessmentContext';
import {
  IconChartDonut,
  IconChartBar,
  IconChartLine,
  IconChevronDown,
} from '@tabler/icons-react';

// Custom Tooltip for Donut
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomDonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm text-xs space-y-0.5 z-50">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
          <span>{data.name}</span>
        </div>
        <div className="text-slate-600 font-mono text-[11px]">
          {data.value} Kasus ({data.pct}%)
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Stacked Bar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm text-xs space-y-1 z-50">
        <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">
          {label}
        </span>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Line Chart
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm text-xs space-y-1 z-50">
        <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">
          {label}
        </span>
        {payload.map((entry: any, index: number) => (
          <div key={`line-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const TriageCharts: React.FC = () => {
  const { centralAssessments, kpiStats } = useAssessment();
  const [periodFilter, setPeriodFilter] = useState('Hari Ini');
  const [sectorFilter, setSectorFilter] = useState('4 Sektor Operasional');
  const [trendPoskoFilter, setTrendPoskoFilter] = useState('Semua Posko');

  const total = kpiStats?.total || 9;
  const t0 = kpiStats?.t0Count !== undefined ? kpiStats.t0Count : 1;
  const t1 = kpiStats?.t1Count !== undefined ? kpiStats.t1Count : 0;
  const t2 = kpiStats?.t2Count !== undefined ? kpiStats.t2Count : 4;
  const t3 = kpiStats?.t3Count !== undefined ? kpiStats.t3Count : 4;

  // 1. Donut Data
  const donutData = useMemo(() => {
    return [
      {
        name: 'T0 — Emergency',
        value: t0,
        color: '#DC2626',
        pct: Math.round((t0 / total) * 100),
      },
      {
        name: 'T1 — High Risk',
        value: t1,
        color: '#EA580C',
        pct: Math.round((t1 / total) * 100),
      },
      {
        name: 'T2 — Moderate',
        value: t2,
        color: '#EAB308',
        pct: Math.round((t2 / total) * 100),
      },
      {
        name: 'T3 — Low Risk',
        value: t3,
        color: '#16A34A',
        pct: Math.round((t3 / total) * 100),
      },
    ];
  }, [t0, t1, t2, t3, total]);

  // 2. Stacked Bar Data (Posko A: 15, Posko B: 1, Posko C: 0, Posko D: 5)
  const barData = useMemo(() => {
    return [
      {
        name: 'Posko A',
        T3: 2,
        T2: 3,
        T1: 8,
        T0: 2,
        total: 15,
      },
      {
        name: 'Posko B',
        T3: 0,
        T2: 0,
        T1: 0,
        T0: 1,
        total: 1,
      },
      {
        name: 'Posko C',
        T3: 0,
        T2: 0,
        T1: 0,
        T0: 0,
        total: 0,
      },
      {
        name: 'Posko D',
        T3: 2,
        T2: 3,
        T1: 0,
        T0: 0,
        total: 5,
      },
    ];
  }, []);

  // 3. 30-Day Trend Data across Oct 1, Oct 8, Oct 15, Oct 22, Oct 30
  const trendData = useMemo(() => {
    return [
      { date: '1 Okt', T0: 16, T1: 10, T2: 6, T3: 4 },
      { date: '8 Okt', T0: 22, T1: 14, T2: 9, T3: 8 },
      { date: '15 Okt', T0: 20, T1: 12, T2: 8, T3: 7 },
      { date: '22 Okt', T0: 25, T1: 17, T2: 10, T3: 8 },
      { date: '30 Okt', T0: 24, T1: 16, T2: 11, T3: 7 },
    ];
  }, []);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* =========================================================================
          PANEL 1: Distribusi Tingkat Triase
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-4.5 shadow-2xs flex flex-col justify-between space-y-3">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center text-blue-600">
              <IconChartDonut className="w-3.5 h-3.5 text-blue-600" stroke={2} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Distribusi Tingkat Triase
            </h3>
          </div>

          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer">
            <span>{periodFilter}</span>
            <IconChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Donut & Side Legend */}
        <div className="flex items-center justify-between gap-2 my-auto">
          {/* Donut Chart with Centered Number */}
          <div className="w-40 h-40 sm:w-44 sm:h-44 relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#ffffff"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`donut-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomDonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight leading-none">
                {total}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                Penyintas
              </span>
            </div>
          </div>

          {/* Clean Legend matching screenshot */}
          <div className="flex-1 space-y-2 text-xs">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 font-medium truncate">{item.name}</span>
                </div>
                <div className="font-mono text-slate-900 font-bold shrink-0 ml-2">
                  {item.value}{' '}
                  <span className="text-slate-400 font-normal text-[10px]">({item.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          PANEL 2: Beban Kasus per Posko Bencana
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-4.5 shadow-2xs flex flex-col justify-between space-y-2">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center text-blue-600">
              <IconChartBar className="w-3.5 h-3.5 text-blue-600" stroke={2} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Beban Kasus per Posko Bencana
            </h3>
          </div>

          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer">
            <span>{sectorFilter}</span>
            <IconChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Legend dots */}
        <div className="flex items-center justify-end gap-3 text-[10px] text-slate-600 font-medium pt-0.5">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600" /> T0
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> T1
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> T2
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> T3
          </span>
        </div>

        {/* Stacked Bar Chart */}
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 18, right: 10, left: -26, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 16]}
                ticks={[0, 4, 8, 12, 16]}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="T3" stackId="a" fill="#16A34A" />
              <Bar dataKey="T2" stackId="a" fill="#EAB308" />
              <Bar dataKey="T1" stackId="a" fill="#EA580C" />
              <Bar dataKey="T0" stackId="a" fill="#DC2626" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* =========================================================================
          PANEL 3: Tren Kasus 30 Hari
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-4.5 shadow-2xs flex flex-col justify-between space-y-2">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center text-blue-600">
              <IconChartLine className="w-3.5 h-3.5 text-blue-600" stroke={2} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Tren Kasus 30 Hari
            </h3>
          </div>

          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer">
            <span>{trendPoskoFilter}</span>
            <IconChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Legend dots */}
        <div className="flex items-center justify-end gap-3 text-[10px] text-slate-600 font-medium pt-0.5">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600" /> T0
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> T1
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> T2
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> T3
          </span>
        </div>

        {/* Multi-line Trend Chart */}
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 12, right: 10, left: -26, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 30]}
                ticks={[0, 10, 20, 30]}
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="T0"
                stroke="#DC2626"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#DC2626' }}
              />
              <Line
                type="monotone"
                dataKey="T1"
                stroke="#EA580C"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#EA580C' }}
              />
              <Line
                type="monotone"
                dataKey="T2"
                stroke="#EAB308"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#EAB308' }}
              />
              <Line
                type="monotone"
                dataKey="T3"
                stroke="#16A34A"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#16A34A' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
