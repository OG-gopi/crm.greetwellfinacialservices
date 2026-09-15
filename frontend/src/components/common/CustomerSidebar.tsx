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
  X,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export const CustomerSidebar: React.FC<SidebarProps> = ({
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
    if (
      location.pathname.startsWith('/customer/applications') ||
      location.pathname.startsWith('/customer/create-application')
    ) {
      setOpenSubMenus({ applications: true });
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

  const userServices: string[] = Array.isArray(user?.serviceTypes)
    ? user.serviceTypes.map((s) => s.toUpperCase())
    : ['LOANS'];
  const hasLoans = userServices.includes('LOANS') || userServices.includes('LOAN');
  const hasInsurance = userServices.includes('INSURANCE');
  const hasInvestments = userServices.includes('INVESTMENT') || userServices.includes('INVESTMENTS');

  const getNavItemClasses = (isActive: boolean) => {
    if (isCollapsed) {
      return `relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl transition-all cursor-pointer ${
        isActive
          ? 'bg-[#2377fc] text-white font-bold shadow-md shadow-blue-500/20'
          : 'text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852]'
      }`;
    }
    return `flex items-center px-4 h-12 rounded-xl transition-all cursor-pointer ${
      isActive
        ? 'bg-[#2377fc] text-white font-bold shadow-md shadow-blue-500/20'
        : 'text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852]'
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
        className={`fixed top-0 left-0 z-50 h-full bg-[#e8f1fd] text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-blue-200/80 shadow-xs ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Mobile Close & Collapsed Indicator */}
          <div className={`py-3 px-3 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} bg-[#e8f1fd] border-b border-blue-200/50`}>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-900 lg:hidden">
              <X className="h-5 w-5" />
            </button>
            {!isCollapsed && (
              <div className="px-3 py-1 rounded-full bg-white/90 text-[#1e3a8a] border border-blue-200/80 text-xs font-extrabold shadow-2xs flex items-center gap-1.5 mx-auto">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Customer Portal</span>
              </div>
            )}
            {isCollapsed && (
              <div title="Customer Portal" className="p-2 rounded-full bg-white/90 text-blue-600 border border-blue-200/80 shadow-2xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Navigation List */}
          <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1.5 text-[14.5px] font-semibold custom-scrollbar">
            {/* 1. Dashboard */}
            <NavLink
              to="/customer/dashboard"
              onClick={handleItemClick}
              title={isCollapsed ? 'Dashboard' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                  )}
                  <LayoutDashboard className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                  {!isCollapsed && <span>Dashboard</span>}
                </>
              )}
            </NavLink>

            {/* 2. Applications Menu */}
            <div>
              <button
                onClick={() => handleParentClick('applications')}
                title={isCollapsed ? 'My Applications' : undefined}
                className={
                  isCollapsed
                    ? `relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl transition-all cursor-pointer text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852] ${
                        openSubMenus['applications'] ? 'bg-blue-100/70' : ''
                      }`
                    : `w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852] ${
                        openSubMenus['applications'] ? 'bg-blue-100/50' : ''
                      }`
                }
              >
                {isCollapsed ? (
                  <FileText className="h-[22px] w-[22px] text-[#1d63ed]" />
                ) : (
                  <>
                    <div className="flex items-center truncate">
                      <FileText className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-[#1d63ed]" />
                      <span className="truncate">My Applications</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-blue-500 ml-auto flex-shrink-0 transition-transform ${
                        openSubMenus['applications'] ? 'rotate-180 text-blue-700' : ''
                      }`}
                    />
                  </>
                )}
              </button>

              {!isCollapsed && openSubMenus['applications'] && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-blue-100 text-xs shadow-inner">
                  <NavLink
                    to="/customer/applications"
                    onClick={handleItemClick}
                    className={({ isActive }) =>
                      `block py-2 px-3 rounded-lg transition-colors font-medium ${
                        isActive ? 'text-blue-700 font-extrabold bg-blue-100/60' : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
                      }`
                    }
                  >
                    All Applications
                  </NavLink>
                  {hasLoans && (
                    <NavLink
                      to="/customer/applications?type=LOAN"
                      onClick={handleItemClick}
                      className={({ isActive }) =>
                        `block py-2 px-3 rounded-lg transition-colors font-medium ${
                          isActive ? 'text-blue-700 font-extrabold bg-blue-100/60' : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
                        }`
                      }
                    >
                      Loan Applications
                    </NavLink>
                  )}
                  {hasInsurance && (
                    <NavLink
                      to="/customer/applications?type=INSURANCE"
                      onClick={handleItemClick}
                      className={({ isActive }) =>
                        `block py-2 px-3 rounded-lg transition-colors font-medium ${
                          isActive ? 'text-blue-700 font-extrabold bg-blue-100/60' : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
                        }`
                      }
                    >
                      Insurance Applications
                    </NavLink>
                  )}
                  {hasInvestments && (
                    <NavLink
                      to="/customer/applications?type=INVESTMENT"
                      onClick={handleItemClick}
                      className={({ isActive }) =>
                        `block py-2 px-3 rounded-lg transition-colors font-medium ${
                          isActive ? 'text-blue-700 font-extrabold bg-blue-100/60' : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
                        }`
                      }
                    >
                      Investment Applications
                    </NavLink>
                  )}
                  <NavLink
                    to="/customer/create-application"
                    onClick={handleItemClick}
                    className="block py-2 px-3 rounded-lg font-bold text-emerald-700 hover:bg-emerald-50 border-t border-blue-100 mt-1 pt-2 flex items-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> + New Application
                  </NavLink>
                </div>
              )}
            </div>

            {/* 3. Documents */}
            <NavLink
              to="/customer/documents"
              onClick={handleItemClick}
              title={isCollapsed ? 'My Documents' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                  )}
                  <FolderOpen className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                  {!isCollapsed && <span>My Documents</span>}
                </>
              )}
            </NavLink>

            {/* 4. Enquiries */}
            <NavLink
              to="/customer/enquiries"
              onClick={handleItemClick}
              title={isCollapsed ? 'Help & Enquiries' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                  )}
                  <AlertCircle className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                  {!isCollapsed && <span>Help & Enquiries</span>}
                </>
              )}
            </NavLink>

            {/* 5. Platform Updates */}
            <NavLink
              to="/customer/updates"
              onClick={handleItemClick}
              title={isCollapsed ? 'Platform Updates' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                  )}
                  <Sparkles className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                  {!isCollapsed && <span>Platform Updates</span>}
                </>
              )}
            </NavLink>

            {/* 6. Profile */}
            <NavLink
              to="/profile"
              onClick={handleItemClick}
              title={isCollapsed ? 'My Profile' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                  )}
                  <UserCheck className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                  {!isCollapsed && <span>My Profile</span>}
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Footer Logout */}
        <div className={`p-3 border-t border-blue-200/60 bg-[#e8f1fd] flex items-center justify-center text-xs`}>
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
