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

import { SidebarIconLoading } from './SidebarIconLoading';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LoanAgentSidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  const handleNavItemClick = () => {
    onClose();
    if (onToggleCollapse && !isCollapsed) {
      onToggleCollapse();
    }
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
        roleName="Loan Agent Desk"
      />
    );
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar Container: Light Mint Background */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-[#e8f7f2] text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-emerald-200/80 shadow-sm relative ${
          isCollapsed ? 'lg:w-20 w-64' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3 top-6 z-20 w-6 h-6 rounded-full bg-emerald-600 text-white shadow-md items-center justify-center hover:bg-emerald-700 transition-all cursor-pointer border-2 border-white"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}

        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Logo & Loan Agent Desk Role Badge */}
          <div className="pt-4 pb-4 px-3 flex flex-col items-center justify-center relative bg-[#e8f7f2]">
            <button onClick={onClose} className="absolute right-3 top-3 text-slate-500 hover:text-slate-900 lg:hidden">
              <X className="h-5 w-5" />
            </button>
            <GFSLogo size={isCollapsed ? 'sm' : 'lg'} variant="card" onClick={handleLogoClick} />
            <div className={`mt-3 px-3 py-1 rounded-full bg-white/90 text-emerald-900 border border-emerald-300/80 text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all ${
              isCollapsed ? 'px-2 py-1' : 'px-4 py-1.5'
            }`}>
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              {!isCollapsed && <span>Loan Agent Desk</span>}
            </div>
          </div>

          {/* Navigation List */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1.5 text-[14.5px] font-semibold custom-scrollbar">
            {/* 1. Dashboard */}
            <NavLink
              to="/loan-agent/dashboard"
              onClick={handleNavItemClick}
              title="Dashboard"
              className={({ isActive }) =>
                `flex items-center h-12 rounded-xl transition-all ${
                  isCollapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                    : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <LayoutDashboard className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                  {!isCollapsed && <span>Dashboard</span>}
                </>
              )}
            </NavLink>

            {/* 2. Customers Menu */}
            <div>
              <button
                onClick={() => toggleSubMenu('customers')}
                title="Customers"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'} h-12 rounded-xl transition-all text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900 ${
                  openSubMenus['customers'] ? 'bg-emerald-100/50' : ''
                }`}
              >
                <div className="flex items-center truncate">
                  <Users className={`h-[22px] w-[22px] flex-shrink-0 text-emerald-600 ${isCollapsed ? 'mr-0' : 'mr-3.5'}`} />
                  {!isCollapsed && <span className="truncate">Customers</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    className={`h-4 w-4 text-emerald-500 ml-auto flex-shrink-0 transition-transform ${
                      openSubMenus['customers'] ? 'rotate-180 text-emerald-700' : ''
                    }`}
                  />
                )}
              </button>
              {openSubMenus['customers'] && !isCollapsed && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-emerald-100 text-xs shadow-inner">
                  <NavLink
                    to="/loan-agent/customers"
                    onClick={handleNavItemClick}
                    className={({ isActive }) =>
                      `block py-2 px-3 rounded-lg transition-colors font-medium ${
                        isActive ? 'text-emerald-700 font-extrabold bg-emerald-100/60' : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
                      }`
                    }
                  >
                    My Customers
                  </NavLink>
                </div>
              )}
            </div>

            {/* 3. Applications Menu */}
            <div>
              <button
                onClick={() => toggleSubMenu('applications')}
                title="Applications"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'} h-12 rounded-xl transition-all text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900 ${
                  openSubMenus['applications'] ? 'bg-emerald-100/50' : ''
                }`}
              >
                <div className="flex items-center truncate">
                  <FileText className={`h-[22px] w-[22px] flex-shrink-0 text-emerald-600 ${isCollapsed ? 'mr-0' : 'mr-3.5'}`} />
                  {!isCollapsed && <span className="truncate">Applications</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    className={`h-4 w-4 text-emerald-500 ml-auto flex-shrink-0 transition-transform ${
                      openSubMenus['applications'] ? 'rotate-180 text-emerald-700' : ''
                    }`}
                  />
                )}
              </button>
              {openSubMenus['applications'] && !isCollapsed && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-emerald-100 text-xs shadow-inner">
                  <NavLink
                    to="/loan-agent/applications"
                    onClick={handleNavItemClick}
                    className={({ isActive }) =>
                      `block py-2 px-3 rounded-lg transition-colors font-medium ${
                        isActive ? 'text-emerald-700 font-extrabold bg-emerald-100/60' : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
                      }`
                    }
                  >
                    All Applications
                  </NavLink>
                  <NavLink
                    to="/loan-agent/applications?type=LOAN"
                    onClick={handleNavItemClick}
                    className={({ isActive }) =>
                      `block py-2 px-3 rounded-lg transition-colors font-medium ${
                        isActive ? 'text-emerald-700 font-extrabold bg-emerald-100/60' : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
                      }`
                    }
                  >
                    Loan Applications
                  </NavLink>
                  <NavLink
                    to="/loan-agent/create-application?type=LOAN"
                    onClick={handleNavItemClick}
                    className="block py-2 px-3 rounded-lg font-bold text-emerald-700 hover:bg-emerald-100/70 border-t border-emerald-100 mt-1 pt-2 flex items-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> + Create Loan App
                  </NavLink>
                </div>
              )}
            </div>

            {/* 4. Documents */}
            <div>
              <button
                onClick={() => toggleSubMenu('documents')}
                title="Documents"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'} h-12 rounded-xl transition-all text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900 ${
                  openSubMenus['documents'] ? 'bg-emerald-100/50' : ''
                }`}
              >
                <div className="flex items-center truncate">
                  <FolderOpen className={`h-[22px] w-[22px] flex-shrink-0 text-emerald-600 ${isCollapsed ? 'mr-0' : 'mr-3.5'}`} />
                  {!isCollapsed && <span className="truncate">Documents</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    className={`h-4 w-4 text-emerald-500 ml-auto flex-shrink-0 transition-transform ${
                      openSubMenus['documents'] ? 'rotate-180 text-emerald-700' : ''
                    }`}
                  />
                )}
              </button>
              {openSubMenus['documents'] && !isCollapsed && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-emerald-100 text-xs shadow-inner">
                  <NavLink
                    to="/loan-agent/documents"
                    onClick={handleNavItemClick}
                    className={({ isActive }) =>
                      `block py-2 px-3 rounded-lg transition-colors font-medium ${
                        isActive ? 'text-emerald-700 font-extrabold bg-emerald-100/60' : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
                      }`
                    }
                  >
                    Loan Documents
                  </NavLink>
                </div>
              )}
            </div>

            {/* 5. Tasks */}
            <NavLink
              to="/loan-agent/tasks"
              onClick={handleNavItemClick}
              title="Pending Tasks"
              className={({ isActive }) =>
                `flex items-center h-12 rounded-xl transition-all ${
                  isCollapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <CheckSquare className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  {!isCollapsed && <span>Pending Tasks</span>}
                </>
              )}
            </NavLink>

            {/* 6. Reports */}
            <NavLink
              to="/loan-agent/reports"
              onClick={handleNavItemClick}
              title="Loan Reports"
              className={({ isActive }) =>
                `flex items-center h-12 rounded-xl transition-all ${
                  isCollapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <BarChart3 className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  {!isCollapsed && <span>Loan Reports</span>}
                </>
              )}
            </NavLink>

            {/* 7. Profile */}
            <NavLink
              to="/profile"
              onClick={handleNavItemClick}
              title="My Profile"
              className={({ isActive }) =>
                `flex items-center h-12 rounded-xl transition-all ${
                  isCollapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <UserCheck className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  {!isCollapsed && <span>My Profile</span>}
                </>
              )}
            </NavLink>

            {/* 8. Enquiries */}
            <NavLink
              to="/loan-agent/enquiries"
              onClick={handleNavItemClick}
              title="Support & Enquiries"
              className={({ isActive }) =>
                `flex items-center h-12 rounded-xl transition-all ${
                  isCollapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <AlertCircle className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  {!isCollapsed && <span>Support & Enquiries</span>}
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-emerald-200/60 bg-[#e8f7f2] flex items-center justify-between text-xs">
          <button onClick={logout} title="Logout Account" className="text-rose-600 hover:text-rose-700 font-extrabold flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors w-full justify-center border border-rose-200/60 bg-white/80 shadow-sm">
            <LogOut className="h-4 w-4 shrink-0" /> {!isCollapsed && <span>Logout Account</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
