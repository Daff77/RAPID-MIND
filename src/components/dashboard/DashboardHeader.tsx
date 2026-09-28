import React from 'react';
import {
  Smartphone,
  RefreshCw,
  LogOut,
  Building2,
  Users,
  Cloud,
  Database,
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';

interface DashboardHeaderProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
  onGoToVolunteer: () => void;
  onGoToHospital?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeSection,
  onSelectSection,
  onGoToVolunteer,
  onGoToHospital,
}) => {
  const { currentUser, logout } = useAuth();
  const { offlineQueue, triggerSync, isSyncing, isUsingSupabase, isIndexedDBReady } = useAssessment();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
            RM
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-slate-900">
                RAPID-MIND
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                Command
              </span>
              {isUsingSupabase ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200" title="Terhubung ke Supabase Cloud">
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span>Supabase</span>
                </span>
              ) : (
                <span
                  className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition ${
                    isIndexedDBReady
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                  title={
                    isIndexedDBReady
                      ? 'Database Browser: IndexedDB Aktif (RAPIDMIND_INDEXED_DB). Kapasitas tinggi tanpa batas 5MB.'
                      : 'Menggunakan penyimpanan lokal browser'
                  }
                >
                  <Database className={`w-3 h-3 ${isIndexedDBReady ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{isIndexedDBReady ? 'IndexedDB' : 'Local DB'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {offlineQueue.length > 0 && (
            <button
              type="button"
              onClick={() => triggerSync()}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync ({offlineQueue.length})</span>
            </button>
          )}

          {onGoToHospital && (
            <button
              type="button"
              onClick={onGoToHospital}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Portal RS</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGoToVolunteer}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Volunteer App</span>
          </button>

          {/* Admin Identity & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-xs font-bold text-slate-800 hidden md:inline">
                {currentUser.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="p-1 rounded text-slate-400 hover:text-red-600 transition"
                title={`Sign out (${currentUser.name})`}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs (Role 3: Command Center, Data Longitudinal, Manajemen Relawan) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-100 bg-white">
        {[
          { id: 'overview', label: 'Pusat Komando & Geospasial' },
          { id: 'longitudinal', label: 'Data Longitudinal (30 Hari)' },
          { id: 'users', label: 'Manajemen Relawan & Pengguna', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectSection(tab.id)}
            className={`py-2 px-3 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeSection === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
