import React, { useState } from 'react';
import {
  Smartphone,
  Shield,
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
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
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>(
    defaultRole === 'admin' ? 'admin' : 'volunteer'
  );
  const [password, setPassword] = useState<string>(
    defaultRole === 'admin' ? 'admin123' : 'volunteer123'
  );
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'admin') {
      setUsernameOrEmail('admin');
      setPassword('admin123');
    } else {
      setUsernameOrEmail('volunteer');
      setPassword('volunteer123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMessage('Please enter credentials.');
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
      setErrorMessage(res.error || 'Invalid credentials.');
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    quickLogin(role);
    onLoginSuccess(role);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-sm space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white font-black text-lg shadow-sm">
            RM
          </div>
          <h1 className="text-xl font-black text-slate-900">
            RAPID-MIND
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          {/* Role Switch */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
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
                Username
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
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Buttons */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block text-center">
              1-Click Demo Pass
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('volunteer')}
                className="py-2 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-left transition"
              >
                <span className="text-xs font-bold text-emerald-900 block">Volunteer</span>
                <span className="text-[10px] text-emerald-700 block">Posko A (Siti)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-2 px-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-left transition"
              >
                <span className="text-xs font-bold text-blue-900 block">Admin</span>
                <span className="text-[10px] text-blue-700 block">Central Hub (Sarah)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
