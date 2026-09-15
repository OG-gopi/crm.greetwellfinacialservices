import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  FolderOpen,
  CheckSquare,
  BarChart3,
  UserCheck,
  AlertCircle,
  ChevronDown,
  X,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export const InsuranceAgentSidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  setIsCollapsed,
}) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (location.pathname.startsWith('/insurance-agent/customers')) {
      setOpenSubMenus({ customers: true });
    } else if (
      location.pathname.startsWith('/insurance-agent/applications') ||
      location.pathname.startsWith('/insurance-agent/create-application')
    ) {
      setOpenSubMenus({ applications: true });
    } else if (location.pathname.startsWith('/insurance-agent/documents')) {
      setOpenSubMenus({ documents: true });
    } else {
      setOpenSubMenus({});
    }
  }, [location.pathname]);

  const toggleSubMenu = (key: string) => {
    setOpenSubMenus((prev) => (prev[key] ? {} : { [key]: true }));
  };

  const handleItemClick = () => {
    onClose();
    if (setIsCollapsed) {
      setIsCollapsed(true);
    }
  };

  const handleParentClick = (key: string) => {
    if (isCollapsed && setIsCollapsed) {
      setIsCollapsed(false);
      setOpenSubMenus({ [key]: true });
    } else {
      toggleSubMenu(key);
    }
  };

  if (!user) return null;

  const getNavItemClasses = (isActive: boolean) => {
    if (isCollapsed) {
      return `relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl transition-all cursor-pointer ${
        isActive
          ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/20'
          : 'text-purple-950 hover:bg-purple-100/70 hover:text-purple-900'
      }`;
    }
    return `flex items-center px-4 h-12 rounded-xl transition-all cursor-pointer ${
      isActive
        ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/20'
        : 'text-purple-950 hover:bg-purple-100/70 hover:text-purple-900'
    }`;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-[#f3edfd] text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-purple-200/80 shadow-xs ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Mobile Close & Collapsed Indicator */}
          <div className={`py-3 px-3 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} bg-[#f3edfd] border-b border-purple-200/50`}>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-900 lg:hidden">
              <X className="h-5 w-5" />
            </button>
            {!isCollapsed && (
              <div className="px-3 py-1 rounded-full bg-white/90 text-purple-950 border border-purple-300/80 text-xs font-extrabold shadow-2xs flex items-center gap-1.5 mx-auto">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Insurance Agent Desk</span>
              </div>
            )}
            {isCollapsed && (
              <div title="Insurance Agent Desk" className="p-2 rounded-full bg-white/90 text-purple-600 border border-purple-200/80 shadow-2xs">
                <Shield className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Navigation List */}
          <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1.5 text-[14.5px] font-semibold custom-scrollbar">
            {/* 1. Dashboard */}
            <NavLink
              to="/insurance-agent/dashboard"
              onClick={handleItemClick}
              title={isCollapsed ? 'Dashboard' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 rounded-r-full" />
                  )}
                  <LayoutDashboard className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-purple-600'}`} />
                  {!isCollapsed && <span>Dashboard</span>}
                </>
              )}
            </NavLink>

            {/* 2. Customers Menu */}
            <div>
              <button
                onClick={() => handleParentClick('customers')}
                title={isCollapsed ? 'Customers' : undefined}
                className={
                  isCollapsed
                    ? `relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl transition-all cursor-pointer text-purple-950 hover:bg-purple-100/70 hover:text-purple-900 ${
                        openSubMenus['customers'] ? 'bg-purple-100/70' : ''
                      }`
                    : `w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-purple-950 hover:bg-purple-100/70 hover:text-purple-900 ${
                        openSubMenus['customers'] ? 'bg-purple-100/50' : ''
                      }`
                }
              >
                {isCollapsed ? (
                  <Users className="h-[22px] w-[22px] text-purple-600" />
                ) : (
                  <>
                    <div className="flex items-center truncate">
                      <Users className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-purple-600" />
                      <span className="truncate">Customers</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-purple-500 ml-auto flex-shrink-0 transition-transform ${
                        openSubMenus['customers'] ? 'rotate-180 text-purple-700' : ''
                      }`}
                    />
                  </>
                )}
              </button>
              {!isCollapsed && openSubMenus['customers'] && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-purple-100 text-xs shadow-inner">
                  <NavLink
                    to="/insurance-agent/customers"
                    onClick={handleItemClick}
                    className={({ isActive }) =>
                      `block py-2 px-3 rounded-lg transition-colors font-medium ${
                        isActive ? 'text-purple-700 font-extrabold bg-purple-100/60' : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50'
                      }`
                    }
                  >
                    My Policy Holders
                  </NavLink>
                </div>
              )}
            </div>

            {/* 3. Applications Menu */}
            <div>
              <button
                onClick={() => handleParentClick('applications')}
                title={isCollapsed ? 'Insurance Policies' : undefined}
                className={
                  isCollapsed
                    ? `relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl transition-all cursor-pointer text-purple-950 hover:bg-purple-100/70 hover:text-purple-900 ${
                        openSubMenus['applications'] ? 'bg-purple-100/70' : ''
                      }`
                    : `w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-purple-950 hover:bg-purple-100/70 hover:text-purple-900 ${
                        openSubMenus['applications'] ? 'bg-purple-100/50' : ''
                      }`
                }
              >
                {isCollapsed ? (
                  <Shield className="h-[22px] w-[22px] text-purple-600" />
                ) : (
                  <>
                    <div className="flex items-center truncate">
                      <Shield className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-purple-600" />
                      <span className="truncate">Insurance Policies</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-purple-500 ml-auto flex-shrink-0 transition-transform ${
                        openSubMenus['applications'] ? 'rotate-180 text-purple-700' : ''
                      }`}
                    />
                  </>
                )}
              </button>
              {!isCollapsed && openSubMenus['applications'] && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-purple-100 text-xs shadow-inner">
                  <NavLink
                    to="/insurance-agent/applications"
                    onClick={handleItemClick}
                    className={({ isActive }) =>
                      `block py-2 px-3 rounded-lg transition-colors font-medium ${
                        isActive ? 'text-purple-700 font-extrabold bg-purple-100/60' : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50'
                      }`
                    }
                  >
                    All Policies & Apps
                  </NavLink>
                  <NavLink
                    to="/insurance-agent/create-application?type=INSURANCE"
                    onClick={handleItemClick}
                    className="block py-2 px-3 rounded-lg font-bold text-purple-700 hover:bg-purple-100/70 border-t border-purple-100 mt-1 pt-2 flex items-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> + New Policy
                  </NavLink>
                </div>
              )}
            </div>

            {/* 4. Documents */}
            <div>
              <button
                onClick={() => handleParentClick('documents')}
                title={isCollapsed ? 'Documents' : undefined}
                className={
                  isCollapsed
                    ? `relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl transition-all cursor-pointer text-purple-950 hover:bg-purple-100/70 hover:text-purple-900 ${
                        openSubMenus['documents'] ? 'bg-purple-100/70' : ''
                      }`
                    : `w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-purple-950 hover:bg-purple-100/70 hover:text-purple-900 ${
                        openSubMenus['documents'] ? 'bg-purple-100/50' : ''
                      }`
                }
              >
                {isCollapsed ? (
                  <FolderOpen className="h-[22px] w-[22px] text-purple-600" />
                ) : (
                  <>
                    <div className="flex items-center truncate">
                      <FolderOpen className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-purple-600" />
                      <span className="truncate">Documents</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-purple-500 ml-auto flex-shrink-0 transition-transform ${
                        openSubMenus['documents'] ? 'rotate-180 text-purple-700' : ''
                      }`}
                    />
                  </>
                )}
              </button>
              {!isCollapsed && openSubMenus['documents'] && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-purple-100 text-xs shadow-inner">
                  <NavLink
                    to="/insurance-agent/documents"
                    onClick={handleItemClick}
                    className={({ isActive }) =>
                      `block py-2 px-3 rounded-lg transition-colors font-medium ${
                        isActive ? 'text-purple-700 font-extrabold bg-purple-100/60' : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50'
                      }`
                    }
                  >
                    Insurance Proofs & KYC
                  </NavLink>
                </div>
              )}
            </div>

            {/* 5. Tasks */}
            <NavLink
              to="/insurance-agent/tasks"
              onClick={handleItemClick}
              title={isCollapsed ? 'Pending Tasks' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 rounded-r-full" />
                  )}
                  <CheckSquare className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-purple-600'}`} />
                  {!isCollapsed && <span>Pending Tasks</span>}
                </>
              )}
            </NavLink>

            {/* 6. Reports */}
            <NavLink
              to="/insurance-agent/reports"
              onClick={handleItemClick}
              title={isCollapsed ? 'Policy Reports' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 rounded-r-full" />
                  )}
                  <BarChart3 className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-purple-600'}`} />
                  {!isCollapsed && <span>Policy Reports</span>}
                </>
              )}
            </NavLink>

            {/* 7. Profile */}
            <NavLink
              to="/profile"
              onClick={handleItemClick}
              title={isCollapsed ? 'My Profile' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 rounded-r-full" />
                  )}
                  <UserCheck className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-purple-600'}`} />
                  {!isCollapsed && <span>My Profile</span>}
                </>
              )}
            </NavLink>

            {/* 8. Enquiries */}
            <NavLink
              to="/insurance-agent/enquiries"
              onClick={handleItemClick}
              title={isCollapsed ? 'Support & Claims' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 rounded-r-full" />
                  )}
                  <AlertCircle className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-purple-600'}`} />
                  {!isCollapsed && <span>Support & Claims</span>}
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-purple-200/70 bg-[#f3edfd] flex items-center justify-center text-xs">
          <button
            onClick={logout}
            title={isCollapsed ? 'Logout Account' : undefined}
            className="text-rose-600 hover:text-rose-700 font-extrabold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors w-full justify-center border border-rose-200/60 bg-white/80 shadow-2xs cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Logout Account</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
