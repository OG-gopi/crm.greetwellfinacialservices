import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  CheckSquare,
  BarChart3,
  UserCheck,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  X,
  LogOut,
  PlusCircle,
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

export const LoanAgentSidebar: React.FC<SidebarProps> = ({
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
    if (location.pathname.startsWith('/loan-agent/customers')) {
      setOpenSubMenus({ customers: true });
    } else if (
      location.pathname.startsWith('/loan-agent/applications') ||
      location.pathname.startsWith('/loan-agent/create-application')
    ) {
      setOpenSubMenus({ applications: true });
    } else if (location.pathname.startsWith('/loan-agent/documents')) {
      setOpenSubMenus({ documents: true });
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
    const targetDashboard = '/loan-agent/dashboard';
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
        variant="emerald"
        roleName="Loan Advisor"
      />
    );
  }

  const getNavItemClasses = (isActive: boolean) =>
    `group flex items-center h-11 rounded-xl transition-all duration-200 select-none ${
      isCollapsed ? 'justify-center px-0 w-full' : 'px-3.5 justify-start w-full'
    } ${
      isActive
        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/20 border border-emerald-400/30'
        : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900 font-semibold'
    }`;

  const getSubItemClasses = (isActive: boolean) =>
    `block py-2 px-3 rounded-lg transition-colors font-semibold text-xs ${
      isActive
        ? 'text-emerald-800 font-extrabold bg-emerald-100/80 border border-emerald-200/80'
        : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
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

      {/* Sidebar Container: Light Mint Theme */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-[#f0faf6] text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-emerald-200/80 shadow-sm relative ${
          isCollapsed ? 'lg:w-20 w-64' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3 top-7 z-20 w-6 h-6 rounded-full bg-emerald-600 text-white shadow-md items-center justify-center hover:bg-emerald-700 transition-transform hover:scale-110 cursor-pointer border-2 border-white"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}

        <div className="flex flex-col h-full overflow-hidden">
          {/* Identity Area: GFS Company Logo + Loan Advisor Role */}
          <div className="pt-5 pb-4 px-3 flex flex-col items-center justify-center relative border-b border-emerald-200/60 bg-gradient-to-b from-emerald-100/50 to-transparent">
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
              <div className="mt-3 px-3.5 py-1 rounded-full bg-white/95 text-emerald-950 border border-emerald-200/90 text-[11px] font-extrabold tracking-wide shadow-sm flex items-center justify-center gap-1.5 transition-all">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Loan Advisor</span>
              </div>
            ) : (
              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            )}
          </div>

          {/* Navigation List */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1 text-[13.5px] custom-scrollbar">
            {/* SECTION 1: MAIN */}
            {!isCollapsed && (
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-900/60 px-3 pt-2 pb-1">
                Loan Desk
              </div>
            )}
            <SidebarTooltip content="Dashboard" isCollapsed={isCollapsed}>
              <NavLink
                to="/loan-agent/dashboard"
                onClick={handleNavItemClick}
                className={({ isActive }) => getNavItemClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <LayoutDashboard
                      className={`h-5 w-5 flex-shrink-0 transition-all ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      } ${isActive ? 'text-white' : 'text-emerald-600 group-hover:text-emerald-700'}`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Dashboard</span>}
                  </>
                )}
              </NavLink>
            </SidebarTooltip>

            {/* SECTION 2: CLIENTS */}
            {!isCollapsed && (
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-900/60 px-3 pt-3 pb-1">
                Clients
              </div>
            )}
            <div className="w-full">
              <SidebarTooltip content="Customers" isCollapsed={isCollapsed}>
                <button
                  onClick={() => toggleSubMenu('customers')}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                  } h-11 rounded-xl transition-all duration-200 text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900 font-semibold ${
                    openSubMenus['customers'] ? 'bg-emerald-100/60' : ''
                  }`}
                >
                  <div className="flex items-center truncate">
                    <Users
                      className={`h-5 w-5 flex-shrink-0 text-emerald-600 group-hover:text-emerald-700 ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Customers</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={`h-4 w-4 text-emerald-500 ml-auto flex-shrink-0 transition-transform duration-200 ${
                        openSubMenus['customers'] ? 'rotate-180 text-emerald-700' : ''
                      }`}
                    />
                  )}
                </button>
              </SidebarTooltip>
              {openSubMenus['customers'] && !isCollapsed && (
                <div className="pl-9 pr-2 py-1.5 space-y-1 bg-white/80 rounded-xl my-1 border border-emerald-100/80 shadow-sm">
                  <NavLink
                    to="/loan-agent/customers"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getSubItemClasses(isActive)}
                  >
                    My Customers
                  </NavLink>
                </div>
              )}
            </div>

            {/* SECTION 3: APPLICATIONS */}
            {!isCollapsed && (
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-900/60 px-3 pt-3 pb-1">
                Applications & Docs
              </div>
            )}
            <div className="w-full">
              <SidebarTooltip content="Applications" isCollapsed={isCollapsed}>
                <button
                  onClick={() => toggleSubMenu('applications')}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                  } h-11 rounded-xl transition-all duration-200 text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900 font-semibold ${
                    openSubMenus['applications'] ? 'bg-emerald-100/60' : ''
                  }`}
                >
                  <div className="flex items-center truncate">
                    <FileText
                      className={`h-5 w-5 flex-shrink-0 text-emerald-600 group-hover:text-emerald-700 ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Applications</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={`h-4 w-4 text-emerald-500 ml-auto flex-shrink-0 transition-transform duration-200 ${
                        openSubMenus['applications'] ? 'rotate-180 text-emerald-700' : ''
                      }`}
                    />
                  )}
                </button>
              </SidebarTooltip>
              {openSubMenus['applications'] && !isCollapsed && (
                <div className="pl-9 pr-2 py-1.5 space-y-1 bg-white/80 rounded-xl my-1 border border-emerald-100/80 shadow-sm">
                  <NavLink
                    to="/loan-agent/applications"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getSubItemClasses(isActive)}
                  >
                    All Applications
                  </NavLink>
                  <NavLink
                    to="/loan-agent/applications?type=LOAN"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getSubItemClasses(isActive)}
                  >
                    Loan Applications
                  </NavLink>
                  <NavLink
                    to="/loan-agent/create-application?type=LOAN"
                    onClick={handleNavItemClick}
                    className="block py-2 px-3 rounded-lg font-bold text-emerald-700 hover:bg-emerald-100/80 border-t border-emerald-100 mt-1 pt-2 flex items-center gap-1.5"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> + Create Loan App
                  </NavLink>
                </div>
              )}
            </div>

            <div className="w-full">
              <SidebarTooltip content="Documents" isCollapsed={isCollapsed}>
                <button
                  onClick={() => toggleSubMenu('documents')}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                  } h-11 rounded-xl transition-all duration-200 text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900 font-semibold ${
                    openSubMenus['documents'] ? 'bg-emerald-100/60' : ''
                  }`}
                >
                  <div className="flex items-center truncate">
                    <FolderOpen
                      className={`h-5 w-5 flex-shrink-0 text-emerald-600 group-hover:text-emerald-700 ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Documents</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={`h-4 w-4 text-emerald-500 ml-auto flex-shrink-0 transition-transform duration-200 ${
                        openSubMenus['documents'] ? 'rotate-180 text-emerald-700' : ''
                      }`}
                    />
                  )}
                </button>
              </SidebarTooltip>
              {openSubMenus['documents'] && !isCollapsed && (
                <div className="pl-9 pr-2 py-1.5 space-y-1 bg-white/80 rounded-xl my-1 border border-emerald-100/80 shadow-sm">
                  <NavLink
                    to="/loan-agent/documents"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getSubItemClasses(isActive)}
                  >
                    Loan Documents
                  </NavLink>
                </div>
              )}
            </div>

            {/* SECTION 4: TASKS & SUPPORT */}
            {!isCollapsed && (
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-900/60 px-3 pt-3 pb-1">
                Tasks & Support
              </div>
            )}
            <SidebarTooltip content="Pending Tasks" isCollapsed={isCollapsed}>
              <NavLink
                to="/loan-agent/tasks"
                onClick={handleNavItemClick}
                className={({ isActive }) => getNavItemClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <CheckSquare
                      className={`h-5 w-5 flex-shrink-0 transition-all ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      } ${isActive ? 'text-white' : 'text-emerald-600 group-hover:text-emerald-700'}`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Pending Tasks</span>}
                  </>
                )}
              </NavLink>
            </SidebarTooltip>

            <SidebarTooltip content="Loan Reports" isCollapsed={isCollapsed}>
              <NavLink
                to="/loan-agent/reports"
                onClick={handleNavItemClick}
                className={({ isActive }) => getNavItemClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <BarChart3
                      className={`h-5 w-5 flex-shrink-0 transition-all ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      } ${isActive ? 'text-white' : 'text-emerald-600 group-hover:text-emerald-700'}`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Loan Reports</span>}
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
                      } ${isActive ? 'text-white' : 'text-emerald-600 group-hover:text-emerald-700'}`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">My Profile</span>}
                  </>
                )}
              </NavLink>
            </SidebarTooltip>

            <SidebarTooltip content="Support & Enquiries" isCollapsed={isCollapsed}>
              <NavLink
                to="/loan-agent/enquiries"
                onClick={handleNavItemClick}
                className={({ isActive }) => getNavItemClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <AlertCircle
                      className={`h-5 w-5 flex-shrink-0 transition-all ${
                        isCollapsed ? 'mr-0' : 'mr-3'
                      } ${isActive ? 'text-white' : 'text-emerald-600 group-hover:text-emerald-700'}`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Support & Enquiries</span>}
                  </>
                )}
              </NavLink>
            </SidebarTooltip>
          </nav>

          {/* Footer Logout */}
          <div className="p-3 border-t border-emerald-200/80 bg-gradient-to-t from-emerald-100/60 to-transparent">
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

export default LoanAgentSidebar;
