import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  LogOut,
  Users,
  Cloud,
  Database,
  Wifi,
  WifiOff,
  Activity,
  Layers,
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';

interface DashboardHeaderProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const { currentUser, logout } = useAuth();
  const { offlineQueue, triggerSync, isSyncing, isUsingSupabase, isIndexedDBReady, isOnline } = useAssessment();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Organization */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-black text-xs shadow-xs">
            RM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-slate-900">
                RAPID-MIND
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                BPBD / DINKES
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 leading-tight">
              Disaster Response Monitoring · Pusat Komando & Pengendalian
            </p>
          </div>
        </div>

        {/* System & Connection Status */}
        <div className="flex items-center gap-2.5">
          {/* Realtime Network Status */}
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title={isOnline ? 'Koneksi jaringan internet aktif' : 'Mode offline, data disimpan lokal'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Cloud / IndexedDB Storage Status */}
          {isUsingSupabase ? (
            <span
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
              title="Terhubung ke Laravel API & PostgreSQL Cloud Database"
            >
              <Cloud className="w-3 h-3 text-blue-600" />
              <span>Laravel Cloud</span>
            </span>
          ) : (
            <span
              className={`hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition ${
                isIndexedDBReady
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title={
                isIndexedDBReady
                  ? 'Database Browser: IndexedDB Aktif (RAPIDMIND_INDEXED_DB)'
                  : 'Penyimpanan lokal browser'
              }
            >
              <Database className="w-3 h-3 text-slate-600" />
              <span>{isIndexedDBReady ? 'IndexedDB' : 'Local DB'}</span>
            </span>
          )}

          {/* Sync Trigger Button */}
          {offlineQueue.length > 0 && (
            <button
              type="button"
              onClick={() => triggerSync()}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs"
              title="Sinkronisasi data pending ke server pusat"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync ({offlineQueue.length})</span>
            </button>
          )}

          {/* Admin Identity & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {currentUser.title || 'Koordinator Posko'}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title={`Keluar (${currentUser.name})`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-100 bg-white">
        {[
          { id: 'overview', label: 'Pusat Komando & Geospasial', icon: Layers },
          { id: 'longitudinal', label: 'Data Longitudinal (30 Hari)', icon: Activity },
          { id: 'users', label: 'Manajemen Relawan & Posko Sumber Daya', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectSection(tab.id)}
              className={`py-2 px-3 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
                isActive
                  ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
