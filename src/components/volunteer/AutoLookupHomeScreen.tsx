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
} from 'lucide-react';
import { SurvivorProfile, LocationPost } from '../../types/assessment';
import {
  findSurvivorByQuery,
  searchSurvivors,
  saveSurvivorToRegistry,
  generateSurvivorId,
  updateSurvivorNik,
} from '../../data/mockSurvivors';
import { getCategoryFromAge } from './NewAssessmentWizard';

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

  // NIK update on existing survivor state (Test 4: NIK ditambahkan kemudian)
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
      // Prioritaskan kecocokan persis pada ID atau NIK
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
        // Tampilkan daftar pemilih jika terdapat beberapa penyintas dengan nama sama
        setLookupResult(null);
        setMultipleMatches(matches);
        setIsRegisteringNew(false);
      }
    } else {
      // Tidak ditemukan: tawarkan registrasi penyintas baru
      setLookupResult(null);
      setMultipleMatches([]);

      // Deteksi cerdas input kata kunci:
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

    // Sistem membuat Unique Survivor ID / Patient ID internal unik (RM-2026-000001)
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
      registeredAt: new Date().toLocaleString(),
      currentPhase: 'acute_pfa',
      triageTier: 'T3',
    };

    saveSurvivorToRegistry(newSurvivor);

    // Keduanya (dengan NIK ataupun tanpa NIK) tetap masuk ke alur PFA yang sama persis
    onSelectSurvivor(newSurvivor, 'pfa');
  };

  const handleSaveUpdatedNik = () => {
    if (!editNikInput.trim() || !lookupResult) return;
    const updated = updateSurvivorNik(lookupResult.id, editNikInput.trim());
    if (updated) {
      setLookupResult(updated);
      setIsEditingNik(false);
      setEditNikInput('');
      setNikUpdateSuccess(`NIK berhasil diperbarui pada ${updated.id} tanpa membuat duplicate record.`);
      setTimeout(() => setNikUpdateSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto py-2">
      {/* Brand Hero */}
      <section className="text-center sm:text-left space-y-1">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
          Identitas Penyintas
        </span>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Penapisan Kesehatan Jiwa Bencana
        </h2>
        <p className="text-xs text-slate-500">
          Pencarian multi-kunci berdasarkan NIK, ID Posko / gelang, atau nama lengkap penyintas.
        </p>
      </section>

      {/* Auto-Lookup Search Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>Pencarian Identitas (NIK / ID Posko / Nama)</span>
          </label>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ketik NIK 16 digit, ID Posko / Gelang, atau Nama..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-2xl pl-3.5 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition shrink-0 flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari</span>
          </button>
        </div>
      </div>

      {/* HASIL PENCARIAN & AUTO-LOOKUP */}
      {hasSearched && (
        <div className="animate-in fade-in duration-200 space-y-4">
          {/* KASUS A: PENYINTAS DITEMUKAN (TUNGGAL) */}
          {lookupResult ? (
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-5 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Auto-Lookup: Penyintas Terdaftar
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {lookupResult.name} ({lookupResult.age} th)
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Posko: {lookupResult.posko}</span>
                      {lookupResult.poskoId && (
                        <span>· Gelang: <strong className="font-mono text-slate-700">{lookupResult.poskoId}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Survivor ID
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold font-mono">
                    {lookupResult.id}
                  </span>
                </div>
              </div>

              {/* Status NIK & Opsi Pembaruan NIK (Test 4: NIK ditambahkan kemudian) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-slate-600" />
                    <span className="font-semibold text-slate-700">NIK KTP:</span>
                    {lookupResult.nik ? (
                      <span className="font-mono font-bold text-slate-900">{lookupResult.nik}</span>
                    ) : (
                      <span className="text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.2 rounded text-[11px]">
                        Belum tersedia
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
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {lookupResult.nik ? 'Ubah NIK' : '+ Tambahkan NIK'}
                    </button>
                  )}
                </div>

                {isEditingNik && (
                  <div className="pt-2 border-t border-slate-200 space-y-2 animate-in fade-in">
                    <p className="text-[11px] text-slate-500">
                      Masukkan NIK resmi untuk memperbarui record <strong>{lookupResult.id}</strong> (tidak membuat data duplikat):
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editNikInput}
                        onChange={(e) => setEditNikInput(e.target.value)}
                        placeholder="Ketik 16 digit NIK..."
                        className="flex-1 bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveUpdatedNik}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0"
                      >
                        Simpan NIK
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingNik(false)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs shrink-0"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {nikUpdateSuccess && (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 pt-1">
                    <Check className="w-3 h-3" />
                    <span>{nikUpdateSuccess}</span>
                  </span>
                )}
              </div>

              {/* Riwayat PFA Sebelumnya jika ada */}
              {lookupResult.pfaRecord && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      Riwayat PFA Sebelumnya
                    </span>
                    <span className="font-mono">{lookupResult.pfaRecord.completedAt}</span>
                  </div>

                  <p className="text-slate-700 italic leading-relaxed">
                    "{lookupResult.pfaRecord.listenNotes}"
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {lookupResult.pfaRecord.lookItems.map((item, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px]"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button: Lanjut ke SRQ-20 atau PFA */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={() => onSelectSurvivor(lookupResult, 'srq20')}
                  className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <span>Mulai Wawancara SRQ-20 (Fase Lanjutan Hari 4–30)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  Data profil otomatis diambil menggunakan Survivor ID {lookupResult.id}.
                </p>
              </div>
            </div>
          ) : multipleMatches.length > 1 ? (
            /* KASUS B: BEBERAPA PENYINTAS DENGAN NAMA/KATA KUNCI SAMA */
            <div className="bg-white border-2 border-blue-500 rounded-3xl p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                    Ditemukan {multipleMatches.length} Penyintas
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pilih penyintas yang sesuai dengan identitas lapangan:
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {multipleMatches.map((survivor) => (
                  <div
                    key={survivor.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{survivor.name}</span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {survivor.id}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {survivor.posko} · Usia {survivor.age} th · {survivor.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        {survivor.nik ? ` · NIK: ${survivor.nik}` : ' · NIK: Belum ada'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLookupResult(survivor);
                        setMultipleMatches([]);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shrink-0"
                    >
                      Pilih
                    </button>
                  </div>
                ))}
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
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  + Bukan mereka? Daftarkan sebagai penyintas baru dengan nama "{searchQuery.trim()}"
                </button>
              </div>
            </div>
          ) : isRegisteringNew ? (
            /* KASUS C: PENYINTAS BELUM TERDAFTAR (REGISTRASI PENYINTAS BARU) */
            <form
              onSubmit={handleRegisterNewSurvivor}
              className="bg-white border-2 border-blue-500 rounded-3xl p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                    Auto-Lookup: Penyintas Belum Terdaftar
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pendaftaran Penyintas Baru (Fase Akut Hari 1–3)
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* NIK Field dengan spesifikasi teks bantuan */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 block">NIK</label>
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                      Opsional jika belum tersedia
                    </span>
                  </div>
                  <input
                    type="text"
                    value={newNik}
                    onChange={(e) => setNewNik(e.target.value)}
                    placeholder="Masukkan 16 digit NIK jika ada..."
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none transition"
                  />
                  <p className="text-[10px] text-slate-400">
                    Jika NIK belum tersedia, sistem akan membuat ID penyintas sementara.
                  </p>
                </div>

                {/* Nama Lengkap * Field */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nama Lengkap Penyintas..."
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none transition"
                    required
                  />
                  <p className="text-[10px] text-slate-400">
                    Nama penyintas yang diperiksa di posko lapangan.
                  </p>
                </div>
              </div>

              {/* Usia *, Gender *, Posko * */}
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 block">
                      Usia *
                    </label>
                    <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                      {newCategory}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => handleNewAgeChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none transition"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Gender *
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNewGender('L')}
                      className={`py-1 rounded-lg text-xs font-bold transition ${
                        newGender === 'L' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      L
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGender('P')}
                      className={`py-1 rounded-lg text-xs font-bold transition ${
                        newGender === 'P' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      P
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Posko *
                  </label>
                  <select
                    value={newPosko}
                    onChange={(e) => setNewPosko(e.target.value as LocationPost)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-2 py-2 text-xs text-slate-900 outline-none transition"
                    required
                  >
                    <option value="Posko A">Posko A</option>
                    <option value="Posko B">Posko B</option>
                    <option value="Posko C">Posko C</option>
                    <option value="Posko D">Posko D</option>
                  </select>
                </div>
              </div>

              {/* ID Posko / ID Gelang Lapangan (Opsional) */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 block">ID Gelang / ID Posko (Opsional)</label>
                  <span className="text-[10px] text-slate-400">Contoh: GL-042 / T3-08</span>
                </div>
                <input
                  type="text"
                  value={newPoskoId}
                  onChange={(e) => setNewPoskoId(e.target.value)}
                  placeholder="Kode nomor gelang posko jika terpasang..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none transition"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <span>Daftar & Lanjut ke Menu PFA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : null}
        </div>
      )}

      {/* Quick Access to History & Registry */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onOpenHistory}
          className="text-xs text-slate-500 hover:text-blue-600 font-semibold transition"
        >
          Lihat Riwayat & Daftar Seluruh Penyintas Terdata →
        </button>
      </div>
    </div>
  );
};
