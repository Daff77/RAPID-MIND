import React from 'react';
import {
  IconBrain,
  IconWifi,
  IconWifiOff,
  IconCloud,
  IconDatabase,
  IconRefresh,
  IconHistory,
} from '@tabler/icons-react';
import {
  ArrowRightOnRectangleIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';

interface VolunteerHeaderProps {
  currentTab: 'home' | 'history';
  onSelectTab: (tab: 'home' | 'history') => void;
}

export const VolunteerHeader: React.FC<VolunteerHeaderProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { currentUser, logout } = useAuth();
  const {
    isOnline,
    toggleOnlineStatus,
    offlineQueue,
    allAssessments,
    triggerSync,
    isSyncing,
    syncSuccessBanner,
    isUsingSupabase,
    isIndexedDBReady,
  } = useAssessment();

  const pendingCount = allAssessments.filter((a) => a.syncStatus === 'pending').length;

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
          <div className="w-8 h-8 rounded-lg bg-[var(--rm-action-primary)] text-white flex items-center justify-center font-black shadow-xs transition group-hover:bg-[var(--rm-action-hover)]">
            <IconBrain className="w-5 h-5" stroke={2.2} />
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
            title={isOnline ? 'Status Jaringan: Online (Terhubung Server)' : 'Status Jaringan: Offline (Penyimpanan Lokal Aktif)'}
            aria-label={isOnline ? 'Status Jaringan: Online' : 'Status Jaringan: Offline'}
          >
            {isOnline ? (
              <>
                <IconWifi className="w-3.5 h-3.5 text-emerald-700 shrink-0" stroke={2.5} />
                <span className="tracking-wide text-[11px]">ONLINE</span>
              </>
            ) : (
              <>
                <IconWifiOff className="w-3.5 h-3.5 text-amber-800 shrink-0" stroke={2.5} />
                <span className="tracking-wide text-[11px]">OFFLINE</span>
              </>
            )}
          </button>

          {/* Database Engine Chip (Laravel Cloud API vs IndexedDB Browser) */}
          {isUsingSupabase ? (
            <span
              className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              title="Terhubung ke Server Pusat (Laravel 13 API & PostgreSQL)"
            >
              <IconCloud className="w-3.5 h-3.5 text-emerald-600" stroke={2} />
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
              <IconDatabase className={`w-3.5 h-3.5 ${isIndexedDBReady ? 'text-blue-600' : 'text-slate-500'}`} stroke={2} />
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

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title={`Keluar (${currentUser.name})`}
                aria-label="Keluar dari sesi relawan"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-50 border-t border-amber-200 px-3.5 sm:px-4 py-1.5 text-xs text-amber-950 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5 min-w-0">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-700 shrink-0" />
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

      {/* Pending Sync Strip (When Online and items exist in queue or isSyncing) */}
      {isOnline && (pendingCount > 0 || isSyncing) && (
        <div className="bg-blue-50 border-t border-blue-200 px-3.5 sm:px-4 py-1.5 text-xs text-blue-950 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5">
            <IconRefresh className={`w-4 h-4 text-blue-700 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} stroke={2} />
            <span>
              <strong>KONEKSI AKTIF:</strong>{' '}
              {isSyncing ? 'Sedang menyinkronkan otomatis ke server pusat...' : `${pendingCount} data antrean (auto-sync aktif).`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="px-2.5 py-1 rounded-md bg-[var(--rm-action-primary)] hover:bg-[var(--rm-action-hover)] text-white font-bold text-[11px] transition shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          </button>
        </div>
      )}

      {/* Sync Success Banner */}
      {syncSuccessBanner && (
        <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-1 text-xs text-emerald-900 font-bold flex items-center justify-center gap-1.5 max-w-2xl mx-auto animate-in fade-in">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
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
          <IdentificationIcon className="w-4 h-4" />
          <span>Identifikasi Penyintas</span>
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
          <IconHistory className="w-4 h-4" stroke={2} />
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
