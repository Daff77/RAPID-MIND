import React, { useState } from 'react';
import { ShieldAlert, X, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { AssessmentRecord } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';

export const PriorityRedPanel: React.FC = () => {
  const { centralAssessments } = useAssessment();
  const [selected, setSelected] = useState<AssessmentRecord | null>(null);

  // Capture T0 and critical RED records
  const redRecords = centralAssessments
    .filter((r) => r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered) || r.zone === 'RED')
    .slice(0, 4);

  if (redRecords.length === 0) return null;

  return (
    <div className="bg-white border-l-4 border-l-red-600 border-y border-r border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">
            PERINGATAN DINI KASUS T0 · EMERGENSI KRITIS
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold border border-red-200">
            {redRecords.length} Kasus Aktif
          </span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">
          Prioritas koordinasi klinis dan konfirmasi rujukan PSC 119 / IGD RS
        </p>
      </div>

      {/* Scannable Case Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {redRecords.map((r) => {
          const victimDisplay = r.victimName ? `${r.victimName} (${r.victimId || r.id})` : (r.victimId || r.id);
          return (
            <div
              key={r.id}
              onClick={() => setSelected(r)}
              className="p-3 rounded-lg border border-red-100 bg-red-50/20 hover:bg-red-50/60 hover:border-red-300 transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono font-bold text-slate-900 text-xs truncate max-w-[150px]">
                    {victimDisplay}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white shrink-0">
                    T0
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{r.location}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{r.timestamp}</span>
                  </span>
                </div>

                {r.indicators && r.indicators.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.indicators.slice(0, 2).map((ind, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 truncate max-w-[140px]"
                      >
                        ✓ {ind}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-red-100/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 truncate max-w-[120px]">
                  {r.volunteerNotes || r.recommendedAction || 'Perlu validasi'}
                </span>
                <span className="text-red-700 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Tinjau</span>
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-5 space-y-3.5 shadow-xl">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-xs">
                    T0 EMERGENCY
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selected.victimId || selected.id}
                  </span>
                </div>
                {selected.victimName && (
                  <h4 className="text-sm font-semibold text-slate-800 mt-1">
                    {selected.victimName} {selected.victimAge ? `(${selected.victimAge} th)` : ''}
                  </h4>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{selected.location}</span>
                  <span>·</span>
                  <span>{selected.timestamp}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
                  Instruksi Penanganan Sistem:
                </span>
                <p className="text-red-900 font-semibold leading-relaxed">
                  {selected.recommendedAction}
                </p>
              </div>

              {selected.indicators && selected.indicators.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Indikator Red Flag Terdeteksi:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.indicators.map((ind, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md bg-red-50 border border-red-200 text-red-800 font-semibold text-xs"
                      >
                        ✓ {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selected.transcript && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Kutipan Suara Relawan (Speech-to-Text):
                  </span>
                  <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                    "{selected.transcript}"
                  </p>
                </div>
              )}

              {selected.volunteerNotes && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Catatan Relawan di Lapangan:
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {selected.volunteerNotes}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
