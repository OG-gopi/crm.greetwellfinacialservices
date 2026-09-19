import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Package,
  ShieldCheck,
  Sliders,
  RefreshCw,
  MessageSquare,
  BarChart3,
  ChevronRight,
  X,
  Crown,
} from 'lucide-react';
import { GFSLogo } from './GFSLogo';

interface SidebarIconLoadingProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  variant?: 'blue' | 'emerald' | 'purple';
  roleName?: string;
}

export const SidebarIconLoading: React.FC<SidebarIconLoadingProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  variant = 'blue',
  roleName = 'GFS Portal',
}) => {
  const getThemeClasses = () => {
    switch (variant) {
      case 'emerald':
        return {
          bg: 'bg-[#e8f7f2]',
          border: 'border-emerald-200/80',
          buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
          badgeText: 'text-emerald-950 border-emerald-300/80',
          iconColor: 'text-emerald-700',
        };
      case 'purple':
        return {
          bg: 'bg-[#f3edfd]',
          border: 'border-purple-200/80',
          buttonBg: 'bg-purple-600 hover:bg-purple-700',
          badgeText: 'text-purple-950 border-purple-300/80',
          iconColor: 'text-purple-600',
        };
      case 'blue':
      default:
        return {
          bg: 'bg-[#e8f1fd]',
          border: 'border-blue-200/80',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          badgeText: 'text-[#1e3a8a] border-blue-200/80',
          iconColor: 'text-[#1d63ed]',
        };
    }
  };

  const theme = getThemeClasses();

  const loadingIcons = [
    { icon: LayoutDashboard, title: 'Dashboard' },
    { icon: Users, title: 'Users & Customers' },
    { icon: FileText, title: 'Applications' },
    { icon: FolderOpen, title: 'Documents' },
    { icon: Package, title: 'Products & Services' },
    { icon: ShieldCheck, title: 'Roles & Access' },
    { icon: Sliders, title: 'System Management' },
    { icon: RefreshCw, title: 'Updates & Versions' },
    { icon: MessageSquare, title: 'Support & Enquiries' },
    { icon: BarChart3, title: 'Reports' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full ${theme.bg} text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${theme.border} border-r shadow-sm relative ${
          isCollapsed ? 'lg:w-20 w-64' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`hidden lg:flex absolute -right-3 top-6 z-20 w-6 h-6 rounded-full ${theme.buttonBg} text-white shadow-md items-center justify-center transition-all cursor-pointer border-2 border-white`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}

        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Logo & Role Badge */}
          <div className={`pt-4 pb-4 px-3 flex flex-col items-center justify-center relative ${theme.bg}`}>
            <button
              onClick={onClose}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-900 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="transition-all">
              <GFSLogo size={isCollapsed ? 'sm' : 'lg'} variant="card" />
            </div>

            <div
              className={`mt-3 px-3 py-1 rounded-full bg-white/90 ${theme.badgeText} text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all ${
                isCollapsed ? 'px-2 py-1' : 'px-4 py-1.5'
              }`}
            >
              <Crown className={`w-4 h-4 ${theme.iconColor} flex-shrink-0`} />
              {!isCollapsed && <span>{roleName}</span>}
            </div>
          </div>

          {/* Icon-Only Navigation Loading Items */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1.5 custom-scrollbar">
            {loadingIcons.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  title={item.title}
                  className={`flex items-center h-12 rounded-xl transition-all ${
                    isCollapsed ? 'justify-center px-0' : 'px-4 justify-start'
                  } ${theme.iconColor} hover:bg-white/40`}
                >
                  <IconComp className={`h-[22px] w-[22px] flex-shrink-0 ${theme.iconColor}`} />
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
