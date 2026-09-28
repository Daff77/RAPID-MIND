import React from 'react';
import { WifiOff, LogOut, Cloud, Database } from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';

interface VolunteerHeaderProps {
  currentTab: 'home' | 'history';
  onSelectTab: (tab: 'home' | 'history') => void;
  onGoToDashboard?: () => void;
}

export const VolunteerHeader: React.FC<VolunteerHeaderProps> = ({
  currentTab,
  onSelectTab,
  onGoToDashboard,
}) => {

  const { currentUser, logout } = useAuth();
  const {
    isOnline,
    toggleOnlineStatus,
    offlineQueue,
    triggerSync,
    isSyncing,
    syncSuccessBanner,
    isUsingSupabase,
  } = useAssessment();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      {/* Compact Main Bar */}
      <div className="px-4 py-2.5 max-w-lg mx-auto flex items-center justify-between gap-3">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => onSelectTab('home')}
        >
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-xs">
            RM
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            RAPID-MIND
          </span>
        </div>

        {/* Status & Profile */}
        <div className="flex items-center gap-2">
          {/* Status Toggle Button (Fitur Efisiensi Garda Depan: [📶 OFF] / [📶 ON]) */}
          <button
            type="button"
            onClick={() => toggleOnlineStatus()}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition ${
              isOnline
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-100 border-amber-300 text-amber-900 font-extrabold'
            }`}
            title="Klik untuk beralih mode online / offline (IndexedDB Sync)"
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>[📶 ON]</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                <span>[📶 OFF]</span>
              </>
            )}
          </button>

          {/* Database Mode Badge */}
          {isUsingSupabase ? (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
              title="Terhubung ke Supabase Cloud PostgreSQL"
            >
              <Cloud className="w-3 h-3 text-emerald-600" />
              <span>Supabase</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
              title="Mode Lokal (Data tersimpan di Browser/LocalStorage). Atur .env untuk koneksi Supabase."
            >
              <Database className="w-3 h-3 text-slate-500" />
              <span>Lokal</span>
            </span>
          )}

          {/* Volunteer Profile & Sign Out */}
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {currentUser.badgeNumber}
              </span>
              {currentUser.role === 'admin' && onGoToDashboard && (
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-700 border border-indigo-200"
                  title="Ke Command Center"
                >
                  Admin
                </button>
              )}
              {currentUser.role === 'hospital' && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '/hospital';
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 font-bold text-emerald-800 border border-emerald-200"
                  title="Ke Portal RS"
                >
                  Portal RS
                </button>
              )}
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

      {/* Simplified Offline Notification */}
      {!isOnline && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between max-w-lg mx-auto">
          <span>
            <strong>OFFLINE</strong> · Saved on device {offlineQueue.length > 0 ? `· Pending: ${offlineQueue.length}` : ''}
          </span>
          <button
            type="button"
            onClick={() => toggleOnlineStatus(true)}
            className="text-[11px] font-bold underline text-amber-900 hover:text-black"
          >
            Connect
          </button>
        </div>
      )}

      {/* Simplified Online Sync Banner */}
      {isOnline && offlineQueue.length > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-1.5 text-xs text-blue-900 flex items-center justify-between max-w-lg mx-auto">
          <span>
            <strong>ONLINE</strong> · {offlineQueue.length} ready to sync
          </span>
          <button
            type="button"
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-2xs"
          >
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      )}

      {/* Success Notification */}
      {syncSuccessBanner && (
        <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-1 text-xs text-emerald-800 font-semibold text-center max-w-lg mx-auto">
          ✓ Synced
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="max-w-lg mx-auto px-4 flex border-t border-slate-100 bg-white">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex-1 py-2 px-3 text-xs font-semibold text-center border-b-2 transition ${
            currentTab === 'home'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Screen 2: Identitas / Auto-Lookup
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('history')}
          className={`flex-1 py-2 px-3 text-xs font-semibold text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
            currentTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Riwayat Skrining</span>
          {offlineQueue.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {offlineQueue.length}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
};
