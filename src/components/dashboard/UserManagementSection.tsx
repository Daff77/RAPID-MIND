import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  AlertCircle,
  X,
  Lock,
  MapPin,
  Check,
  ArrowRight,
  Package,
} from 'lucide-react';
import {
  UserGroupIcon,
  UserPlusIcon,
  KeyIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import {
  IconBuildingHospital,
  IconStethoscope,
  IconFirstAidKit,
  IconBuildingWarehouse,
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, User } from '../../types/auth';
import { LocationPost } from '../../types/assessment';
import { useAssessment } from '../../context/AssessmentContext';
import { MOCK_LOCATIONS } from '../../data/seedLocations';

export const UserManagementSection: React.FC = () => {
  const { currentUser, allUsers, addUser, deleteUser, updateUserPost } = useAuth();
  const { centralAssessments } = useAssessment();

  // Active Workspace Sub-View:
  // 'volunteers': Manajemen Relawan & Penugasan Posko
  // 'posko_resources': Status Posko & Ringkasan Sumber Daya Logistik
  // 'accounts': Akun Pengguna Sistem (Admin CRUD)
  const [activeTab, setActiveTab] = useState<'volunteers' | 'posko_resources' | 'accounts'>('volunteers');

  // Search & Filters for volunteers
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [filterPosko, setFilterPosko] = useState<'ALL' | LocationPost>('ALL');

  // Assignment Modal State
  const [assigningVolunteer, setAssigningVolunteer] = useState<User | null>(null);
  const [targetPosko, setTargetPosko] = useState<LocationPost>('Posko A');
  const [isAssigningSubmitting, setIsAssigningSubmitting] = useState(false);

  // Add User Modal State (Preserved)
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

  // Compute Posko Context with real metrics from centralAssessments and allUsers
  const poskoContextData = useMemo(() => {
    return MOCK_LOCATIONS.map((loc) => {
      const records = centralAssessments.filter((r) => r.location === loc.name);
      const assignedVolunteers = allUsers.filter(
        (u) => u.role === 'volunteer' && u.assignedPost === loc.name
      );
      const t0 = records.filter(
        (r) => r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)
      ).length;
      const t1 = records.filter(
        (r) => r.triageTier === 'T1' || (r.zone === 'RED' && !r.criticalTriggered)
      ).length;
      const t2 = records.filter((r) => r.triageTier === 'T2' || r.zone === 'YELLOW').length;
      const t3 = records.filter((r) => r.triageTier === 'T3' || r.zone === 'GREEN').length;

      return {
        ...loc,
        totalAssessments: records.length,
        volunteerCount: assignedVolunteers.length,
        volunteers: assignedVolunteers,
        t0,
        t1,
        t2,
        t3,
      };
    });
  }, [centralAssessments, allUsers]);

  // Volunteers list
  const volunteersList = useMemo(() => {
    return allUsers.filter((u) => u.role === 'volunteer');
  }, [allUsers]);

  // Filtered volunteers
  const filteredVolunteers = useMemo(() => {
    return volunteersList.filter((v) => {
      const q = volunteerSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.username.toLowerCase().includes(q) ||
        v.badgeNumber.toLowerCase().includes(q) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.assignedPost && v.assignedPost.toLowerCase().includes(q));

      const matchesPosko = filterPosko === 'ALL' || v.assignedPost === filterPosko;

      return matchesSearch && matchesPosko;
    });
  }, [volunteersList, volunteerSearch, filterPosko]);

  // Resource Overview Data (Informational strictly matching Full Paper, no fake CRUD)
  const resourceOverviewData = useMemo(() => {
    return [
      {
        id: 'res-1',
        name: 'Kit Pertolongan Pertama Psikologis (PFA Pocket Guide & Grounding Tools)',
        category: 'Psikososial Lapangan',
        location: 'Seluruh Posko (A, B, C, D)',
        available: '48 Set Lengkap',
        allocated: '32 Set di Lapangan',
        status: 'Mencukupi',
        statusColor: 'emerald',
      },
      {
        id: 'res-2',
        name: 'Lembar Skrining Cetak SRQ-20 & Alat Tulis Cadangan Offline',
        category: 'Instrumen Penapisan',
        location: 'Posko A, B, C, D',
        available: '350 Eksemplar',
        allocated: '210 Eksemplar',
        status: 'Siaga Penuh',
        statusColor: 'emerald',
      },
      {
        id: 'res-3',
        name: 'Tenda Privasi Konseling & Stabilisasi Mental Akut',
        category: 'Fasilitas Posko',
        location: 'Posko A (2 unit), Posko B (1 unit)',
        available: '3 Unit Terpasang',
        allocated: '3 Posko Aktif',
        status: 'Perlu Tambahan (Posko C)',
        statusColor: 'amber',
      },
      {
        id: 'res-4',
        name: 'Obat Sedatif / Psikotropika Darurat (Pengawasan Dokter Jiwa)',
        category: 'Logistik Medis Jiwa',
        location: 'Posko A & RS Lapangan',
        available: '80 Dosis Ampul/Tablet',
        allocated: '14 Dosis Terpakai',
        status: 'Siaga Khusus Nakes',
        statusColor: 'blue',
      },
      {
        id: 'res-5',
        name: 'Unit Ambulans Reaksi Cepat PSC 119 Terkoneksi Tele-Emergency',
        category: 'Transportasi Evakuasi',
        location: 'Sektor Pusat (Standby Posko A & B)',
        available: '2 Armada Aktif',
        allocated: 'Siap Rujukan T0',
        status: 'Siaga Penuh',
        statusColor: 'emerald',
      },
      {
        id: 'res-6',
        name: 'Gelang Identitas Barcode Penyintas (Registrasi Cepat)',
        category: 'Identifikasi Bencana',
        location: 'Posko A (Pusat Penerimaan)',
        available: '500 Gelang',
        allocated: '240 Terdistribusi',
        status: 'Mencukupi',
        statusColor: 'emerald',
      },
    ];
  }, []);

  if (!isAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Akses Terbatas: Khusus Admin</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Fitur penambahan dan manajemen akun pengguna hanya dapat dilakukan oleh pengguna dengan peran Admin BPBD / Dinas Kesehatan.
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
    setRole(presetRole || 'volunteer');
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
        `✓ Akun ${res.user.name} (${res.user.role}) dengan username "${res.user.username}" berhasil dibuat!`
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

  // Open Assignment Modal
  const handleOpenAssignModal = (volunteer: User) => {
    setAssigningVolunteer(volunteer);
    setTargetPosko(volunteer.assignedPost || 'Posko A');
  };

  // Confirm Volunteer Assignment
  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningVolunteer) return;

    setIsAssigningSubmitting(true);
    const res = updateUserPost(assigningVolunteer.id, targetPosko);
    setIsAssigningSubmitting(false);

    if (res.success) {
      setSuccessBanner(
        `✓ Penugasan relawan ${assigningVolunteer.name} ke ${targetPosko} berhasil dikonfirmasi dan diperbarui.`
      );
      setAssigningVolunteer(null);
      setTimeout(() => setSuccessBanner(null), 5000);
    } else {
      alert(res.error || 'Gagal memperbarui penugasan posko.');
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
            <ShieldCheckIcon className="w-3.5 h-3.5 text-indigo-600" />
            Admin BPBD/Dinkes
          </span>
        );
      case 'hospital':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <IconBuildingHospital className="w-3.5 h-3.5 text-emerald-600" stroke={1.8} />
            Tenaga Medis / RS
          </span>
        );
      case 'volunteer':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <IconStethoscope className="w-3.5 h-3.5 text-blue-600" stroke={1.8} />
            Relawan Lapangan
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Success Notification Banner */}
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

      {/* Top Workspace Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              RESOURCE COORDINATION WORKSPACE — MANAJEMEN RELAWAN & SUMBER DAYA POSKO
            </h2>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
              Hak Akses: Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Koordinasi alokasi personel relawan ke posko berdampak tinggi dan pemantauan ketersediaan logistik darurat.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddModal('volunteer')}
          className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition shrink-0 cursor-pointer"
        >
          <UserPlusIcon className="w-4 h-4" />
          <span>Tambah Pengguna / Relawan Baru</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs within Resource Workspace */}
      <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-2xs flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('volunteers')}
          className={`py-2 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'volunteers'
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserGroupIcon className="w-4 h-4 text-blue-600" />
          <span>Manajemen Relawan & Penugasan Posko ({volunteersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('posko_resources')}
          className={`py-2 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'posko_resources'
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <IconFirstAidKit className="w-4 h-4 text-blue-600" stroke={1.8} />
          <span>Kapasitas Posko & Ringkasan Sumber Daya</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`py-2 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <KeyIcon className="w-4 h-4 text-blue-600" />
          <span>Semua Akun Pengguna Sistem ({allUsers.length})</span>
        </button>
      </div>

      {/* VIEW 1: MANAJEMEN RELAWAN & PENUGASAN POSKO */}
      {activeTab === 'volunteers' && (
        <div className="space-y-4 animate-in fade-in duration-100">
          {/* Posko Context Cards Strip (Section 9) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {poskoContextData.map((posko) => {
              const isSelectedPosko = filterPosko === posko.name;

              return (
                <div
                  key={posko.id}
                  onClick={() => setFilterPosko(isSelectedPosko ? 'ALL' : posko.name)}
                  className={`bg-white border rounded-xl p-3.5 shadow-2xs space-y-2 cursor-pointer transition hover:border-blue-400 ${
                    isSelectedPosko ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-slate-200'
                  }`}
                  title="Klik untuk memfilter relawan di posko ini"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{posko.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {posko.volunteerCount} Relawan
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 truncate" title={posko.coordinator}>
                    Koord: {posko.coordinator}
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Penyintas: <strong className="font-mono text-slate-900">{posko.totalAssessments}</strong>
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      {posko.t0 > 0 && <span className="text-red-700 font-bold">T0:{posko.t0}</span>}
                      {posko.t1 > 0 && <span className="text-orange-700 font-bold">T1:{posko.t1}</span>}
                      <span className="text-emerald-700 font-bold">T3:{posko.t3}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Volunteers List Card with Compact Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Personel Relawan Lapangan ({filteredVolunteers.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Status ketersediaan, penugasan posko, dan beban skrining psikologis di lapangan.
                </span>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={volunteerSearch}
                    onChange={(e) => setVolunteerSearch(e.target.value)}
                    placeholder="Cari nama, badge, posko..."
                    className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none w-48 sm:w-56 focus:border-blue-600 shadow-2xs"
                  />
                </div>

                <select
                  value={filterPosko}
                  onChange={(e) => setFilterPosko(e.target.value as any)}
                  className="bg-white border border-slate-300 text-xs text-slate-700 font-medium rounded-lg px-2.5 py-1.5 outline-none hover:border-slate-400 transition cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Semua Posko</option>
                  <option value="Posko A">Posko A</option>
                  <option value="Posko B">Posko B</option>
                  <option value="Posko C">Posko C</option>
                  <option value="Posko D">Posko D</option>
                </select>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 whitespace-nowrap">Nama & No. Badge</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Posko Penugasan</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Status Availability</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Beban Kerja (Posko)</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Kontak WhatsApp</th>
                    <th className="py-2.5 px-4 text-right whitespace-nowrap">Aksi Penugasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVolunteers.length > 0 ? (
                    filteredVolunteers.map((vol) => {
                      const currentPost = vol.assignedPost;
                      const postAssessments = centralAssessments.filter(
                        (r) => r.location === currentPost
                      ).length;

                      return (
                        <tr key={vol.id} className="hover:bg-slate-50/80 transition">
                          {/* Nama & Badge */}
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-slate-900 text-xs">{vol.name}</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                              <span className="font-semibold text-blue-700">{vol.badgeNumber}</span>
                              <span>·</span>
                              <span className="font-sans truncate max-w-[150px]">{vol.title}</span>
                            </div>
                          </td>

                          {/* Posko Penugasan */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            {currentPost ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <MapPin className="w-3 h-3 text-blue-600" />
                                {currentPost}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Belum Ditugaskan</span>
                            )}
                          </td>

                          {/* Status Availability */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            {currentPost ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Assigned (Bertugas)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                Available (Siaga)
                              </span>
                            )}
                          </td>

                          {/* Workload */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="font-mono text-slate-800 font-semibold text-xs">
                              {currentPost ? `${postAssessments} Asesmen` : '-'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">beban sektor posko</span>
                          </td>

                          {/* Kontak */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <div className="font-mono text-slate-700 text-xs">{vol.phone || '-'}</div>
                            <div className="text-[10px] text-slate-400">{vol.email}</div>
                          </td>

                          {/* Aksi Penugasan */}
                          <td className="py-2.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(vol)}
                              className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Tugaskan / Pindah Posko</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        Tidak ada data relawan yang sesuai dengan kriteria pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: STATUS POSKO & RINGKASAN SUMBER DAYA (Section 9 & 10) */}
      {activeTab === 'posko_resources' && (
        <div className="space-y-4 animate-in fade-in duration-100">
          {/* Posko Context Cards (Section 9) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                PEMETAAN SITUASI BEBAN POSKO BENCANA (POSKO CONTEXT)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian lokasi, koordinator, alokasi personel relawan, dan distribusi risiko penyintas per sektor posko darurat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {poskoContextData.map((p) => (
                <div key={p.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>{p.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">{p.sector}</span>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
                      {p.volunteerCount} Relawan Bertugas
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

                  <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Koordinator Posko:</span>
                      <span className="font-semibold text-slate-800 text-[11px] truncate block">{p.coordinator}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Distribusi Risiko Kasus:</span>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 font-bold" title="T0 Emergency">T0:{p.t0}</span>
                        <span className="px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-bold" title="T1 High Risk">T1:{p.t1}</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold" title="T2 Moderate">T2:{p.t2}</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold" title="T3 Low Risk">T3:{p.t3}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Overview Table (Section 10) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  RESOURCE OVERVIEW — DISTRIBUSI LOGISTIK & SARANA PENUNJANG
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Monitoring ketersediaan sarana intervensi psikologis, logistik medis darurat, dan armada evakuasi rujukan.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 whitespace-nowrap">Nama Sumber Daya / Fasilitas</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Kategori</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Penempatan / Posko</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Ketersediaan (Available)</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Terdistribusi (Allocated)</th>
                    <th className="py-2.5 px-4 text-right whitespace-nowrap">Status Kebutuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resourceOverviewData.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 text-xs">
                        {res.name}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600 text-[11px]">
                        {res.category}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-800 text-xs">
                        {res.location}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono font-semibold text-slate-800 text-xs">
                        {res.available}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-600 text-xs">
                        {res.allocated}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            res.statusColor === 'emerald'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : res.statusColor === 'amber'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              res.statusColor === 'emerald'
                                ? 'bg-emerald-600'
                                : res.statusColor === 'amber'
                                ? 'bg-amber-600'
                                : 'bg-blue-600'
                            }`}
                          ></span>
                          <span>{res.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SEMUA AKUN PENGGUNA SISTEM (Preserved Admin CRUD) */}
      {activeTab === 'accounts' && (
        <div className="space-y-4 animate-in fade-in duration-100">
          {/* KPI Role Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Total Relawan Lapangan</span>
                <span className="text-2xl font-bold font-mono text-slate-900">{totalVolunteers}</span>
                <span className="text-[11px] text-blue-600 block mt-0.5">Petugas Penapisan PFA & SRQ-20</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <IconStethoscope className="w-5 h-5 text-blue-600" stroke={1.8} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Total Tenaga Medis / RS</span>
                <span className="text-2xl font-bold font-mono text-emerald-800">{totalHospital}</span>
                <span className="text-[11px] text-emerald-700 block mt-0.5">Petugas Validasi PSC 119 & IGD Jiwa</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IconBuildingHospital className="w-5 h-5 text-emerald-600" stroke={1.8} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Total Administrator</span>
                <span className="text-2xl font-bold font-mono text-indigo-900">{totalAdmins}</span>
                <span className="text-[11px] text-indigo-700 block mt-0.5">Pusat Komando BPBD & Dinkes</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Seluruh Pengguna Sistem Terdaftar ({allUsers.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  Manajemen akun login terpadu RAPID-MIND
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 whitespace-nowrap">Nama & Jabatan</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Username & Email</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Peran (Role)</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Badge / Posko / Faskes</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Kontak Telepon</th>
                    <th className="py-2.5 px-4 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.map((u) => {
                    const isDefault = ['user-adm-001', 'user-vol-042', 'user-rs-001'].includes(u.id);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{u.title}</div>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-xs">
                          <div className="font-semibold text-slate-800">{u.username}</div>
                          <div className="text-[11px] text-slate-400 font-sans">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-3.5">{renderRoleBadge(u.role)}</td>
                        <td className="py-2.5 px-3.5">
                          <div className="font-mono font-medium text-slate-800 text-[11px]">
                            {u.badgeNumber}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {u.role === 'hospital'
                              ? u.assignedHospital || 'RSUD Rujukan'
                              : u.assignedPost || 'Posko A'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 font-mono text-[11px]">
                          {u.phone || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {isDefault ? (
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100">
                              Akun Inti
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Hapus User"
                            >
                              <TrashIcon className="w-4 h-4" />
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
        </div>
      )}

      {/* MODAL 1: PENUGASAN RELAWAN KE POSKO (Section 8) */}
      {assigningVolunteer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Penugasan Relawan ke Posko Bencana
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Alur koordinasi: Pilih Posko → Review → Konfirmasi
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAssigningVolunteer(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmAssignment} className="p-5 space-y-4 text-xs">
              {/* 1. Volunteer Identity */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Identitas Relawan
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{assigningVolunteer.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Badge: {assigningVolunteer.badgeNumber} · {assigningVolunteer.title}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {assigningVolunteer.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span>Penugasan Saat Ini:</span>
                  <strong className="text-slate-900 font-medium">
                    {assigningVolunteer.assignedPost || 'Belum Ditugaskan'}
                  </strong>
                </div>
              </div>

              {/* 2. Target Posko Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Pilih Posko Tujuan Penugasan *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Posko A', 'Posko B', 'Posko C', 'Posko D'] as LocationPost[]).map((postName) => {
                    const isSelected = targetPosko === postName;
                    const poskoInfo = poskoContextData.find((p) => p.name === postName);

                    return (
                      <button
                        key={postName}
                        type="button"
                        onClick={() => setTargetPosko(postName)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{postName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal mt-1">
                          {poskoInfo?.volunteerCount || 0} Relawan aktif · {poskoInfo?.totalAssessments || 0} Penyintas
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Review Assignment Box */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
                <strong className="block text-blue-950">Ringkasan Perubahan Penugasan:</strong>
                <div className="flex items-center gap-2">
                  <span className="line-through text-slate-500">{assigningVolunteer.assignedPost || 'Belum Ditugaskan'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  <strong className="text-blue-800 font-bold">{targetPosko}</strong>
                </div>
                <p className="text-[10px] text-blue-700/80 mt-1">
                  Wilayah kerja relawan pada aplikasi lapangan PWA akan otomatis diperbarui ke {targetPosko}.
                </p>
              </div>

              {/* 4. Confirmation Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningVolunteer(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAssigningSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Konfirmasi & Simpan Penugasan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH USER BARU (Preserved Admin CRUD) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <UserPlusIcon className="w-4 h-4" />
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
                      setRole('volunteer');
                      setTitle('Field Psychological Volunteer');
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      role === 'volunteer'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <IconStethoscope className="w-4 h-4 text-blue-600" stroke={1.8} />
                    <span>Volunteer</span>
                  </button>

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
                    <IconBuildingHospital className="w-4 h-4 text-emerald-600" stroke={1.8} />
                    <span>Rumah Sakit</span>
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
                    <ShieldCheckIcon className="w-4 h-4 text-indigo-600" />
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
                  placeholder="Contoh: Rina Anggraini, S.Psi"
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
                    placeholder="Contoh: vol_rina"
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
                    placeholder="Contoh: Petugas Skrining Lapangan"
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
