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
import { GFSLogo } from './GFSLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
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

  if (!user) return null;

  const userServices: string[] = Array.isArray(user?.serviceTypes)
    ? user.serviceTypes.map((s) => s.toUpperCase())
    : ['LOANS'];
  const hasLoans = userServices.includes('LOANS') || userServices.includes('LOAN');
  const hasInsurance = userServices.includes('INSURANCE');
  const hasInvestments = userServices.includes('INVESTMENT') || userServices.includes('INVESTMENTS');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar Container: Light Blue Background */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#e8f1fd] text-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-blue-200/80 shadow-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Logo & Customer Desk Role Badge */}
          <div className="pt-4 pb-4 px-5 flex flex-col items-center justify-center relative bg-[#e8f1fd]">
            <button onClick={onClose} className="absolute right-3 top-3 text-slate-500 hover:text-slate-900 lg:hidden">
              <X className="h-5 w-5" />
            </button>
            <GFSLogo size="lg" variant="card" onClick={handleLogoClick} />
            <div className="mt-3.5 px-4 py-1.5 rounded-full bg-white/90 text-[#1e3a8a] border border-blue-200/80 text-xs font-extrabold shadow-sm flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer Portal</span>
            </div>
          </div>

          {/* Navigation List */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1.5 text-[14.5px] font-semibold custom-scrollbar">
            {/* 1. Dashboard */}
            <NavLink
              to="/customer/dashboard"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#2377fc] text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <LayoutDashboard className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                  <span>Dashboard</span>
                </>
              )}
            </NavLink>

            {/* 2. Applications Menu */}
            <div>
              <button
                onClick={() => toggleSubMenu('applications')}
                className={`w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852] ${
                  openSubMenus['applications'] ? 'bg-blue-100/50' : ''
                }`}
              >
                <div className="flex items-center truncate">
                  <FileText className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-[#1d63ed]" />
                  <span className="truncate">My Applications</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-blue-500 ml-auto flex-shrink-0 transition-transform ${
                    openSubMenus['applications'] ? 'rotate-180 text-blue-700' : ''
                  }`}
                />
              </button>
              {openSubMenus['applications'] && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-blue-100 text-xs shadow-inner">
                  <NavLink
                    to="/customer/applications"
                    onClick={onClose}
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
                      onClick={onClose}
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
                      onClick={onClose}
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
                      onClick={onClose}
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
                    onClick={onClose}
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
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#2377fc] text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <FolderOpen className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                  <span>My Documents</span>
                </>
              )}
            </NavLink>

            {/* 4. Enquiries */}
            <NavLink
              to="/customer/enquiries"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#2377fc] text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <AlertCircle className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                  <span>Help & Enquiries</span>
                </>
              )}
            </NavLink>

            {/* 5. Platform Updates */}
            <NavLink
              to="/customer/updates"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#2377fc] text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Sparkles className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                  <span>Platform Updates</span>
                </>
              )}
            </NavLink>

            {/* 6. Profile */}
            <NavLink
              to="/profile"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#2377fc] text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <UserCheck className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                  <span>My Profile</span>
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-blue-200/60 bg-[#e8f1fd] flex items-center justify-between text-xs">
          <button onClick={logout} className="text-rose-600 hover:text-rose-700 font-extrabold flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors w-full justify-center border border-rose-200/60 bg-white/80 shadow-sm">
            <LogOut className="h-4 w-4" /> Logout Account
          </button>
        </div>
      </aside>
    </>
  );
};
