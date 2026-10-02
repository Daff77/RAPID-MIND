import React, { useState } from 'react';
import {
  IconBrain,
  IconBell,
  IconChevronDown,
  IconMenu2,
  IconLogout,
  IconCloudCheck,
} from '@tabler/icons-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';

interface DashboardHeaderProps {
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  onToggleMobileSidebar?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onToggleMobileSidebar,
}) => {
  const { currentUser, logout } = useAuth();
  const { kpiStats } = useAssessment();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const t0AlertCount = kpiStats?.t0Count || 1;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="w-full px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Buka menu navigasi"
            >
              <IconMenu2 className="w-5 h-5" />
            </button>
          )}

          {/* Simple Blue Identity Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <IconBrain className="w-5 h-5 text-white" stroke={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-slate-900">
                  RAPID-MIND
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-mono">
                  BPBD / DINKES
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-none">
                Disaster Response Monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Right: Status, Notification, User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Central Command Active Live Status Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 select-none"
            title="Pusat Komando BPBD/Dinkes Aktif & Terhubung Real-Time"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pusat Aktif</span>
          </div>

          {/* Notification Indicator with Red Badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Peringatan sistem"
            >
              <IconBell className="w-4 h-4 text-slate-600" stroke={1.8} />
              {t0AlertCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  {t0AlertCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-3 space-y-2 z-50 text-xs animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900">Pemberitahuan Sistem</span>
                  <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                    {t0AlertCount} Kasus T0
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-red-50/60 border border-red-100">
                    <p className="font-bold text-red-900 text-[11px]">
                      Peringatan Kritis T0 Terdeteksi
                    </p>
                    <p className="text-slate-600 text-[10px] mt-0.5">
                      Penyintas Posko B memerlukan verifikasi tele-emergency dan siaga PSC 119.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-600 text-[11px]">
                    <IconCloudCheck className="w-4 h-4 text-emerald-600 shrink-0" stroke={2} />
                    <span>Semua pangkalan data posko terhubung.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Area */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer text-left"
            >
              {/* Doctor Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden shrink-0 border border-slate-200">
                <span>SA</span>
              </div>

              {/* Name & Role Text */}
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.name || 'dr. Sarah Amanda, Sp.KJ'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 leading-tight">
                  {currentUser?.title || 'Incident Psychological Coordinator'}
                </span>
              </div>

              <IconChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900">{currentUser?.name || 'dr. Sarah Amanda, Sp.KJ'}</div>
                  <div className="text-[10px] text-slate-500">{currentUser?.role === 'admin' ? 'Koordinator Posko BPBD/Dinkes' : 'Tenaga Kesehatan'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                >
                  <IconLogout className="w-4 h-4" />
                  <span>Keluar Sistem</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
