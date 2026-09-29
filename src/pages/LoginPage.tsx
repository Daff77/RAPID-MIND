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
    <div className="min-h-screen bg-[var(--rm-bg-canvas)] text-slate-900 flex flex-col justify-center items-center px-4 py-8 font-sans">
      <div className="w-full max-w-sm sm:max-w-md space-y-4">
        {/* Professional Clinical Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold text-base shadow-xs">
            RM
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              RAPID-MIND
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Sistem Triase & Rujukan Kesehatan Mental Bencana Terintegrasi
            </p>
          </div>
        </div>

        {/* Main Card — Flat Surface, Subtle Border, Controlled Elevation */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* 3-Role Switch: Volunteer | Rumah Sakit | Admin */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
              Pilih Akses Peran:
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'volunteer'}
                onClick={() => handleRoleChange('volunteer')}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                  selectedRole === 'volunteer'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Volunteer</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'hospital'}
                onClick={() => handleRoleChange('hospital')}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                  selectedRole === 'hospital'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>RS</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'admin'}
                onClick={() => handleRoleChange('admin')}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                  selectedRole === 'admin'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Role Description Badge */}
          <div className="text-[11px] text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <span>
              {selectedRole === 'volunteer' && 'Akses: Asesmen triase lapangan & penapisan PFA/SRQ'}
              {selectedRole === 'hospital' && 'Akses: Penerimaan pasien rujukan RS & koordinasi medis'}
              {selectedRole === 'admin' && 'Akses: Pusat komando, analitik data, & audit sistem'}
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label htmlFor="login-username" className="text-xs font-bold text-slate-700 block">
                Username / Email
              </label>
              <div className="relative">
                <input
                  id="login-username"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition min-h-[44px]"
                  required
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="text-xs font-bold text-slate-700 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition min-h-[44px]"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rm-btn-primary min-h-[48px] text-xs sm:text-sm font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Memproses Masuk...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Akun Demonstrasi Lapangan */}
          <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1.5">
            <span className="font-semibold block text-slate-600">Akun Simulasi:</span>
            <div className="flex flex-wrap justify-center gap-1.5 text-[11px] text-slate-700 font-mono">
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">volunteer</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">rumahsakit</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">admin</span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Sandi default: <code className="font-mono text-slate-600 font-bold">password123</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
