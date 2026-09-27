import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  Smartphone,
  Building2,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { LocationPost } from '../../types/assessment';


export const UserManagementSection: React.FC = () => {
  const { currentUser, allUsers, addUser, deleteUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('hospital');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [assignedPost, setAssignedPost] = useState<LocationPost>('Posko A');
  const [assignedHospital, setAssignedHospital] = useState('RSUD Dr. Soetomo');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Akses Terbatas: Khusus Admin</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Fitur penambahan dan manajemen akun pengguna hanya dapat dilakukan oleh pengguna dengan peran Admin.
        </p>
      </div>
    );
  }

  const handleOpenAddModal = (presetRole?: UserRole) => {
    setFormError(null);
    setName('');
    setUsername('');
    setPassword('pass123');
    setEmail('');
    setRole(presetRole || 'hospital');
    setBadgeNumber('');
    setTitle('');
    setPhone('');
    setIsModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Nama lengkap pengguna wajib diisi.');
      return;
    }

    if (!username.trim()) {
      setFormError('Username wajib diisi.');
      return;
    }

    if (!password.trim()) {
      setFormError('Password awal pengguna wajib diisi.');
      return;
    }

    const res = addUser({
      name: name.trim(),
      username: username.trim(),
      password: password.trim(),
      email: email.trim() || `${username.trim().toLowerCase()}@rapidmind.org`,
      role,
      badgeNumber: badgeNumber.trim() || undefined,
      assignedPost: role === 'volunteer' ? assignedPost : undefined,
      assignedHospital: role === 'hospital' ? assignedHospital : undefined,
      title: title.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    if (res.success && res.user) {
      setSuccessBanner(
        `✓ Akun ${res.user.name} (${res.user.role}) dengan username "${res.user.username}" berhasil dibuat oleh Admin!`
      );
      setIsModalOpen(false);
      setTimeout(() => setSuccessBanner(null), 6000);
    } else {
      setFormError(res.error || 'Gagal menambahkan user.');
    }
  };

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`Hapus akun pengguna "${userName}"?`)) {
      const res = deleteUser(userId);
      if (res.success) {
        setSuccessBanner(`Pengguna ${userName} telah dihapus.`);
        setTimeout(() => setSuccessBanner(null), 4000);
      } else {
        alert(res.error || 'Gagal menghapus pengguna.');
      }
    }
  };

  const totalVolunteers = allUsers.filter((u) => u.role === 'volunteer').length;
  const totalHospital = allUsers.filter((u) => u.role === 'hospital').length;
  const totalAdmins = allUsers.filter((u) => u.role === 'admin').length;

  const renderRoleBadge = (uRole: UserRole) => {
    switch (uRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Shield className="w-3 h-3 text-indigo-600" />
            Admin
          </span>
        );
      case 'hospital':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Building2 className="w-3 h-3 text-emerald-600" />
            Rumah Sakit
          </span>
        );
      case 'volunteer':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Smartphone className="w-3 h-3 text-blue-600" />
            Volunteer
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Success Notification */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Kelola Pengguna (User Management)
            </h2>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
              Hak Akses: Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hanya Admin yang dapat menambahkan dan mengelola akun petugas Volunteer, Rumah Sakit, dan Admin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddModal('hospital')}
          className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* Role Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Volunteer</span>
            <span className="text-2xl font-bold font-mono text-slate-900">{totalVolunteers}</span>
            <span className="text-[11px] text-blue-600 block mt-0.5">Petugas Skrining Lapangan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Rumah Sakit</span>
            <span className="text-2xl font-bold font-mono text-emerald-800">{totalHospital}</span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">Petugas Rujukan RS</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Administrator</span>
            <span className="text-2xl font-bold font-mono text-indigo-900">{totalAdmins}</span>
            <span className="text-[11px] text-indigo-700 block mt-0.5">Koordinator Pusat Krisis</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* User Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Pengguna Aktif ({allUsers.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Pengguna yang dapat login ke dalam sistem RAPID-MIND
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama & Jabatan</th>
                <th className="py-3 px-4">Username & Email</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Badge / Posko / RS</th>
                <th className="py-3 px-4">Kontak Telepon</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allUsers.map((u) => {
                const isDefault = ['user-adm-001', 'user-vol-042', 'user-rs-001'].includes(u.id);

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{u.title}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      <div className="font-semibold text-slate-800">{u.username}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">{renderRoleBadge(u.role)}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-slate-800 text-[11px]">
                        {u.badgeNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {u.role === 'hospital'
                          ? u.assignedHospital || 'RSUD Rujukan'
                          : u.assignedPost || 'Posko A'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {u.phone || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isDefault ? (
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100">
                          Sistem Default
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Hapus User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah User Baru (Hanya oleh Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tambah Pengguna Baru
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Dibuat oleh Admin ({currentUser.name})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 overflow-y-auto text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Pilih Peran (Role) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Peran Pengguna (Role) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('hospital');
                      setTitle('Petugas Triase Rujukan Jiwa RSUD');
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      role === 'hospital'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Rumah Sakit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('volunteer');
                      setTitle('Field Psychological Volunteer');
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      role === 'volunteer'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Volunteer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('admin');
                      setTitle('Incident Psychological Coordinator');
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      role === 'admin'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* 2. Nama Lengkap */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: dr. Hendra Prasetyo, Sp.KJ"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  required
                />
              </div>

              {/* 3. Username & Password */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: rs_hendra"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Password Awal *
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none"
                    required
                  />
                </div>
              </div>

              {/* 4. Email & Telepon */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@rapidmind.org"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812-..."
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* 5. Role-specific Assignment */}
              {role === 'hospital' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Rumah Sakit / Unit Rujukan
                  </label>
                  <select
                    value={assignedHospital}
                    onChange={(e) => setAssignedHospital(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="RSUD Dr. Soetomo (Pusat Rujukan Jiwa)">
                      RSUD Dr. Soetomo (Pusat Rujukan Jiwa)
                    </option>
                    <option value="RS Jiwa Menur (Rujukan Khusus)">
                      RS Jiwa Menur (Rujukan Khusus)
                    </option>
                    <option value="RS Bhayangkara (Pusat Krisis Bencana)">
                      RS Bhayangkara (Pusat Krisis Bencana)
                    </option>
                    <option value="RS Lapangan Terpadu BPBD">
                      RS Lapangan Terpadu BPBD
                    </option>
                  </select>
                </div>
              )}

              {role === 'volunteer' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Penugasan Posko Lapangan
                  </label>
                  <select
                    value={assignedPost}
                    onChange={(e) => setAssignedPost(e.target.value as LocationPost)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="Posko A">Posko A</option>
                    <option value="Posko B">Posko B</option>
                    <option value="Posko C">Posko C</option>
                    <option value="Posko D">Posko D</option>
                  </select>
                </div>
              )}

              {/* 6. Jabatan / Title & Badge */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Jabatan / Spesialisasi
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Dokter Jaga IGD Psikiatri"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Nomor Badge (Opsional)
                  </label>
                  <input
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="Otomatis jika kosong"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition"
                >
                  Simpan & Tambah User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
