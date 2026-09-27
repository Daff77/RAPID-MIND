import React, { useState } from 'react';
import {
  Search,
  UserCheck,
  UserPlus,
  ArrowRight,
  Sparkles,
  Clock,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { SurvivorProfile, LocationPost } from '../../types/assessment';
import { findSurvivorByQuery, saveSurvivorToRegistry } from '../../data/mockSurvivors';
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
  const [hasSearched, setHasSearched] = useState(false);

  // New Survivor registration form state (if NIK Baru)
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [newNik, setNewNik] = useState('');
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('28');
  const [newCategory, setNewCategory] = useState<'Anak' | 'Remaja' | 'Dewasa' | 'Lansia'>('Dewasa');
  const [newGender, setNewGender] = useState<'L' | 'P'>('P');
  const [newPosko, setNewPosko] = useState<LocationPost>('Posko A');

  const handleNewAgeChange = (val: string) => {
    setNewAge(val);
    setNewCategory(getCategoryFromAge(val));
  };

  const handleSearch = (queryOverride?: string) => {
    const q = (queryOverride !== undefined ? queryOverride : searchQuery).trim();
    if (!q) return;

    setHasSearched(true);
    const found = findSurvivorByQuery(q);

    if (found) {
      setLookupResult(found);
      setIsRegisteringNew(false);
    } else {
      setLookupResult(null);
      // Deteksi cerdas: jika input berupa angka (NIK/ID), masukkan ke NIK.
      // Jika input mengandung huruf (nama orang seperti "afrizal"), masukkan ke Nama Lengkap.
      const isNumericOrId = /^\d+$/.test(q) || /^VCT-/i.test(q);
      if (isNumericOrId) {
        setNewNik(q);
        setNewName('');
      } else {
        setNewName(q);
        setNewNik('');
      }
      setIsRegisteringNew(true);
    }
  };

  const handleRegisterNewSurvivor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Buat NIK darurat sementara jika belum ada NIK KTP
    const fallbackNik = `3501${Math.floor(Math.random() * 900000000000 + 100000000000)}`;
    const effectiveNik = newNik.trim() || fallbackNik;

    const newSurvivor: SurvivorProfile = {
      nik: effectiveNik,
      id: `VCT-${String(Math.floor(Math.random() * 800) + 100).padStart(3, '0')}`,
      name: newName.trim(),
      age: parseInt(newAge) || 28,
      gender: newGender,
      category: newCategory,
      posko: newPosko,
      registeredAt: new Date().toLocaleString(),
      currentPhase: 'acute_pfa',
      triageTier: 'T3',
    };

    saveSurvivorToRegistry(newSurvivor);
    // Penyintas Baru -> Direct to Menu PFA (Fase Akut Hari 1-3)
    onSelectSurvivor(newSurvivor, 'pfa');
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
          Masukkan NIK, ID Posko, atau nama penyintas untuk memulai asesmen terpandu.
        </p>
      </section>

      {/* Auto-Lookup Search Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>Pencarian Identitas (Auto-Lookup NIK / ID)</span>
          </label>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ketik NIK 16 digit, ID Posko, atau Nama..."
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

      {/* AUTO-LOOKUP SYSTEM RESULT */}
      {hasSearched && (
        <div className="animate-in fade-in duration-200">
          {lookupResult ? (
            /* KASUS A: NIK ADA (PENYINTAS LAMA / TERDAFTAR) */
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Auto-Lookup: NIK Terdaftar
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {lookupResult.name} ({lookupResult.age} th)
                    </h3>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold font-mono">
                  {lookupResult.id}
                </span>
              </div>

              {/* Previous PFA Record Summary */}
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

              {/* Direct to Screen 5: Menu SRQ-20 */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={() => onSelectSurvivor(lookupResult, 'srq20')}
                  className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <span>Mulai Wawancara SRQ-20 (Fase Lanjutan Hari 4–30)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  Data profil otomatis diambil, tidak perlu input ulang dari awal.
                </p>
              </div>
            </div>
          ) : isRegisteringNew ? (
            /* KASUS B: NIK BARU (PENYINTAS BARU) */
            <form
              onSubmit={handleRegisterNewSurvivor}
              className="bg-white border-2 border-blue-500 rounded-3xl p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
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

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 block">NIK</label>
                    <span className="text-[10px] text-slate-400">Opsional</span>
                  </div>
                  <input
                    type="text"
                    value={newNik}
                    onChange={(e) => setNewNik(e.target.value)}
                    placeholder="16 digit NIK (jika ada)..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nama Penyintas..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 block">Usia (Th)</label>
                    <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                      {newCategory}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => handleNewAgeChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Gender</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNewGender('L')}
                      className={`py-1 rounded-lg text-xs font-bold ${
                        newGender === 'L' ? 'bg-white text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      L
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGender('P')}
                      className={`py-1 rounded-lg text-xs font-bold ${
                        newGender === 'P' ? 'bg-white text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      P
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Posko</label>
                  <select
                    value={newPosko}
                    onChange={(e) => setNewPosko(e.target.value as LocationPost)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-900"
                  >
                    <option value="Posko A">Posko A</option>
                    <option value="Posko B">Posko B</option>
                    <option value="Posko C">Posko C</option>
                    <option value="Posko D">Posko D</option>
                  </select>
                </div>
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
