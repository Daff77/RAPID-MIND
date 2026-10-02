import React from 'react';
import {
  LayoutDashboard,
  ListFilter,
  ClipboardList,
} from 'lucide-react';
import {
  IconBuildingHospital,
  IconDatabase,
  IconUsers,
  IconSettings,
} from '@tabler/icons-react';

export type SidebarTab =
  | 'dashboard'
  | 'antrian'
  | 'rujukan'
  | 'asesmen'
  | 'data'
  | 'relawan'
  | 'pengaturan';

interface HealthcareSidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  referralBadgeCount?: number;
}

export const HealthcareSidebar: React.FC<HealthcareSidebarProps> = ({
  activeTab,
  onSelectTab,
  referralBadgeCount = 2,
}) => {
  const navItems = [
    {
      id: 'dashboard' as SidebarTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'antrian' as SidebarTab,
      label: 'Antrean',
      icon: ListFilter,
    },
    {
      id: 'rujukan' as SidebarTab,
      label: 'Rujukan & Transport',
      icon: IconBuildingHospital,
      badge: referralBadgeCount > 0 ? referralBadgeCount : undefined,
    },
    {
      id: 'asesmen' as SidebarTab,
      label: 'Asesmen',
      icon: ClipboardList,
    },
    {
      id: 'data' as SidebarTab,
      label: 'Data',
      icon: IconDatabase,
    },
    {
      id: 'relawan' as SidebarTab,
      label: 'Relawan',
      icon: IconUsers,
    },
    {
      id: 'pengaturan' as SidebarTab,
      label: 'Pengaturan',
      icon: IconSettings,
    },
  ];

  return (
    <aside className="w-52 shrink-0 bg-white border-r border-slate-100 p-4 flex-col justify-between hidden md:flex">
      <div className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center justify-between text-xs transition cursor-pointer ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-slate-900' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black flex items-center justify-center border border-rose-200">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Bottom: Faskes Status Info */}
      <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium text-center">
        <span>RAPID-MIND v2.0 · Faskes Terpadu</span>
      </div>
    </aside>
  );
};
