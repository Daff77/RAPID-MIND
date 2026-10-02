import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ShieldExclamationIcon } from '@heroicons/react/24/solid';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { IconShieldLock } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';

interface UnauthorizedCardProps {
  onGoBack: () => void;
  onSwitchAccount: () => void;
}

export const UnauthorizedCard: React.FC<UnauthorizedCardProps> = ({
  onGoBack,
  onSwitchAccount,
}) => {
  const { currentUser, logout } = useAuth();

  const handleSwitch = () => {
    logout();
    onSwitchAccount();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-lg text-center space-y-5 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
          <ShieldExclamationIcon className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 inline-block">
            Access Restricted
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            Command Center Requires Admin Access
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            You are currently logged in as{' '}
            <strong className="text-slate-900">{currentUser?.name || 'Volunteer'}</strong>{' '}
            (<span className="font-mono">{currentUser?.badgeNumber || 'VOL'}</span>).
            The Command Center situation dashboard is restricted to Incident Coordinators and Regional Administrators.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <IconShieldLock className="w-4 h-4 text-slate-600" stroke={2} />
            <span>Role-Based Access Policy</span>
          </div>
          <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
            <li><strong>Field Volunteer:</strong> Screening tools, voice STT, PFA guidance, local storage.</li>
            <li><strong>Command Center Admin:</strong> Central KPI analytics, sector map, sync gateway, registries.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onGoBack}
            className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Volunteer App</span>
          </button>

          <button
            type="button"
            onClick={handleSwitch}
            className="h-11 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 text-slate-500" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
