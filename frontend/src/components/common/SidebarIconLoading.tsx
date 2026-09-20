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
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarIconLoadingProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  variant?: 'blue' | 'emerald' | 'purple' | 'amber';
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
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getThemeClasses = () => {
    switch (variant) {
      case 'emerald':
        return {
          bg: 'bg-[#f0faf6] text-slate-800',
          border: 'border-emerald-200/80',
          buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          badgeBg: 'bg-white/95 text-emerald-900 border border-emerald-200 shadow-sm',
          iconColor: 'text-emerald-600',
        };
      case 'purple':
        return {
          bg: 'bg-[#f6f2fd] text-slate-800',
          border: 'border-purple-200/80',
          buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white',
          badgeBg: 'bg-white/95 text-purple-900 border border-purple-200 shadow-sm',
          iconColor: 'text-purple-600',
        };
      case 'amber':
        return {
          bg: 'bg-[#fdf9f0] text-slate-800',
          border: 'border-amber-200/80',
          buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
          badgeBg: 'bg-white/95 text-amber-900 border border-amber-200 shadow-sm',
          iconColor: 'text-amber-600',
        };
      case 'blue':
      default:
        return {
          bg: 'bg-[#f0f5ff] text-slate-800',
          border: 'border-blue-200/80',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
          badgeBg: 'bg-white/95 text-[#1e3a8a] border border-blue-200 shadow-sm',
          iconColor: 'text-blue-600',
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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container: Light Theme */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full ${theme.bg} backdrop-blur-md flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${theme.border} border-r shadow-md relative ${
          isCollapsed ? 'lg:w-20 w-64' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`hidden lg:flex absolute -right-3 top-7 z-20 w-6 h-6 rounded-full ${theme.buttonBg} shadow-md items-center justify-center transition-transform hover:scale-110 cursor-pointer border-2 border-white`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}

        <div className="flex flex-col h-full overflow-hidden">
          {/* Identity Area: GFS Company Logo + Dynamic Role */}
          <div className="pt-5 pb-4 px-3 flex flex-col items-center justify-center relative border-b border-black/5">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-black/5 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="transition-all duration-300 transform hover:scale-105">
              <GFSLogo size={isCollapsed ? 'xs' : 'sm'} variant="card" />
            </div>

            {!isCollapsed ? (
              <div className={`mt-3 px-3.5 py-1 rounded-full ${theme.badgeBg} text-[11px] font-bold tracking-wide flex items-center gap-1.5 transition-all`}>
                <Crown className={`w-3.5 h-3.5 ${theme.iconColor} flex-shrink-0`} />
                <span>{roleName}</span>
              </div>
            ) : (
              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            )}
          </div>

          {/* Navigation Items (Icon skeleton) */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5 custom-scrollbar">
            {loadingIcons.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <SidebarTooltip key={idx} content={item.title} isCollapsed={isCollapsed}>
                  <div
                    className={`flex items-center h-11 rounded-xl transition-all w-full ${
                      isCollapsed ? 'justify-center px-0' : 'px-3.5 justify-start'
                    } text-slate-500 hover:text-slate-900 hover:bg-white/60`}
                  >
                    <IconComp className={`h-5 w-5 flex-shrink-0 ${theme.iconColor} animate-pulse`} />
                  </div>
                </SidebarTooltip>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default SidebarIconLoading;
