import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileText,
  PlusCircle,
  FolderOpen,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  X,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { GFSLogo } from './GFSLogo';
import { SidebarTooltip } from './SidebarTooltip';
import { SidebarIconLoading } from './SidebarIconLoading';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CustomerSidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  const handleNavItemClick = () => {
    onClose();
  };

  useEffect(() => {
    if (
      location.pathname.startsWith('/customer/applications') ||
      location.pathname.startsWith('/customer/create-application')
    ) {
      setOpenSubMenus({ applications: true });
    } else {
      setOpenSubMenus({});
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleSubMenu = (key: string) => {
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
    }
    setOpenSubMenus((prev) => (prev[key] ? {} : { [key]: true }));
  };

  const handleLogoClick = () => {
    const targetDashboard = '/customer/dashboard';
    if (location.pathname === targetDashboard) {
      window.location.reload();
    } else {
      navigate(targetDashboard);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onClose();
    }
  };

  if (authLoading || !user) {
    return (
      <SidebarIconLoading
        isOpen={isOpen}
        onClose={onClose}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        variant="blue"
        roleName="Customer Portal"
      />
    );
  }

  const userServices: string[] = Array.isArray(user?.serviceTypes)
    ? user.serviceTypes.map((s) => s.toUpperCase())
    : ['LOANS'];
  const hasLoans = userServices.includes('LOANS') || userServices.includes('LOAN');
  const hasInsurance = userServices.includes('INSURANCE');
  const hasInvestments = userServices.includes('INVESTMENT') || userServices.includes('INVESTMENTS');

  const getNavItemClasses = (isActive: boolean) =>
    `group flex items-center h-11 rounded-xl transition-all duration-200 select-none ${
      isCollapsed ? 'justify-center px-0 w-full' : 'px-3.5 justify-start w-full'
    } ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20 border border-blue-400/30'
        : 'text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852] font-semibold'
    }`;

  const getSubItemClasses = (isActive: boolean) =>
    `block py-2 px-3 rounded-lg transition-colors font-semibold text-xs ${
      isActive
        ? 'text-blue-700 font-extrabold bg-blue-100/80 border border-blue-200/80'
        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container: Light Sky Theme */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-[#f0f5ff] text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-blue-200/80 shadow-sm relative ${
          isCollapsed ? 'lg:w-20 w-64' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3 top-7 z-20 w-6 h-6 rounded-full bg-blue-600 text-white shadow-md items-center justify-center hover:bg-blue-700 transition-transform hover:scale-110 cursor-pointer border-2 border-white"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}

        <div className="flex flex-col h-full overflow-hidden">
          {/* Identity Area: GFS Company Logo + Customer Role */}
          <div className="pt-5 pb-4 px-3 flex flex-col items-center justify-center relative border-b border-blue-200/60 bg-gradient-to-b from-blue-100/50 to-transparent">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-black/5 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="transition-transform duration-300 hover:scale-105">
              <GFSLogo size={isCollapsed ? 'xs' : 'sm'} variant="card" onClick={handleLogoClick} />
            </div>
            {!isCollapsed ? (
              <div className="mt-3 px-3.5 py-1 rounded-full bg-white/95 text-[#1e3a8a] border border-blue-200/90 text-[11px] font-extrabold tracking-wide shadow-sm flex items-center justify-center gap-1.5 transition-all">
                <User className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>Customer</span>
              </div>
            ) : (
              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            )}
          </div>

          {/* Navigation List */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1 text-[13.5px] custom-scrollbar">
            {/* SECTION 1: MAIN */}
            {!isCollapsed && (
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-900/60 px-3 pt-2 pb-1">
                Main
              </div>
            )}
            <SidebarTooltip content="Dashboard" isCollapsed={isCollapsed}>
              <NavLink
                to="/customer/dashboard"
                onClick={handleNavItemClick}
                className={({ isActive }) => getNavItemClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <LayoutDashboard
                      className={`h-5 w-5 flex-shrink-0 transition-all ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Dashboard</span>}
                  </>
                )}
              </NavLink>
            </SidebarTooltip>

            {/* SECTION 2: SERVICES & APPLICATIONS */}
            {!isCollapsed && (
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-900/60 px-3 pt-3 pb-1">
                Services & Applications
              </div>
            )}
            <div className="w-full">
              <SidebarTooltip content="My Applications" isCollapsed={isCollapsed}>
                <button
                  onClick={() => toggleSubMenu('applications')}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                  } h-11 rounded-xl transition-all duration-200 text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852] font-semibold ${
                    openSubMenus['applications'] ? 'bg-blue-100/60' : ''
                  }`}
                >
                  <div className="flex items-center truncate">
                    <FileText
                      className={`h-5 w-5 flex-shrink-0 text-blue-600 group-hover:text-blue-700 ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">My Applications</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={`h-4 w-4 text-blue-500 ml-auto flex-shrink-0 transition-transform duration-200 ${
                        openSubMenus['applications'] ? 'rotate-180 text-blue-700' : ''
                      }`}
                    />
                  )}
                </button>
              </SidebarTooltip>
              {openSubMenus['applications'] && !isCollapsed && (
                <div className="pl-9 pr-2 py-1.5 space-y-1 bg-white/80 rounded-xl my-1 border border-blue-100/80 shadow-sm">
                  <NavLink
                    to="/customer/applications"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getSubItemClasses(isActive)}
                  >
                    All Applications
                  </NavLink>
                  {hasLoans && (
                    <NavLink
                      to="/customer/applications?type=LOAN"
                      onClick={handleNavItemClick}
                      className={({ isActive }) => getSubItemClasses(isActive)}
                    >
                      Loan Applications
                    </NavLink>
                  )}
                  {hasInsurance && (
                    <NavLink
                      to="/customer/applications?type=INSURANCE"
                      onClick={handleNavItemClick}
                      className={({ isActive }) => getSubItemClasses(isActive)}
                    >
                      Insurance Applications
                    </NavLink>
                  )}
                  {hasInvestments && (
                    <NavLink
                      to="/customer/applications?type=INVESTMENT"
                      onClick={handleNavItemClick}
                      className={({ isActive }) => getSubItemClasses(isActive)}
                    >
                      Investment Applications
                    </NavLink>
                  )}
                  <NavLink
                    to="/customer/create-application"
                    onClick={handleNavItemClick}
                    className="block py-2 px-3 rounded-lg font-bold text-blue-700 hover:bg-blue-100/80 border-t border-blue-100 mt-1 pt-2 flex items-center gap-1.5"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> + New Application
                  </NavLink>
                </div>
              )}
            </div>

            <SidebarTooltip content="My Documents" isCollapsed={isCollapsed}>
              <NavLink
                to="/customer/documents"
                onClick={handleNavItemClick}
                className={({ isActive }) => getNavItemClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <FolderOpen
                      className={`h-5 w-5 flex-shrink-0 transition-all ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">My Documents</span>}
                  </>
                )}
              </NavLink>
            </SidebarTooltip>

            {/* SECTION 3: ACCOUNT & SUPPORT */}
            {!isCollapsed && (
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-900/60 px-3 pt-3 pb-1">
                Account & Support
              </div>
            )}
            <SidebarTooltip content="Help & Enquiries" isCollapsed={isCollapsed}>
              <NavLink
                to="/customer/enquiries"
                onClick={handleNavItemClick}
                className={({ isActive }) => getNavItemClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <AlertCircle
                      className={`h-5 w-5 flex-shrink-0 transition-all ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Help & Enquiries</span>}
                  </>
                )}
              </NavLink>
            </SidebarTooltip>

            <SidebarTooltip content="Platform Updates" isCollapsed={isCollapsed}>
              <NavLink
                to="/customer/updates"
                onClick={handleNavItemClick}
                className={({ isActive }) => getNavItemClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <Sparkles
                      className={`h-5 w-5 flex-shrink-0 transition-all ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Platform Updates</span>}
                  </>
                )}
              </NavLink>
            </SidebarTooltip>

            <SidebarTooltip content="My Profile" isCollapsed={isCollapsed}>
              <NavLink
                to="/profile"
                onClick={handleNavItemClick}
                className={({ isActive }) => getNavItemClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <UserCheck
                      className={`h-5 w-5 flex-shrink-0 transition-all ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">My Profile</span>}
                  </>
                )}
              </NavLink>
            </SidebarTooltip>
          </nav>

          {/* Footer Logout */}
          <div className="p-3 border-t border-blue-200/80 bg-gradient-to-t from-blue-100/60 to-transparent">
            <SidebarTooltip content="Logout Account" isCollapsed={isCollapsed}>
              <button
                onClick={logout}
                title="Logout Account"
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-rose-600 hover:text-rose-700 bg-white/90 hover:bg-rose-50 border border-rose-200/80 shadow-sm transition-colors font-bold text-xs ${
                  isCollapsed ? 'px-0' : 'px-3'
                }`}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>Logout Account</span>}
              </button>
            </SidebarTooltip>
          </div>
        </div>
      </aside>
    </>
  );
};

export default CustomerSidebar;
