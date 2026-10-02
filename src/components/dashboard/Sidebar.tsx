import React from 'react';
import {
  IconRadar2,
  IconActivityHeartbeat,
  IconUsers,
  IconBuildingCommunity,
  IconFileSpreadsheet,
  IconHeartHandshake,
  IconClipboardList,
  IconId,
  IconBuildingHospital,
  IconHistory,
  IconWifiOff,
  IconArrowRight,
  IconX,
} from '@tabler/icons-react';

export interface SidebarProps {
  activeItem: string;
  onSelectItem: (id: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  offlineCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onSelectItem,
  isMobileOpen = false,
  onCloseMobile,
  offlineCount = 0,
}) => {
  const navGroups = [
    {
      label: 'COMMAND CENTER',
      items: [
        { id: 'overview', label: 'Pusat Komando', icon: IconRadar2 },
        { id: 'longitudinal', label: 'Data Longitudinal', icon: IconActivityHeartbeat },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { id: 'users', label: 'Manajemen Relawan', icon: IconUsers },
        { id: 'posko', label: 'Posko & Sumber Daya', icon: IconBuildingCommunity },
      ],
    },
    {
      label: 'REPORTING',
      items: [{ id: 'laporan', label: 'Laporan', icon: IconFileSpreadsheet }],
    },
    {
      label: 'MASTER DATA',
      items: [
        { id: 'penyintas', label: 'Penyintas', icon: IconHeartHandshake },
        { id: 'asesmen', label: 'Asesmen', icon: IconClipboardList },
        { id: 'relawan-master', label: 'Relawan', icon: IconId },
        { id: 'faskes', label: 'Faskes & Rujukan', icon: IconBuildingHospital },
        { id: 'log', label: 'Log Aktivitas', icon: IconHistory },
      ],
    },
  ];

  const handleNavClick = (id: string) => {
    onSelectItem(id);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-white text-slate-700 select-none">
      {/* Navigation Sections */}
      <div className="py-4 px-3 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <h4 className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {group.label}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                      stroke={isActive ? 2.2 : 1.8}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Offline Status Footer Card */}
      <div className="p-3 border-t border-slate-100">
        <div
          onClick={() => handleNavClick('offline')}
          className="p-2.5 rounded-xl border border-red-100 bg-red-50/40 hover:bg-red-50/80 transition-colors cursor-pointer flex items-center justify-between group"
          title="Data tersimpan lokal di IndexedDB/Browser"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <IconWifiOff className="w-3.5 h-3.5" stroke={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-red-700 leading-tight">
                Mode Offline
              </div>
              <div className="text-[10px] text-slate-500 leading-tight truncate">
                {offlineCount > 0 ? `${offlineCount} data pending` : 'Data tersimpan lokal'}
              </div>
            </div>
          </div>
          <IconArrowRight
            className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all shrink-0"
            stroke={2}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[230px] shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-57px)] sticky top-[57px] z-20 self-start">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white z-50 shadow-xl transition-transform duration-200 ease-in-out lg:hidden flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              RM
            </div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
              RAPID-MIND Menu
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">{sidebarContent}</div>
      </div>
    </>
  );
};
