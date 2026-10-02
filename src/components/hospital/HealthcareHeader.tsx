import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ClockIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { IconBrain } from '@tabler/icons-react';

interface HealthcareHeaderProps {
  userName?: string;
  userRole?: string;
  facilityName?: string;
  onLogout: () => void;
}

export const HealthcareHeader: React.FC<HealthcareHeaderProps> = ({
  userName = 'dr. Budi Santoso, Sp.KJ',
  userRole = 'Tenaga Medis',
  facilityName = 'PSC 119 Aktif',
  onLogout,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Initial avatar letters
  const initials = userName
    .replace(/^dr.s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('') || 'DS';

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-xs">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200/60 flex items-center justify-center shadow-xs shrink-0">
          <IconBrain className="w-5 h-5 text-rose-600" stroke={2} />
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-none">
            RAPID MIND
          </h1>
          <p className="text-[11px] text-slate-400 font-medium tracking-tight mt-0.5">
            Emergency Psychological Triage
          </p>
        </div>
      </div>

      {/* Right: Operational Telemetry & Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Faskes Operational Status: Terhubung Real-Time */}
        <div
          className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50/70 text-emerald-700 text-xs font-semibold"
          title="Portal Faskes & Rujukan Terhubung Langsung ke PSC 119"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Terhubung ? {facilityName}</span>
        </div>

        {/* Timestamp */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>1 Okt 2026, 14:28</span>
        </div>

        {/* Doctor Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-300">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-slate-900 leading-tight block">
                {userName}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                {userRole}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-800">{userName}</p>
                <p className="text-[10px] text-slate-400">{userRole}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer transition"
              >
                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                <span>Keluar Akun (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
