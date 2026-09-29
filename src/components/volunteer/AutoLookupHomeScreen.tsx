import React, { useState } from 'react';
import {
  Search,
  UserCheck,
  UserPlus,
  ArrowRight,
  Clock,
  IdCard,
  Users,
  Check,
  Eye,
  QrCode,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { SurvivorProfile, LocationPost, getCategoryFromAge } from '../../types/assessment';
import {
  searchSurvivors,
  saveSurvivorToRegistry,
  generateSurvivorId,
  updateSurvivorNik,
} from '../../data/mockSurvivors';

interface AutoLookupHomeScreenProps {
  onSelectSurvivor: (survivor: SurvivorProfile, targetFlow: 'pfa' | 'srq20') => void;
  onOpenHistory: () => void;
}

export const AutoLookupHomeScreen: React.FC<AutoLookupHomeScreenProps> = ({
  onSelectSurvivor,
  onOpenHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<SurvivorProfile | null>(null);
  const [multipleMatches, setMultipleMatches] = useState<SurvivorProfile[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // New Survivor registration form state
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [newNik, setNewNik] = useState('');
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('28');
  const [newCategory, setNewCategory] = useState<'Anak' | 'Remaja' | 'Dewasa' | 'Lansia'>('Dewasa');
  const [newGender, setNewGender] = useState<'L' | 'P'>('P');
  const [newPosko, setNewPosko] = useState<LocationPost>('Posko A');
  const [newPoskoId, setNewPoskoId] = useState('');

  // NIK update on existing survivor state
  const [isEditingNik, setIsEditingNik] = useState(false);
  const [editNikInput, setEditNikInput] = useState('');
  const [nikUpdateSuccess, setNikUpdateSuccess] = useState<string | null>(null);

  const handleNewAgeChange = (val: string) => {
    setNewAge(val);
    setNewCategory(getCategoryFromAge(val));
  };

  const handleSearch = (queryOverride?: string) => {
    const q = (queryOverride !== undefined ? queryOverride : searchQuery).trim();
    if (!q) return;

    setHasSearched(true);
    setIsEditingNik(false);
    setNikUpdateSuccess(null);

    const matches = searchSurvivors(q);

    if (matches.length === 1) {
      setLookupResult(matches[0]);
      setMultipleMatches([]);
      setIsRegisteringNew(false);
    } else if (matches.length > 1) {
      // Prioritaskan kecocokan persis pada ID, NIK, atau ID Posko/Gelang
      const exactMatch = matches.find(
        (s) =>
          (s.id && s.id.toLowerCase() === q.toLowerCase()) ||
          (s.nik && s.nik.toLowerCase() === q.toLowerCase()) ||
          (s.poskoId && s.poskoId.toLowerCase() === q.toLowerCase())
      );

      if (exactMatch) {
        setLookupResult(exactMatch);
        setMultipleMatches([]);
        setIsRegisteringNew(false);
      } else {
        setLookupResult(null);
        setMultipleMatches(matches);
        setIsRegisteringNew(false);
      }
    } else {
      // Tidak ditemukan: beralih ke registrasi penyintas baru
      setLookupResult(null);
      setMultipleMatches([]);

      const isNumeric = /^\d{8,}$/.test(q);
      const isPoskoBadge = /^(GL-|T\d-|POS-)/i.test(q);

      if (isNumeric) {
        setNewNik(q);
        setNewName('');
        setNewPoskoId('');
      } else if (isPoskoBadge) {
        setNewPoskoId(q);
        setNewNik('');
        setNewName('');
      } else {
        setNewName(q);
        setNewNik('');
        setNewPoskoId('');
      }
      setIsRegisteringNew(true);
    }
  };

  const handleRegisterNewSurvivor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAge.trim()) return;

    const survivorId = generateSurvivorId();
    const survivorNik = newNik.trim() ? newNik.trim() : undefined;

    const newSurvivor: SurvivorProfile = {
      id: survivorId,
      nik: survivorNik,
      poskoId: newPoskoId.trim() || undefined,
      name: newName.trim(),
      age: parseInt(newAge, 10) || 28,
      gender: newGender,
      category: newCategory,
      posko: newPosko,
      registeredAt: new Date().toLocaleString('id-ID'),
      currentPhase: 'acute_pfa',
      triageTier: 'T3',
    };

    saveSurvivorToRegistry(newSurvivor);
    onSelectSurvivor(newSurvivor, 'pfa');
  };

  const handleSaveUpdatedNik = () => {
    if (!editNikInput.trim() || !lookupResult) return;
    const updated = updateSurvivorNik(lookupResult.id, editNikInput.trim());
    if (updated) {
      setLookupResult(updated);
      setIsEditingNik(false);
      setEditNikInput('');
      setNikUpdateSuccess(`NIK berhasil diperbarui pada rekam medis ${updated.id}.`);
      setTimeout(() => setNikUpdateSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto py-1">
      {/* 1. SCREEN TITLE & SUBTITLE */}
      <section className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--rm-action-primary)] uppercase tracking-wider">
          <IdCard className="w-4 h-4" />
          <span>Screen 2: Penapisan Lapangan</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--rm-text-primary)]">
          Identifikasi Penyintas
        </h1>
        <p className="text-xs sm:text-sm text-[var(--rm-text-secondary)] leading-relaxed">
          Temukan rekam medis menggunakan NIK KTP, ID Gelang Posko, atau Nama Lengkap sebelum memulai skrining.
        </p>
      </section>

      {/* 2. PRIMARY SEARCH & LOOKUP WORKBENCH */}
      <section className="rm-card space-y-3.5" aria-labelledby="lookup-heading">
        <div className="flex items-center justify-between">
          <label
            id="lookup-heading"
            htmlFor="survivor-search-input"
            className="text-xs font-bold text-[var(--rm-text-primary)] flex items-center gap-1.5"
          >
            <Search className="w-4 h-4 text-[var(--rm-action-primary)]" />
            <span>Pencarian Identitas (NIK / ID Gelang / Nama)</span>
          </label>
        </div>

        {/* Input Box with explicit 52px-56px height, clear button, and leading icon */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-[var(--rm-text-muted)]" />
          </div>

          <input
            id="survivor-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ketik 16 Digit NIK, ID Gelang (GL-...), atau Nama..."
            className="w-full bg-[var(--rm-bg-canvas)] border border-[var(--rm-border-default)] focus:border-[var(--rm-border-focus)] focus:bg-white rounded-xl pl-11 pr-10 min-h-[54px] text-base sm:text-sm text-[var(--rm-text-primary)] outline-none transition font-medium"
            autoComplete="off"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setHasSearched(false);
                setLookupResult(null);
                setMultipleMatches([]);
                setIsRegisteringNew(false);
              }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
              title="Bersihkan input pencarian"
              aria-label="Bersihkan input pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Action Button: "Cari Penyintas" (54px) & QR Scan Simulator */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleSearch()}
            className="sm:col-span-2 rm-btn-primary min-h-[52px] text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Cari Penyintas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('GL-042');
              handleSearch('GL-042');
            }}
            className="rm-btn-secondary min-h-[52px] text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center justify-center gap-1.5"
            title="Simulasi Pemindaian QR Gelang Posko"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
            <span>Scan QR</span>
          </button>
        </div>

        {/* Quick Sample Selector Chips for Fast Testing */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--rm-text-muted)]">
          <span className="font-semibold text-slate-600">Sampel Cepat:</span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('Dewi Sartika');
              handleSearch('Dewi Sartika');
            }}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition font-medium cursor-pointer border border-slate-200"
          >
            Dewi Sartika (NIK Lama)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('Budi Gunawan');
              handleSearch('Budi Gunawan');
            }}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition font-medium cursor-pointer border border-slate-200"
          >
            Budi Gunawan (PFA Selesai)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('3201019988770009');
              handleSearch('3201019988770009');
            }}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition font-medium cursor-pointer border border-slate-200"
          >
            + NIK Baru (Belum Terdaftar)
          </button>
        </div>
      </section>

      {/* 3. HASIL PENCARIAN & ACTIONABLE IDENTIFICATION */}
      {hasSearched && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* STATE A: PENYINTAS DITEMUKAN (TUNGGAL) */}
          {lookupResult ? (
            <div className="rm-card border-l-4 border-l-emerald-600 space-y-4 shadow-sm">
              {/* Identity Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider px-2 py-0.2 rounded bg-emerald-50 border border-emerald-200">
                        ✓ Terdaftar
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {lookupResult.id}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[var(--rm-text-primary)] mt-0.5">
                      {lookupResult.name}
                    </h2>
                    <p className="text-xs text-[var(--rm-text-secondary)] mt-0.5">
                      {lookupResult.posko} · Usia {lookupResult.age} th ({lookupResult.category}) ·{' '}
                      {lookupResult.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      {lookupResult.poskoId && (
                        <span> · Gelang: <strong className="font-mono">{lookupResult.poskoId}</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-1 sm:pt-0">
                  <span className="text-[10px] font-bold uppercase text-[var(--rm-text-muted)]">
                    Fase Penanganan
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      lookupResult.pfaRecord?.completedAt && !lookupResult.pfaRecord.completedAt.startsWith('Draf')
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {lookupResult.pfaRecord?.completedAt && !lookupResult.pfaRecord.completedAt.startsWith('Draf')
                      ? 'Fase Lanjutan (Hari 4–30)'
                      : 'Fase Akut (Hari 1–3)'}
                  </span>
                </div>
              </div>

              {/* Status NIK & Edit Inline Action */}
              <div className="p-3 bg-[var(--rm-bg-elevated)] border border-[var(--rm-border-default)] rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <IdCard className="w-4 h-4 text-slate-600" />
                    <span className="font-bold text-slate-700">NIK KTP:</span>
                    {lookupResult.nik ? (
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {lookupResult.nik}
                      </span>
                    ) : (
                      <span className="text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                        Belum Tersedia
                      </span>
                    )}
                  </div>

                  {!isEditingNik && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditNikInput(lookupResult.nik || '');
                        setIsEditingNik(true);
                      }}
                      className="text-xs font-bold text-[var(--rm-action-primary)] hover:underline cursor-pointer"
                    >
                      {lookupResult.nik ? 'Ubah NIK' : '+ Tambah NIK'}
                    </button>
                  )}
                </div>

                {isEditingNik && (
                  <div className="pt-2 border-t border-slate-200 space-y-2 animate-in fade-in">
                    <p className="text-[11px] text-slate-600">
                      Perbarui nomor NIK resmi untuk rekam medis <strong>{lookupResult.id}</strong> (data riwayat tetap utuh):
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editNikInput}
                        onChange={(e) => setEditNikInput(e.target.value)}
                        placeholder="Ketik 16 Digit NIK..."
                        className="flex-1 bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveUpdatedNik}
                        className="px-3.5 py-2 rounded-lg bg-[var(--rm-action-primary)] hover:bg-[var(--rm-action-hover)] text-white font-bold text-xs shrink-0 cursor-pointer"
                      >
                        Simpan NIK
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingNik(false)}
                        className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs shrink-0 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {nikUpdateSuccess && (
                  <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 pt-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{nikUpdateSuccess}</span>
                  </span>
                )}
              </div>

              {/* Status PFA & Rekam Medis Longitudinal Sebelumnya */}
              {lookupResult.pfaRecord && lookupResult.pfaRecord.completedAt && !lookupResult.pfaRecord.completedAt.startsWith('Draf') ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span className="font-bold flex items-center gap-1.5 text-blue-900">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Intervensi PFA Sebelumnya (Look-Listen-Link)
                    </span>
                    <span className="font-mono text-slate-500 font-semibold">{lookupResult.pfaRecord.completedAt}</span>
                  </div>

                  {lookupResult.pfaRecord.listenNotes && (
                    <p className="text-slate-800 italic leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                      "{lookupResult.pfaRecord.listenNotes}"
                    </p>
                  )}

                  {lookupResult.pfaRecord.lookItems && lookupResult.pfaRecord.lookItems.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {lookupResult.pfaRecord.lookItems.map((item, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-medium"
                        >
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 block">
                      Status: Fase Akut (Hari 1–3) — PFA Belum Selesai
                    </span>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Penyintas ini belum menyelesaikan protokol Pertolongan Pertama Psikologis (*Look-Listen-Link*). Lanjutkan pendampingan PFA atau beralih ke wawancara lanjutan jika telah stabil.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons: Continue to PFA or SRQ-20 */}
              <div className="pt-2 space-y-2">
                {!(lookupResult.pfaRecord && lookupResult.pfaRecord.completedAt && !lookupResult.pfaRecord.completedAt.startsWith('Draf')) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelectSurvivor(lookupResult, 'pfa')}
                      className="w-full rm-btn-primary min-h-[54px] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Lanjutkan Intervensi PFA (Fase Akut Hari 1–3)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectSurvivor(lookupResult, 'srq20')}
                      className="w-full rm-btn-secondary min-h-[48px] text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <span>Lewati PFA & Buka Wawancara SRQ-20 (Hari 4–30)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelectSurvivor(lookupResult, 'srq20')}
                      className="w-full rm-btn-primary min-h-[54px] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Mulai Wawancara SRQ-20 (Fase Lanjutan Hari 4–30)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectSurvivor(lookupResult, 'pfa')}
                      className="w-full rm-btn-secondary min-h-[48px] text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>Lihat / Perbarui Catatan PFA (Fase Akut)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : multipleMatches.length > 1 ? (
            /* STATE B: BEBERAPA PENYINTAS DITEMUKAN (DISAMBIGUASI) */
            <div className="rm-card border-l-4 border-l-blue-600 space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                    Ditemukan {multipleMatches.length} Data Penyintas
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Pilih penyintas yang sesuai dengan identitas lapangan:
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {multipleMatches.map((survivor) => {
                  const hasPfaCompleted = Boolean(
                    survivor.pfaRecord &&
                      survivor.pfaRecord.completedAt &&
                      !survivor.pfaRecord.completedAt.startsWith('Draf')
                  );
                  return (
                    <div
                      key={survivor.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">{survivor.name}</span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {survivor.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              hasPfaCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {hasPfaCompleted ? '✓ PFA Selesai' : '⏳ PFA Belum Selesai'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block mt-1">
                          {survivor.posko} · Usia {survivor.age} th · {survivor.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          {survivor.nik ? ` · NIK: ${survivor.nik}` : ' · NIK: Belum ada'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setLookupResult(survivor);
                            setMultipleMatches([]);
                          }}
                          className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectSurvivor(survivor, hasPfaCompleted ? 'srq20' : 'pfa')}
                          className="px-3.5 py-2 rounded-lg bg-[var(--rm-action-primary)] hover:bg-[var(--rm-action-hover)] text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>{hasPfaCompleted ? 'Wawancara SRQ' : 'Mulai PFA'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLookupResult(null);
                    setMultipleMatches([]);
                    setIsRegisteringNew(true);
                    setNewName(searchQuery.trim());
                    setNewNik('');
                  }}
                  className="text-xs font-bold text-[var(--rm-action-primary)] hover:underline cursor-pointer"
                >
                  + Bukan penyintas di atas? Daftarkan sebagai penyintas baru "{searchQuery.trim()}"
                </button>
              </div>
            </div>
          ) : isRegisteringNew ? (
            /* STATE C: PENYINTAS BELUM TERDAFTAR (REGISTRASI CEPAT FASE AKUT) */
            <form
              onSubmit={handleRegisterNewSurvivor}
              className="rm-card border-l-4 border-l-blue-600 space-y-4 shadow-sm animate-in fade-in"
            >
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[var(--rm-action-primary)] flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-[var(--rm-action-primary)] uppercase tracking-wider block">
                    Penyintas Belum Terdaftar
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Pendaftaran Penyintas Baru (Fase Akut Hari 1–3)
                  </h3>
                </div>
              </div>

              <p className="text-xs text-[var(--rm-text-secondary)] leading-relaxed">
                Lengkapi identitas dasar penyintas untuk mendapatkan <strong>Survivor ID</strong> unik dan memulai intervensi Pertolongan Pertama Psikologis (*Look-Listen-Link*).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Field NIK */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 block">NIK KTP (16 Digit)</label>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                      Opsional jika belum ada
                    </span>
                  </div>
                  <input
                    type="text"
                    value={newNik}
                    onChange={(e) => setNewNik(e.target.value)}
                    placeholder="Masukkan 16 digit NIK..."
                    className="w-full bg-[var(--rm-bg-canvas)] border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 outline-none transition"
                  />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Jika NIK belum ada, sistem akan membuat Patient ID internal otomatis.
                  </p>
                </div>

                {/* Field Nama Lengkap */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Nama Lengkap Penyintas <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Siti Rahma..."
                    className="w-full bg-[var(--rm-bg-canvas)] border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none transition font-medium"
                    required
                  />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Nama penyintas yang diperiksa di posko lapangan.
                  </p>
                </div>
              </div>

              {/* Usia, Gender, Posko */}
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                {/* Usia */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 block">Usia *</label>
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {newCategory}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => handleNewAgeChange(e.target.value)}
                    className="w-full bg-[var(--rm-bg-canvas)] border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 outline-none transition font-bold"
                    required
                  />
                </div>

                {/* Gender Toggle */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Gender *</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setNewGender('L')}
                      className={`py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                        newGender === 'L'
                          ? 'bg-white text-[var(--rm-action-primary)] shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      L
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGender('P')}
                      className={`py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                        newGender === 'P'
                          ? 'bg-white text-[var(--rm-action-primary)] shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      P
                    </button>
                  </div>
                </div>

                {/* Posko Dropdown */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Posko *</label>
                  <select
                    value={newPosko}
                    onChange={(e) => setNewPosko(e.target.value as LocationPost)}
                    className="w-full bg-[var(--rm-bg-canvas)] border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-2 py-2.5 text-xs text-slate-900 outline-none transition font-semibold"
                    required
                  >
                    <option value="Posko A">Posko A</option>
                    <option value="Posko B">Posko B</option>
                    <option value="Posko C">Posko C</option>
                    <option value="Posko D">Posko D</option>
                  </select>
                </div>
              </div>

              {/* ID Gelang Posko */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">Nomor Gelang / ID Posko Lapangan (Opsional)</label>
                  <span className="text-[10px] text-slate-400 font-mono">Contoh: GL-042 / T3-08</span>
                </div>
                <input
                  type="text"
                  value={newPoskoId}
                  onChange={(e) => setNewPoskoId(e.target.value)}
                  placeholder="Kode pada gelang posko jika terpasang..."
                  className="w-full bg-[var(--rm-bg-canvas)] border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none transition"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full rm-btn-primary min-h-[54px] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Daftarkan & Mulai PFA Fase Akut</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : null}
        </div>
      )}

      {/* 4. FOOTER QUICK ACTION & REGISTRY LINK */}
      <div className="pt-2 text-center pb-8">
        <button
          type="button"
          onClick={onOpenHistory}
          className="text-xs font-bold text-slate-600 hover:text-[var(--rm-action-primary)] transition inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Lihat Riwayat & Daftar Seluruh Rekam Medis Posko</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
