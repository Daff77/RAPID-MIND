import React, { useState } from 'react';
import {
  Smartphone,
  Shield,
  Building2,
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface LoginPageProps {
  onLoginSuccess: (role: UserRole) => void;
  defaultRole?: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  defaultRole = 'volunteer',
}) => {
  const { login, quickLogin } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>(() => {
    if (defaultRole === 'admin') return 'admin';
    if (defaultRole === 'hospital') return 'rumahsakit';
    return 'volunteer';
  });
  const [password, setPassword] = useState<string>(() => {
    if (defaultRole === 'admin') return 'admin123';
    if (defaultRole === 'hospital') return 'rumahsakit123';
    return 'volunteer123';
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'admin') {
      setUsernameOrEmail('admin');
      setPassword('admin123');
    } else if (role === 'hospital') {
      setUsernameOrEmail('rumahsakit');
      setPassword('rumahsakit123');
    } else {
      setUsernameOrEmail('volunteer');
      setPassword('volunteer123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMessage('Silakan isi username dan password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const res = await login({
      usernameOrEmail,
      password,
      targetRole: selectedRole,
    });

    setIsLoading(false);

    if (res.success) {
      onLoginSuccess(selectedRole);
    } else {
      setErrorMessage(res.error || 'Username atau password tidak valid.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white font-black text-lg shadow-sm">
            RM
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            RAPID-MIND
          </h1>
          <p className="text-xs text-slate-500">
            Sistem Triase & Rujukan Kesehatan Mental Bencana Terintegrasi
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          {/* 3-Role Switch: Volunteer | Rumah Sakit | Admin */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleRoleChange('volunteer')}
              className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'volunteer'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Volunteer</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('hospital')}
              className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'hospital'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rumah Sakit</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'admin'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Role Description Badge */}
          <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
            <span>
              {selectedRole === 'volunteer' && 'Akses: Asesmen triase lapangan & perekaman STT'}
              {selectedRole === 'hospital' && 'Akses: Penerimaan pasien rujukan RS & koordinasi medis'}
              {selectedRole === 'admin' && 'Akses: Pusat komando, analitik, & manajemen tambah pengguna'}
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 bg-red-50 text-red-800 text-xs rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Username / Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-xs text-slate-900 outline-none transition"
                  required
                />
                <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-xs text-slate-900 outline-none transition"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition disabled:opacity-50"
            >
              <span>{isLoading ? 'Memproses Masuk...' : 'Masuk (Sign In)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Informasi Akun Terdaftar */}
          <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold block text-slate-600">Akun Terdaftar:</span>
            <div className="flex flex-wrap justify-center gap-1.5 text-[10px] text-slate-700 font-mono">
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">volunteer</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">rumahsakit</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">admin</span>
            </div>
            <span className="text-[10px] text-slate-400 block">Sandi default: <code className="font-mono text-slate-600">password123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};
