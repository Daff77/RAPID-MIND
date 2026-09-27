import React, { useState } from 'react';
import {
  Building2,
  Smartphone,
  Shield,
  LogOut,
  Bed,
  Ambulance,
  Users,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import { AssessmentRecord, TriageZone } from '../types/assessment';

interface HospitalPageProps {
  onGoToVolunteer?: () => void;
  onGoToDashboard?: () => void;
}

export const HospitalPage: React.FC<HospitalPageProps> = ({
  onGoToVolunteer,
  onGoToDashboard,
}) => {
  const { currentUser, logout } = useAuth();
  const { centralAssessments } = useAssessment();

  // Local state for referral statuses
  const [patientStatuses, setPatientStatuses] = useState<
    Record<string, { status: 'pending' | 'in_transit' | 'admitted' | 'discharged'; bed?: string; doctor?: string }>
  >({});

  const [search, setSearch] = useState('');
  const [filterZone, setFilterZone] = useState<'ALL' | 'RED' | 'YELLOW'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [modalDoctor, setModalDoctor] = useState('dr. Budi Santoso, Sp.KJ');
  const [modalBed, setModalBed] = useState('Bed Jiwa 04 (Ruang Flamboyan)');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Relevant patients for hospital: primarily RED (critical medical referral) and YELLOW (priority follow-up)
  const hospitalCandidates = centralAssessments.filter(
    (r) => r.zone === 'RED' || r.zone === 'YELLOW'
  );

  const filtered = hospitalCandidates.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      (r.transcript && r.transcript.toLowerCase().includes(search.toLowerCase())) ||
      (r.volunteerNotes && r.volunteerNotes.toLowerCase().includes(search.toLowerCase()));

    const matchesZone = filterZone === 'ALL' || r.zone === filterZone;
    return matchesSearch && matchesZone;
  });

  const redCount = centralAssessments.filter((r) => r.zone === 'RED').length;
  const yellowCount = centralAssessments.filter((r) => r.zone === 'YELLOW').length;

  const getStatus = (id: string) => {
    return patientStatuses[id]?.status || 'pending';
  };

  const handleUpdateStatus = (
    id: string,
    newStatus: 'pending' | 'in_transit' | 'admitted' | 'discharged',
    bed?: string,
    doctor?: string
  ) => {
    setPatientStatuses((prev) => ({
      ...prev,
      [id]: {
        status: newStatus,
        bed: bed || prev[id]?.bed,
        doctor: doctor || prev[id]?.doctor,
      },
    }));
    setActionSuccessMessage(`✓ Status pasien ${id} berhasil diperbarui menjadi "${newStatus === 'admitted' ? 'Diterima di IGD / Rawat Inap Jiwa' : newStatus === 'in_transit' ? 'Dalam Ambulans Penjemputan' : 'Menunggu Rujukan'}"`);
    setIsActionModalOpen(false);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  const renderZoneBadge = (zone: TriageZone) => {
    if (zone === 'RED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
          RED ZONE · Kritis
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
        YELLOW · Prioritas
      </span>
    );
  };

  const renderStatusBadge = (id: string) => {
    const s = getStatus(id);
    switch (s) {
      case 'admitted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Diterima di RS
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Ambulance className="w-3 h-3 text-blue-600 animate-pulse" />
            Dalam Ambulans
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu Rujukan
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 flex flex-col font-sans">
      {/* Hospital Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          {/* Brand & Hospital Unit */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  RAPID-MIND
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Portal Rumah Sakit
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentUser?.assignedHospital || 'RSUD Dr. Soetomo — Pusat Rujukan Jiwa Bencana'}
              </p>
            </div>
          </div>

          {/* Action Links & Profile */}
          <div className="flex items-center gap-2">
            {onGoToVolunteer && (
              <button
                type="button"
                onClick={onGoToVolunteer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Volunteer App</span>
              </button>
            )}

            {onGoToDashboard && (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Command Center</span>
              </button>
            )}

            {/* Doctor Profile & Sign Out */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    {currentUser.badgeNumber} · Petugas RS
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Keluar (Sign Out)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Hospital Portal Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Success Banner */}
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. Hospital Capacity & Status KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Pasien Rujukan Merah</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-red-600">{redCount}</div>
            <p className="text-[11px] text-slate-500">Butuh intervensi psikiatri darurat</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Kapasitas Bed Jiwa</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Bed className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-800">
              8 <span className="text-xs font-normal text-slate-400">/ 15 Tersedia</span>
            </div>
            <p className="text-[11px] text-emerald-700">Bangsal Flamboyan & Teratai siap</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Tim Medis Psikiatri</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">4</div>
            <p className="text-[11px] text-slate-500">Dokter Spesialis Jiwa siaga IGD</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Ambulans Rujukan</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Ambulance className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-indigo-900">2 Unit</div>
            <p className="text-[11px] text-slate-500">Siap mobilisasi ke posko evakuasi</p>
          </div>
        </div>

        {/* 2. Referral Patient Queue Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Daftar Korban Rujukan Masuk Dari Posko Lapangan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar korban hasil skrining triase psikologis yang direkomendasikan rujukan medis ke rumah sakit.
              </p>
            </div>

            <div className="text-xs text-slate-500">
              Menampilkan <strong className="text-slate-900 font-mono">{filtered.length}</strong> pasien
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ID korban, posko pengirim, gejala, transkrip..."
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setFilterZone('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filterZone === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({hospitalCandidates.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterZone('RED')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  filterZone === 'RED'
                    ? 'bg-white text-red-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🔴</span>
                <span>Kritis ({redCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterZone('YELLOW')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  filterZone === 'YELLOW'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🟡</span>
                <span>Prioritas ({yellowCount})</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-3.5">ID Korban</th>
                  <th className="py-3 px-3.5">Asal Posko & Waktu</th>
                  <th className="py-3 px-3.5">Zona Triase</th>
                  <th className="py-3 px-3.5">Indikator Gejala / STT</th>
                  <th className="py-3 px-3.5">Status RS</th>
                  <th className="py-3 px-3.5 text-right">Tindakan Medis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length > 0 ? (
                  filtered.slice(0, 15).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                        {row.id}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-800">{row.location}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{row.timestamp}</div>
                      </td>
                      <td className="py-3 px-3.5">{renderZoneBadge(row.zone)}</td>
                      <td className="py-3 px-3.5 max-w-xs">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {row.indicators.slice(0, 2).map((ind, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-medium truncate"
                            >
                              {ind}
                            </span>
                          ))}
                        </div>
                        {row.transcript && (
                          <p className="text-[11px] text-slate-500 italic truncate max-w-xs">
                            "{row.transcript}"
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3.5">{renderStatusBadge(row.id)}</td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(row);
                              setIsActionModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Proses</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada pasien yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL: Intake Pasien Rumah Sakit & Alokasi Bed */}
      {isActionModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Penerimaan Pasien Rujukan RS
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {selectedRecord.id} · {selectedRecord.location}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Patient Quick Context */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Hasil Triase Lapangan
                  </span>
                  {renderZoneBadge(selectedRecord.zone)}
                </div>
                <div className="text-[11px] text-slate-600">
                  <strong>Indikator:</strong> {selectedRecord.indicators.join(', ') || 'N/A'}
                </div>
                {selectedRecord.transcript && (
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 italic">
                    "{selectedRecord.transcript}"
                  </div>
                )}
                <div className="text-[11px] text-slate-500">
                  <strong>Protokol Rekomendasi:</strong> {selectedRecord.recommendedAction}
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Perbarui Status Pasien di Rumah Sakit
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRecord.id, 'in_transit')}
                    className="py-2 px-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 font-bold flex flex-col items-center gap-1 transition"
                  >
                    <Ambulance className="w-4 h-4 text-blue-600" />
                    <span>Jemput Ambulans</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRecord.id, 'admitted', modalBed, modalDoctor)}
                    className="py-2 px-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold flex flex-col items-center gap-1 transition"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Terima di IGD Jiwa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRecord.id, 'pending')}
                    className="py-2 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold flex flex-col items-center gap-1 transition"
                  >
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Antrian Rujukan</span>
                  </button>
                </div>
              </div>

              {/* Doctor & Bed Assignment Form */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Dokter Penanggung Jawab Pasien (DPJP)
                  </label>
                  <input
                    type="text"
                    value={modalDoctor}
                    onChange={(e) => setModalDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Alokasi Ruang / Tempat Tidur RS
                  </label>
                  <select
                    value={modalBed}
                    onChange={(e) => setModalBed(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="Bed Jiwa 04 (Ruang Flamboyan)">Bed Jiwa 04 (Ruang Flamboyan)</option>
                    <option value="Bed Jiwa 05 (Ruang Flamboyan)">Bed Jiwa 05 (Ruang Flamboyan)</option>
                    <option value="Bed Isolasi Akut 01 (IGD Psikiatri)">Bed Isolasi Akut 01 (IGD Psikiatri)</option>
                    <option value="Bangsal Trauma Bencana Teratai">Bangsal Trauma Bencana Teratai</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'admitted', modalBed, modalDoctor)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                >
                  Konfirmasi Penerimaan Pasien
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
