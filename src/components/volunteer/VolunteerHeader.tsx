import React from 'react';
import {
  Wifi,
  WifiOff,
  LogOut,
  Cloud,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  History,
  Shield,
  Building2,
} from 'lucide-react';
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
    isIndexedDBReady,
  } = useAssessment();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      {/* Primary Top Bar */}
      <div className="px-3.5 sm:px-4 py-2.5 max-w-2xl mx-auto flex items-center justify-between gap-2.5">
        {/* Left: Brand & Role Identity */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none group"
          onClick={() => onSelectTab('home')}
          title="RAPID-MIND: Beranda Relawan"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--rm-action-primary)] text-white flex items-center justify-center font-black text-xs shadow-xs transition group-hover:bg-[var(--rm-action-hover)]">
            RM
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-[var(--rm-text-primary)]">
                RAPID-MIND
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-50 text-[var(--rm-action-primary)] border border-blue-200 hidden xs:inline-block">
                Relawan
              </span>
            </div>
            <p className="text-[10px] text-[var(--rm-text-muted)] font-medium leading-none hidden sm:block">
              Sistem Triase Kesehatan Mental Bencana
            </p>
          </div>
        </div>

        {/* Right: Operational Status, Storage Mode & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Status Toggle Button (ONLINE / OFFLINE) */}
          <button
            type="button"
            onClick={() => toggleOnlineStatus()}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition active:scale-95 ${
              isOnline
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-100 border-amber-300 text-amber-900 font-extrabold'
            }`}
            title="Klik untuk beralih mode simulasi Online / Offline"
            aria-label={isOnline ? 'Status: Online' : 'Status: Offline'}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="tracking-wide text-[11px]">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                <span className="tracking-wide text-[11px]">OFFLINE</span>
              </>
            )}
          </button>

          {/* Database Engine Chip (Supabase Cloud vs IndexedDB Browser) */}
          {isUsingSupabase ? (
            <span
              className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              title="Terhubung ke Cloud PostgreSQL (Supabase)"
            >
              <Cloud className="w-3 h-3 text-emerald-600" />
              <span>Cloud</span>
            </span>
          ) : (
            <span
              className={`hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                isIndexedDBReady
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={
                isIndexedDBReady
                  ? 'Penyimpanan Lokal: IndexedDB Aktif (Kapasitas Besar)'
                  : 'Penyimpanan Lokal: Local Storage'
              }
            >
              <Database className={`w-3 h-3 ${isIndexedDBReady ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>{isIndexedDBReady ? 'IndexedDB' : 'Lokal'}</span>
            </span>
          )}

          {/* User Profile & Navigation */}
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              <span
                className="text-xs font-semibold text-slate-700 font-mono hidden md:inline"
                title={`Relawan: ${currentUser.name}`}
              >
                {currentUser.badgeNumber || currentUser.name}
              </span>

              {/* Role Shortcut: Admin Command Center if Authorized */}
              {currentUser.role === 'admin' && onGoToDashboard && (
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-700 border border-indigo-200 transition"
                  title="Buka Command Center BPBD / Dinkes"
                >
                  <Shield className="w-3 h-3 inline mr-1" />
                  Admin
                </button>
              )}

              {/* Role Shortcut: Hospital Portal if Authorized */}
              {currentUser.role === 'hospital' && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '/hospital';
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 font-bold text-emerald-800 border border-emerald-200 transition"
                  title="Buka Portal Faskes / Rumah Sakit"
                >
                  <Building2 className="w-3 h-3 inline mr-1" />
                  RS
                </button>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title={`Keluar (${currentUser.name})`}
                aria-label="Keluar dari sesi relawan"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-50 border-t border-amber-200 px-3.5 sm:px-4 py-1.5 text-xs text-amber-950 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate">
              <strong>OFFLINE MODE:</strong> Data tersimpan aman di IndexedDB perangkat.
              {offlineQueue.length > 0 && (
                <span className="font-bold ml-1">({offlineQueue.length} antrean pending)</span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleOnlineStatus(true)}
            className="text-[11px] font-bold text-amber-900 hover:text-black underline ml-2 shrink-0 cursor-pointer"
          >
            Aktifkan Online
          </button>
        </div>
      )}

      {/* Pending Sync Strip (When Online and items exist in queue) */}
      {isOnline && offlineQueue.length > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 px-3.5 sm:px-4 py-1.5 text-xs text-blue-950 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              <strong>KONEKSI AKTIF:</strong> {offlineQueue.length} data skrining siap disinkronkan.
            </span>
          </div>
          <button
            type="button"
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="px-2.5 py-1 rounded-md bg-[var(--rm-action-primary)] hover:bg-[var(--rm-action-hover)] text-white font-bold text-[11px] transition shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Sekarang'}
          </button>
        </div>
      )}

      {/* Sync Success Banner */}
      {syncSuccessBanner && (
        <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-1 text-xs text-emerald-900 font-bold flex items-center justify-center gap-1.5 max-w-2xl mx-auto animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Seluruh data antrean berhasil disinkronkan ke pusat.</span>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <nav
        className="max-w-2xl mx-auto px-3.5 sm:px-4 flex border-t border-slate-100 bg-white"
        aria-label="Navigasi Menu Relawan"
      >
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer ${
            currentTab === 'home'
              ? 'border-[var(--rm-action-primary)] text-[var(--rm-action-primary)]'
              : 'border-transparent text-[var(--rm-text-secondary)] hover:text-[var(--rm-text-primary)] hover:bg-slate-50'
          }`}
          aria-selected={currentTab === 'home'}
        >
          <UserCheck className="w-4 h-4" />
          <span>Screen 2: Identifikasi Penyintas</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('history')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer ${
            currentTab === 'history'
              ? 'border-[var(--rm-action-primary)] text-[var(--rm-action-primary)]'
              : 'border-transparent text-[var(--rm-text-secondary)] hover:text-[var(--rm-text-primary)] hover:bg-slate-50'
          }`}
          aria-selected={currentTab === 'history'}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Skrining</span>
          {offlineQueue.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
              {offlineQueue.length}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
};
