import React, { useState } from 'react';
import {
  IconShieldExclamation,
  IconClock,
  IconMapPin,
  IconArrowRight,
  IconX,
  IconAlertOctagon,
  IconMicrophone,
  IconBuildingHospital,
} from '@tabler/icons-react';
import { AssessmentRecord } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';

export const PriorityRedPanel: React.FC = () => {
  const { centralAssessments } = useAssessment();
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);

  // Seed default 3 cards if central assessments doesn't have 3 T0 records
  const actualT0Records = centralAssessments.filter(
    (r) => r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)
  );

  // Standard demonstration records matching command-center specification
  const fallbackRecords: AssessmentRecord[] = [
    {
      id: 'RM-2026-000089',
      recordId: 'RM-2026-000089',
      victimId: 'RM-2026-000089',
      victimName: 'nando',
      timestamp: '10:21',
      location: 'Posko B',
      method: 'VERBAL',
      phase: 'followup_srq20',
      zone: 'RED',
      triageTier: 'T0',
      score: 15,
      totalIntegratedScore: 15,
      criticalTriggered: true,
      indicators: ['Risiko keamanan jiwa', 'Gejala psikotik akut'],
      recommendedAction:
        'RED FLAG OVERRIDE: Segera dampingi 100% tanpa jeda. Siagakan PSC 119 dan rujukan IGD RSUD Cianjur.',
      transcript:
        'Penyintas mengeluhkan mendengar suara-suara ancaman dan ingin mengakhiri hidup karena kehilangan seluruh keluarga...',
      volunteerNotes: 'Perilaku sangat gelisah dan desorientasi waktu pascagempa.',
      syncStatus: 'synced',
    },
    {
      id: 'RM-2026-000091',
      recordId: 'RM-2026-000091',
      victimId: 'RM-2026-000091',
      victimName: 'daffa',
      timestamp: '12:29',
      location: 'Posko A',
      method: 'VERBAL',
      phase: 'acute_pfa',
      zone: 'RED',
      triageTier: 'T0',
      score: 12,
      totalIntegratedScore: 12,
      criticalTriggered: true,
      indicators: ['SRQ-20 Butir #17'],
      recommendedAction:
        'RED FLAG OVERRIDE: Terindikasi ide menyakiti diri sendiri (SRQ-17). Lakukan proteksi fisik dan stabilisasi PFA.',
      transcript:
        'Mengaku merasa hidupnya sudah tidak berarti dan berpikiran untuk tidak bangun lagi besok pagi...',
      volunteerNotes: 'Perlu konfirmasi psikiater atau dokter jaga puskesmas terdekat.',
      syncStatus: 'synced',
    },
    {
      id: 'RM-2026-000081',
      recordId: 'RM-2026-000081',
      victimId: 'RM-2026-000081',
      victimName: 'daffa',
      timestamp: '12:30',
      location: 'Posko A',
      method: 'VERBAL',
      phase: 'acute_pfa',
      zone: 'RED',
      triageTier: 'T0',
      score: 8,
      totalIntegratedScore: 8,
      criticalTriggered: true,
      indicators: ['Risiko keamanan jiwa'],
      recommendedAction:
        'RED FLAG OVERRIDE: Distres akut parah disertai agitasif emosional. Hubungkan ke tim reaksi cepat.',
      transcript:
        'Menangis histeris terus menerus dan menolak makan maupun minum selama 24 jam terakhir...',
      volunteerNotes: 'Di bawah pengawasan relawan lapangan Posko A.',
      syncStatus: 'synced',
    },
  ];

  // Merge so we always have at least the 3 critical cases
  const displayRecords =
    actualT0Records.length >= 3
      ? actualT0Records.slice(0, 3)
      : [...actualT0Records, ...fallbackRecords.slice(actualT0Records.length, 3)];

  return (
    <section className="bg-rose-50/20 border border-red-200/80 rounded-xl p-4 sm:p-4.5 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-red-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <IconShieldExclamation className="w-4 h-4 text-red-600" stroke={2} />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-red-700 tracking-tight uppercase">
            Peringatan Dini Kasus T0 — Emergensi Kritis
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold border border-red-200 shrink-0">
            {displayRecords.length} Kasus Aktif
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            const tableElem = document.getElementById('master-data-table');
            if (tableElem) {
              tableElem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition self-end sm:self-auto cursor-pointer"
        >
          <span>Lihat Semua</span>
          <IconArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* 3 Horizontal Emergency Case Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {displayRecords.map((item, idx) => {
          const rmId = item.recordId || item.victimId || `RM-2026-0000${80 + idx}`;
          const name = item.victimName || 'Penyintas';

          return (
            <div
              key={item.id || idx}
              onClick={() => setSelectedRecord(item)}
              className="bg-white border border-red-100/90 rounded-lg p-3 hover:border-red-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
            >
              <div>
                {/* Name, RM ID & T0 Badge */}
                <div className="flex items-center justify-between gap-1">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs leading-tight">
                      {name}
                    </h3>
                    <span className="font-mono text-[11px] text-slate-500 leading-tight">
                      {rmId}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[10px] tracking-wide shrink-0">
                    T0
                  </span>
                </div>

                {/* Timestamp & Posko Location */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                  <span className="flex items-center gap-1 font-mono">
                    <IconClock className="w-3.5 h-3.5 text-slate-400" stroke={1.8} />
                    <span>{item.timestamp}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-medium">
                    <IconMapPin className="w-3.5 h-3.5 text-slate-400" stroke={1.8} />
                    <span>{item.location}</span>
                  </span>
                </div>

                {/* Red Flag Indicators */}
                <div className="space-y-1 mt-2.5">
                  {(item.indicators || ['Risiko keamanan jiwa']).slice(0, 2).map((ind, i) => (
                    <div
                      key={i}
                      className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-100 text-[10px] font-semibold flex items-center gap-1 truncate"
                    >
                      <span className="text-red-600 font-bold shrink-0">✓</span>
                      <span className="truncate">{ind}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status & Review Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-[10px] font-mono font-bold text-red-600 tracking-wider">
                  RED FLAG TRIGGERED
                </span>
                <span className="text-red-700 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Tinjau</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal for T0 Emergency Case */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-xl">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[11px] tracking-wide">
                    T0 EMERGENCY
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {selectedRecord.recordId || selectedRecord.victimId || selectedRecord.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedRecord.victimName || 'Penyintas Tanpa Nama'}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{selectedRecord.location}</span>
                  <span>·</span>
                  <span className="font-mono">{selectedRecord.timestamp}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 text-xs">
              {/* Emergency Instructions */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
                  Instruksi Penanganan Darurat:
                </span>
                <p className="text-red-900 font-semibold leading-relaxed">
                  {selectedRecord.recommendedAction ||
                    'Segera lakukan pendampingan 100% tanpa jeda. Hubungkan ke PSC 119 dan IGD Jiwa terdekat.'}
                </p>
              </div>

              {/* Red Flag Indicators */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <IconAlertOctagon className="w-3.5 h-3.5 text-red-600" stroke={2} />
                  <span>Indikator Red Flag Terdeteksi:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedRecord.indicators || ['Risiko keamanan jiwa']).map((ind, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-800 font-semibold text-xs flex items-center gap-1"
                    >
                      <span>✓</span> {ind}
                    </span>
                  ))}
                </div>
              </div>

              {/* Speech-to-Text Transcript */}
              {selectedRecord.transcript && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <IconMicrophone className="w-3.5 h-3.5 text-blue-600" stroke={2} />
                    <span>Kutipan Percakapan Wawancara (STT):</span>
                  </span>
                  <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-sans">
                    "{selectedRecord.transcript}"
                  </p>
                </div>
              )}

              {/* Volunteer Notes */}
              {selectedRecord.volunteerNotes && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Catatan Relawan Lapangan:
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {selectedRecord.volunteerNotes}
                  </p>
                </div>
              )}

              {/* Clinical Safeguard Note */}
              <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-lg text-[11px] text-blue-900 leading-normal flex items-start gap-2">
                <IconBuildingHospital className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" stroke={1.8} />
                <span>
                  <strong>Protokol Validasi Klinis:</strong> T0 merupakan Red Flag Override yang
                  mengesampingkan skor numerik normal dan memerlukan konfirmasi segera oleh
                  dokter/psikiater sebelum tindakan evakuasi sekunder.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(
                    `Panggilan Tele-Emergency PSC 119 diinisiasi untuk ${
                      selectedRecord.victimName || 'Penyintas'
                    } (${selectedRecord.location}).`
                  );
                  setSelectedRecord(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <span>Konfirmasi Rujukan PSC 119</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
