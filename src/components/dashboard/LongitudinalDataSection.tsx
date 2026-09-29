import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { getStoredSurvivors } from '../../data/mockSurvivors';
import { AssessmentRecord, LocationPost, TriageTier } from '../../types/assessment';

export const LongitudinalDataSection: React.FC = () => {
  const { centralAssessments } = useAssessment();
  const storedSurvivors = useMemo(() => getStoredSurvivors(), []);

  const [search, setSearch] = useState('');
  const [filterPosko, setFilterPosko] = useState<'ALL' | LocationPost>('ALL');
  const [expandedSurvivorId, setExpandedSurvivorId] = useState<string | null>(null);

  // Group assessments by NIK or survivor ID
  const groupedData = useMemo(() => {
    // Map of survivor ID or NIK -> list of assessments
    const map = new Map<string, {
      profile: {
        id: string;
        nik: string;
        name: string;
        age?: number | string;
        gender?: 'L' | 'P';
        posko: string;
        category?: string;
      };
      records: AssessmentRecord[];
      pfaCompletedAt?: string;
      pfaNotes?: string;
    }>();

    // First populate from registered survivors
    storedSurvivors.forEach((s) => {
      map.set(s.id, {
        profile: {
          id: s.id,
          nik: s.nik || 'NIK Belum Terdata',
          name: s.name,
          age: s.age,
          gender: s.gender,
          posko: s.posko,
          category: s.category,
        },
        records: [],
        pfaCompletedAt: s.pfaRecord?.completedAt,
        pfaNotes: s.pfaRecord?.listenNotes,
      });
    });

    // Then group central assessments
    centralAssessments.forEach((r) => {
      const key = r.victimId || r.id || 'UNKNOWN';
      const existing = map.get(key);

      if (existing) {
        // Prevent duplicate assessment entry by recordId
        const isDuplicate = existing.records.some((rec) =>
          rec.recordId && r.recordId ? rec.recordId === r.recordId : false
        );
        if (!isDuplicate) {
          existing.records.push(r);
        }
      } else {
        map.set(key, {
          profile: {
            id: key,
            nik: r.nik || 'NIK Belum Terdata',
            name: r.victimName || `Penyintas ${key}`,
            age: r.victimAge,
            gender: r.victimGender,
            posko: r.location,
            category: r.victimCategory,
          },
          records: [r],
        });
      }
    });

    return Array.from(map.values());
  }, [centralAssessments, storedSurvivors]);

  const filtered = useMemo(() => {
    return groupedData.filter((item) => {
      const matchesSearch =
        item.profile.name.toLowerCase().includes(search.toLowerCase()) ||
        item.profile.id.toLowerCase().includes(search.toLowerCase()) ||
        (item.profile.nik ? item.profile.nik.toLowerCase().includes(search.toLowerCase()) : false) ||
        item.profile.posko.toLowerCase().includes(search.toLowerCase());

      const matchesPosko = filterPosko === 'ALL' || item.profile.posko === filterPosko;

      return matchesSearch && matchesPosko;
    });
  }, [groupedData, search, filterPosko]);

  const renderTierBadge = (tier: TriageTier) => {
    switch (tier) {
      case 'T0':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
            🚨 T0 Emergency
          </span>
        );
      case 'T1':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            T1 High Risk
          </span>
        );
      case 'T2':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            T2 Moderate
          </span>
        );
      case 'T3':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            T3 Low Risk
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Data Longitudinal Penapisan Kesehatan Mental (Hari 1 – 30)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan lintasan pemulihan psikologis penyintas dari intervensi PFA fase akut hingga skrining berkala SRQ-20.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">
              Total Terpantau: <strong className="text-slate-900">{filtered.length} Penyintas</strong>
            </span>
          </div>
        </div>

        {/* Search & Posko Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama penyintas, NIK, atau ID..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={filterPosko}
            onChange={(e) => setFilterPosko(e.target.value as 'ALL' | LocationPost)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition"
          >
            <option value="ALL">Semua Posko</option>
            <option value="Posko A">Posko A</option>
            <option value="Posko B">Posko B</option>
            <option value="Posko C">Posko C</option>
            <option value="Posko D">Posko D</option>
          </select>
        </div>
      </div>

      {/* Survivor Longitudinal Cards List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item) => {
          const isExpanded = expandedSurvivorId === item.profile.id;

          // Determine current highest/latest risk
          const latestRecord = item.records[0];
          const currentTier: TriageTier = latestRecord?.triageTier || (latestRecord?.zone === 'RED' ? 'T1' : latestRecord?.zone === 'YELLOW' ? 'T2' : 'T3');

          return (
            <div
              key={item.profile.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 transition hover:border-slate-300"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {item.profile.id.replace('VCT-', '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {item.profile.name}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({item.profile.nik})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {item.profile.posko}
                      </span>
                      <span>·</span>
                      <span>{item.profile.age ? `${item.profile.age} th` : '-'}</span>
                      <span>·</span>
                      <span>{item.profile.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Status Terkini
                    </span>
                    {renderTierBadge(currentTier)}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedSurvivorId(isExpanded ? null : item.profile.id)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 ml-1 transition"
                    title={isExpanded ? 'Tutup riwayat' : 'Buka riwayat timeline'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Trajectory Timeline Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {item.pfaCompletedAt && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Fase Akut: PFA Look-Listen-Link
                      </span>
                      <span className="font-mono text-[10px]">{item.pfaCompletedAt}</span>
                    </div>
                    {item.pfaNotes && (
                      <p className="text-[11px] text-slate-700 italic truncate">
                        "{item.pfaNotes}"
                      </p>
                    )}
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold flex items-center gap-1">
                      <Activity className="w-3 h-3 text-blue-600" />
                      Fase Lanjutan: SRQ-20 & Follow-up
                    </span>
                    <span className="font-mono text-[10px]">
                      {item.records.length} Asesmen Tersimpan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    {latestRecord?.recommendedAction || 'Siap untuk pemantauan kesehatan jiwa berkala.'}
                  </p>
                </div>
              </div>

              {/* Expanded Detailed Records Timeline */}
              {isExpanded && (
                <div className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Riwayat Penapisan Lengkap ({item.records.length}):
                  </span>

                  {item.records.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {item.records.map((rec, rIdx) => (
                        <div key={rec.recordId || (rec.id + '-' + rIdx)} className="p-3 text-xs bg-white space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {rec.recordId && (
                                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                  {rec.recordId}
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-slate-500">
                                {rec.timestamp}
                              </span>
                              <span className="font-semibold text-slate-800">
                                {rec.phase === 'acute_pfa' ? 'Intervensi PFA' : 'Wawancara SRQ-20'} ({rec.method})
                              </span>
                            </div>
                            {renderTierBadge(rec.triageTier || (rec.zone === 'RED' ? 'T1' : rec.zone === 'YELLOW' ? 'T2' : 'T3'))}
                          </div>

                          <div className="text-[11px] text-slate-600">
                            <strong>Gejala / Indikator:</strong> {rec.indicators.join(', ') || '-'}
                          </div>

                          {rec.transcript && (
                            <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              Transkrip: "{rec.transcript}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 text-slate-400 text-xs text-center rounded-xl">
                      Belum ada sesi wawancara lanjutan SRQ-20 yang dicatat untuk penyintas ini.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
          Belum ada rekam jejak penyintas yang tercatat.
        </div>
      )}
      </div>
    </div>
  );
};
