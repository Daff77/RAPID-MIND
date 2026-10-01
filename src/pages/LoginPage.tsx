import React, { useState } from 'react';
import {
  Shield,
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
}) => {
  const { login } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    });

    setIsLoading(false);

    if (res.success && res.role) {
      onLoginSuccess(res.role);
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
                  placeholder="Masukkan username atau email"
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
                  placeholder="Masukkan kata sandi"
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
              className="w-full rm-btn-primary min-h-[52px] text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Memproses Masuk...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Production Security & Encryption Notice */}
          <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Koneksi aman terenkripsi · RAPID-MIND v2.0 Production</span>
          </div>
        </div>
      </div>
    </div>
  );
};
