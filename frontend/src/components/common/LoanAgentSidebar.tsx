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
  X,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { GFSLogo } from './GFSLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoanAgentSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

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

  if (!user) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar Container: Light Mint Background */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#e8f7f2] text-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-emerald-200/80 shadow-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Logo & Loan Agent Desk Role Badge */}
          <div className="pt-4 pb-4 px-5 flex flex-col items-center justify-center relative bg-[#e8f7f2]">
            <button onClick={onClose} className="absolute right-3 top-3 text-slate-500 hover:text-slate-900 lg:hidden">
              <X className="h-5 w-5" />
            </button>
            <GFSLogo size="lg" variant="card" onClick={handleLogoClick} />
            <div className="mt-3.5 px-4 py-1.5 rounded-full bg-white/90 text-emerald-900 border border-emerald-300/80 text-xs font-extrabold shadow-sm flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Loan Agent Desk</span>
            </div>
          </div>

          {/* Navigation List */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1.5 text-[14.5px] font-semibold custom-scrollbar">
            {/* 1. Dashboard */}
            <NavLink
              to="/loan-agent/dashboard"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <LayoutDashboard className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Dashboard</span>
                </>
              )}
            </NavLink>

            {/* 2. Customers Menu */}
            <div>
              <button
                onClick={() => toggleSubMenu('customers')}
                className={`w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900 ${
                  openSubMenus['customers'] ? 'bg-emerald-100/50' : ''
                }`}
              >
                <div className="flex items-center truncate">
                  <Users className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-emerald-600" />
                  <span className="truncate">Customers</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-emerald-500 ml-auto flex-shrink-0 transition-transform ${
                    openSubMenus['customers'] ? 'rotate-180 text-emerald-700' : ''
                  }`}
                />
              </button>
              {openSubMenus['customers'] && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-emerald-100 text-xs shadow-inner">
                  <NavLink
                    to="/loan-agent/customers"
                    onClick={onClose}
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
                className={`w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900 ${
                  openSubMenus['applications'] ? 'bg-emerald-100/50' : ''
                }`}
              >
                <div className="flex items-center truncate">
                  <FileText className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-emerald-600" />
                  <span className="truncate">Applications</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-emerald-500 ml-auto flex-shrink-0 transition-transform ${
                    openSubMenus['applications'] ? 'rotate-180 text-emerald-700' : ''
                  }`}
                />
              </button>
              {openSubMenus['applications'] && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-emerald-100 text-xs shadow-inner">
                  <NavLink
                    to="/loan-agent/applications"
                    onClick={onClose}
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
                    onClick={onClose}
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
                    onClick={onClose}
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
                className={`w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900 ${
                  openSubMenus['documents'] ? 'bg-emerald-100/50' : ''
                }`}
              >
                <div className="flex items-center truncate">
                  <FolderOpen className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-emerald-600" />
                  <span className="truncate">Documents</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-emerald-500 ml-auto flex-shrink-0 transition-transform ${
                    openSubMenus['documents'] ? 'rotate-180 text-emerald-700' : ''
                  }`}
                />
              </button>
              {openSubMenus['documents'] && (
                <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-emerald-100 text-xs shadow-inner">
                  <NavLink
                    to="/loan-agent/documents"
                    onClick={onClose}
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
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <CheckSquare className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Pending Tasks</span>
                </>
              )}
            </NavLink>

            {/* 6. Reports */}
            <NavLink
              to="/loan-agent/reports"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <BarChart3 className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Loan Reports</span>
                </>
              )}
            </NavLink>

            {/* 7. Profile */}
            <NavLink
              to="/profile"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <UserCheck className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  <span>My Profile</span>
                </>
              )}
            </NavLink>

            {/* 8. Enquiries */}
            <NavLink
              to="/loan-agent/enquiries"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/70 hover:text-emerald-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <AlertCircle className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Support & Enquiries</span>
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-emerald-200/70 bg-[#e8f7f2] flex items-center justify-between text-xs">
          <button onClick={logout} className="text-rose-600 hover:text-rose-700 font-extrabold flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors w-full justify-center border border-rose-200/60 bg-white/80 shadow-sm">
            <LogOut className="h-4 w-4" /> Logout Account
          </button>
        </div>
      </aside>
    </>
  );
};
