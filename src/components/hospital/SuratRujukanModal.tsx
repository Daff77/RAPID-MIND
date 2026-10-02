import React from 'react';
import { X, Printer } from 'lucide-react';
import { AssessmentRecord, TriageTier } from '../../types/assessment';

interface SuratRujukanModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AssessmentRecord | null;
  getRecordTier: (r: AssessmentRecord) => TriageTier;
  targetHospital?: string;
  selectedDiagnosis: string;
  onDiagnosisChange: (diag: string) => void;
}

export const SuratRujukanModal: React.FC<SuratRujukanModalProps> = ({
  isOpen,
  onClose,
  record,
  getRecordTier,
  targetHospital = 'RSUD Sayang Cianjur - IGD Psikiatri Terpadu',
  selectedDiagnosis,
  onDiagnosisChange,
}) => {
  if (!isOpen || !record) return null;

  const rmId = record.rmCode || record.recordId || record.id;
  const tier = getRecordTier(record);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header (Non-printable) */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-400/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Penerbitan Surat Rujukan Medis Darurat Bencana
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Format standar Kemenkes RI No. 001/2012 untuk rujukan darurat PSC 119 ke RSUD / RS Jiwa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-slate-800 flex-1 print:p-0 print:overflow-visible">
          <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 bg-white space-y-6 print:border-none print:p-0">
            {/* Kop Surat Resmi */}
            <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Pemerintah Daerah Provinsi Jawa Barat · Dinas Kesehatan
              </h2>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                Pusat Pelayanan Keselamatan Terpadu (PSC 119) & Posko Medis Terpadu Bencana
              </h1>
              <p className="text-[11px] text-slate-500">
                Sistem Penanggulangan Gawat Darurat Terpadu (SPGDT) · Layanan Darurat Medis & Kegawatdaruratan Psikiatri
              </p>
              <div className="pt-2 text-xs font-mono font-bold text-slate-600">
                SURAT RUJUKAN MEDIS GAWAT DARURAT KEJIWAAN · NO: 445/PSC-RM/{rmId.replace('RM-', '')}/X/2026
              </div>
            </div>
            {/* Bagian 1: Identitas Faskes Penerima */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Faskes / RS Rujukan Tujuan</span>
                <span className="font-bold text-slate-900 text-sm">{targetHospital}</span>
                <span className="text-[11px] text-slate-500 block">Unit: Instalasi Gawat Darurat (IGD) Psikiatri</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Waktu Evaluasi & Penerbitan</span>
                <span className="font-bold text-slate-900 text-sm">
                  {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {record.timestamp} WIB
                </span>
                <span className="text-[11px] text-slate-500 block">Status: Rujukan Segera / Fast Track</span>
              </div>
            </div>

            {/* Bagian 2: Identitas Pasien / Penyintas */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                I. Identitas Pasien / Penyintas
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Nama Lengkap</span>
                  <span className="font-bold text-slate-900 text-xs">{record.victimName || 'Penyintas Tanpa Nama'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">ID Rekam Medis (RM)</span>
                  <span className="font-bold text-slate-900 text-xs font-mono">{rmId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Usia / Jenis Kelamin</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {record.victimAge ? `${record.victimAge} Tahun` : '-'} / {record.victimGender === 'P' ? 'Perempuan' : 'Laki-laki'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Posko Pengungsian</span>
                  <span className="font-bold text-slate-900 text-xs">{record.location}</span>
                </div>
              </div>
            </div>

            {/* Bagian 3: Temuan Skrining & Red Flags */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                II. Hasil Penapisan & Indikator Kritis Lapangan (RAPID-MIND)
              </h4>
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tingkat Triase</span>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-md text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                      {tier} · {tier === 'T0' ? 'Darurat Kritis' : 'Risiko Tinggi'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Skor Skrining SRQ-20</span>
                    <span className="font-bold text-slate-900 text-xs">{record.score ?? 14} / 20 (Ambang Batas &ge; 6)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Metode Asesmen</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {record.method} ({record.volunteerId ? `Relawan #${record.volunteerId}` : 'Relawan Posko'})
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Keluhan / Transkrip Posko Lapangan</span>
                  <p className="text-slate-700 italic text-[11px] mt-0.5 bg-white p-2 rounded-lg border border-slate-200">
                    "{record.transcript || 'Penyintas mengalami agitasi pascatrauma, distres akut berat, dan memerlukan stabilisasi kejiwaan komprehensif.'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Bagian 4: Diagnosis Kerja Klinis (ICD-10) */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                III. Diagnosis Kerja Klinis & Indikasi Rujukan
              </h4>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Diagnosis Kerja Klinis (Klasifikasi ICD-10):
                  </label>
                  <select
                    value={selectedDiagnosis}
                    onChange={(e) => onDiagnosisChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none print:appearance-none print:border-none print:p-0"
                  >
                    <option value="F43.0 Reaksi Stres Akut Berat dengan Agitasi (Acute Stress Reaction)">
                      F43.0 Reaksi Stres Akut Berat dengan Agitasi (Acute Stress Reaction)
                    </option>
                    <option value="F23 Gangguan Psikotik Polimorfik Akut Pascatrauma">
                      F23 Gangguan Psikotik Polimorfik Akut Pascatrauma
                    </option>
                    <option value="F32.3 Episode Depresi Berat dengan Gejala Psikotik & Ide Suisida">
                      F32.3 Episode Depresi Berat dengan Gejala Psikotik & Ide Suisida
                    </option>
                    <option value="F43.1 Gangguan Stres Pascatrauma (PTSD) Eksaserbasi Akut">
                      F43.1 Gangguan Stres Pascatrauma (PTSD) Eksaserbasi Akut
                    </option>
                    <option value="F10.0 Intoksikasi Akut / Sindrom Putus Zat Terkait Bencana">
                      F10.0 Intoksikasi Akut / Sindrom Putus Zat Terkait Bencana
                    </option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Alasan & Indikasi Rujukan Medis:</span>
                  <p className="text-[11px] text-slate-700 mt-0.5">
                    Memerlukan evaluasi psikiatri lanjutan, stabilisasi farmakologis darurat, serta intervensi krisis intensif yang tidak dapat diakomodasi pada posko penampungan lapangan.
                  </p>
                </div>
              </div>
            </div>

            {/* Bagian 5: Tanda Tangan & Pengesahan DPJP */}
            <div className="pt-4 flex items-end justify-between border-t border-slate-200">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Catatan Penanganan Transportasi:</p>
                <p className="text-[11px] text-slate-600 max-w-sm">
                  Pasien dievakuasi menggunakan ambulans PSC 119 dengan pengawasan ketat tanda vital dan pendamping medis bersertifikasi BLS/BCLS.
                </p>
              </div>
              <div className="text-center min-w-[200px] space-y-1">
                <p className="text-[11px] text-slate-500">Cianjur, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="text-[11px] font-bold text-slate-800">Dokter Penanggung Jawab Pelayanan (DPJP)</p>
                <div className="h-14 flex items-center justify-center">
                  <span className="font-serif italic text-base text-blue-900 border-b border-dashed border-slate-400 px-4">
                    dr. Budi Santoso, Sp.KJ
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">SIP: 446.1/1092/Dinkes/2024</p>
              </div>
            </div>
          </div>

          {/* Modal Footer (Non-printable) */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between print:hidden">
            <span className="text-xs text-slate-500">
              Format dokumen rujukan resmi sesuai regulasi Kemenkes RI No. 001 Tahun 2012.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Surat Rujukan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
