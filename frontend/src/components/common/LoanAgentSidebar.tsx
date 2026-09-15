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
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  X,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean | ((prev: boolean) => boolean)) => void;
}

export const LoanAgentSidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isExpanded = false,
  setIsExpanded,
}) => {
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

  const handleToggleExpand = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (setIsExpanded) {
      setIsExpanded((prev) => !prev);
    }
  };

  const handleItemClick = () => {
    onClose();
  };

  const handleParentClick = (key: string) => {
    if (!isExpanded && setIsExpanded) {
      setIsExpanded(true);
      setOpenSubMenus({ [key]: true });
    } else {
      toggleSubMenu(key);
    }
  };

  if (!user) return null;

  const getNavItemClasses = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
      isActive
        ? 'bg-[#1E4FD6] text-white font-semibold shadow-md shadow-blue-600/30'
        : 'text-[#8FA0B8] hover:bg-[#16273D] hover:text-white'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-[#0E1A2B] text-[#8FA0B8] flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-[#1E2F45] shadow-md select-none ${
          isOpen ? 'translate-x-0 w-[252px]' : '-translate-x-full lg:translate-x-0'
        } ${isExpanded ? 'lg:w-[252px]' : 'lg:w-[76px]'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Top: Brand & Collapse Toggle */}
          <div className="pt-5 pb-3 px-3.5 flex items-center justify-between">
            <button
              onClick={handleToggleExpand}
              className="flex items-center gap-3 bg-none border-none p-0 text-left cursor-pointer min-w-0"
            >
              <div className="w-10 h-10 rounded-full bg-black border-[1.5px] border-[#B4862E] text-[#B4862E] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                GFS
              </div>
              {isExpanded && (
                <div className="flex flex-col truncate">
                  <strong className="text-white text-[14.5px] font-bold tracking-tight">GFS</strong>
                  <small className="text-[#8FA0B8] text-[10.5px] truncate">Loans, Insurance &amp; Investments</small>
                </div>
              )}
            </button>

            {isExpanded && (
              <button
                onClick={handleToggleExpand}
                className="w-7 h-7 rounded-lg border border-[#26374F] bg-[#16273D] text-[#8FA0B8] hover:text-white hover:border-[#3b5172] flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden ml-auto">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Portal Pill */}
          <div className="mx-3 my-2 p-2.5 rounded-xl bg-white text-[#0E1A2B] text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            {isExpanded && <span className="truncate font-bold">Loan Agent Desk</span>}
          </div>

          {/* Navigation List */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1.5 custom-scrollbar">
            {/* 1. Dashboard */}
            <NavLink
              to="/loan-agent/dashboard"
              onClick={handleItemClick}
              title={!isExpanded ? 'Dashboard' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              <LayoutDashboard className="w-[19px] h-[19px] shrink-0" />
              {isExpanded && <span className="truncate">Dashboard</span>}
            </NavLink>

            {/* 2. Customers Menu */}
            <div>
              <button
                onClick={() => handleParentClick('customers')}
                title={!isExpanded ? 'Customers' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
                  location.pathname.startsWith('/loan-agent/customers')
                    ? 'bg-[#1E4FD6] text-white font-semibold shadow-md shadow-blue-600/30'
                    : openSubMenus['customers']
                    ? 'bg-[#16273D] text-white'
                    : 'text-[#8FA0B8] hover:bg-[#16273D] hover:text-white'
                }`}
              >
                <Users className="w-[19px] h-[19px] shrink-0" />
                {isExpanded && (
                  <>
                    <span className="truncate text-left flex-1">Customers</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        openSubMenus['customers'] ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </>
                )}
              </button>
              {isExpanded && openSubMenus['customers'] && (
                <div className="pl-8 pr-1 py-1 space-y-1">
                  <NavLink
                    to="/loan-agent/customers"
                    onClick={handleItemClick}
                    className={({ isActive }) =>
                      `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
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
                onClick={() => handleParentClick('applications')}
                title={!isExpanded ? 'Applications' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
                  location.pathname.startsWith('/loan-agent/applications') || location.pathname.startsWith('/loan-agent/create-application')
                    ? 'bg-[#1E4FD6] text-white font-semibold shadow-md shadow-blue-600/30'
                    : openSubMenus['applications']
                    ? 'bg-[#16273D] text-white'
                    : 'text-[#8FA0B8] hover:bg-[#16273D] hover:text-white'
                }`}
              >
                <FileText className="w-[19px] h-[19px] shrink-0" />
                {isExpanded && (
                  <>
                    <span className="truncate text-left flex-1">Applications</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        openSubMenus['applications'] ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </>
                )}
              </button>
              {isExpanded && openSubMenus['applications'] && (
                <div className="pl-8 pr-1 py-1 space-y-1">
                  <NavLink
                    to="/loan-agent/applications"
                    onClick={handleItemClick}
                    className={({ isActive }) =>
                      `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                      }`
                    }
                  >
                    All Applications
                  </NavLink>
                  <NavLink
                    to="/loan-agent/applications?type=LOAN"
                    onClick={handleItemClick}
                    className={({ isActive }) =>
                      `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                      }`
                    }
                  >
                    Loan Applications
                  </NavLink>
                  <NavLink
                    to="/loan-agent/create-application?type=LOAN"
                    onClick={handleItemClick}
                    className="block py-1.5 px-2.5 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-[#16273D] flex items-center gap-1 mt-1 pt-1.5 border-t border-[#1E2F45]"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> + Create Loan App
                  </NavLink>
                </div>
              )}
            </div>

            {/* 4. Documents */}
            <div>
              <button
                onClick={() => handleParentClick('documents')}
                title={!isExpanded ? 'Documents' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
                  location.pathname.startsWith('/loan-agent/documents')
                    ? 'bg-[#1E4FD6] text-white font-semibold shadow-md shadow-blue-600/30'
                    : openSubMenus['documents']
                    ? 'bg-[#16273D] text-white'
                    : 'text-[#8FA0B8] hover:bg-[#16273D] hover:text-white'
                }`}
              >
                <FolderOpen className="w-[19px] h-[19px] shrink-0" />
                {isExpanded && (
                  <>
                    <span className="truncate text-left flex-1">Documents</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        openSubMenus['documents'] ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </>
                )}
              </button>
              {isExpanded && openSubMenus['documents'] && (
                <div className="pl-8 pr-1 py-1 space-y-1">
                  <NavLink
                    to="/loan-agent/documents"
                    onClick={handleItemClick}
                    className={({ isActive }) =>
                      `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
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
              onClick={handleItemClick}
              title={!isExpanded ? 'Pending Tasks' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              <CheckSquare className="w-[19px] h-[19px] shrink-0" />
              {isExpanded && <span className="truncate">Pending Tasks</span>}
            </NavLink>

            {/* 6. Reports */}
            <NavLink
              to="/loan-agent/reports"
              onClick={handleItemClick}
              title={!isExpanded ? 'Loan Reports' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              <BarChart3 className="w-[19px] h-[19px] shrink-0" />
              {isExpanded && <span className="truncate">Loan Reports</span>}
            </NavLink>

            {/* 7. Profile */}
            <NavLink
              to="/profile"
              onClick={handleItemClick}
              title={!isExpanded ? 'My Profile' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              <UserCheck className="w-[19px] h-[19px] shrink-0" />
              {isExpanded && <span className="truncate">My Profile</span>}
            </NavLink>

            {/* 8. Enquiries */}
            <NavLink
              to="/loan-agent/enquiries"
              onClick={handleItemClick}
              title={!isExpanded ? 'Support & Enquiries' : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              <HelpCircle className="w-[19px] h-[19px] shrink-0" />
              {isExpanded && <span className="truncate">Support &amp; Enquiries</span>}
            </NavLink>
          </nav>

          {/* Footer Logout */}
          <div className="p-3 border-t border-[#1E2F45] bg-[#0E1A2B]">
            <button
              onClick={logout}
              title={!isExpanded ? 'Logout Account' : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-none bg-none text-[#E38585] hover:bg-[#2A1A1E] transition-colors cursor-pointer text-xs font-semibold"
            >
              <LogOut className="w-[19px] h-[19px] shrink-0 text-[#E38585]" />
              {isExpanded && <span className="truncate">Logout Account</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
