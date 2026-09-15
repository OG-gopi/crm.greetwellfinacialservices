import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  User,
  FileText,
  FolderOpen,
  Package,
  ShieldCheck,
  Settings,
  RefreshCw,
  Bell,
  MessageSquare,
  BarChart3,
  History,
  ChevronDown,
  ChevronLeft,
  X,
  Info,
  DollarSign,
  Shield,
  TrendingUp,
  List,
  Menu as MenuIcon,
  Key,
  Sliders,
  PlusCircle,
  Activity,
  CheckSquare,
  Crown,
  HelpCircle,
  Globe,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';

import { LoanAgentSidebar } from './LoanAgentSidebar';
import { InsuranceAgentSidebar } from './InsuranceAgentSidebar';
import { InvestmentAgentSidebar } from './InvestmentAgentSidebar';
import { CustomerSidebar } from './CustomerSidebar';

const AVAILABLE_ICONS: Record<string, any> = {
  LayoutDashboard,
  Users,
  UserCheck,
  User,
  UserPlus,
  FileText,
  FolderOpen,
  Package,
  ShieldCheck,
  Shield,
  Settings,
  RefreshCw,
  Bell,
  MessageSquare,
  BarChart3,
  History,
  DollarSign,
  TrendingUp,
  List,
  Menu: MenuIcon,
  Key,
  Sliders,
  PlusCircle,
  Activity,
  CheckSquare,
  Globe,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean | ((prev: boolean) => boolean)) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isExpanded = false,
  setIsExpanded,
}) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Dynamic Menus State
  const [dynamicMenus, setDynamicMenus] = useState<any[]>([]);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  const fetchMyMenus = async () => {
    try {
      const res = await api.get('/menus/my-menus');
      if (res.data.success) {
        const filtered = (res.data.data || []).filter(
          (m: any) => !m.url?.includes('/notifications') && m.name !== 'Notifications'
        );
        setDynamicMenus(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch dynamic menus:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyMenus();
    }

    const handleUpdate = () => fetchMyMenus();
    window.addEventListener('menuPermissionsUpdated', handleUpdate);
    return () => window.removeEventListener('menuPermissionsUpdated', handleUpdate);
  }, [user]);

  // Single active open sub-menu (Accordion Behavior)
  useEffect(() => {
    let activeKey: string | null = null;

    if (
      location.pathname.startsWith('/superadmin/users') ||
      location.pathname.startsWith('/superadmin/agents') ||
      location.pathname.startsWith('/superadmin/customers')
    ) {
      activeKey = 'users-parent';
    } else if (
      location.pathname.startsWith('/superadmin/applications') ||
      location.pathname.startsWith('/superadmin/create-application')
    ) {
      activeKey = 'applications';
    } else if (location.pathname.startsWith('/superadmin/website-management')) {
      activeKey = 'website';
    }

    if (!activeKey && dynamicMenus && dynamicMenus.length > 0) {
      dynamicMenus.forEach((m) => {
        if (
          m.children &&
          m.children.some(
            (c: any) =>
              c.url === location.pathname ||
              (c.url && c.url !== '/' && location.pathname.startsWith(c.url))
          )
        ) {
          activeKey = m.id;
        }
      });
    }

    if (activeKey) {
      setOpenSubMenus({ [activeKey]: true });
    } else {
      setOpenSubMenus({});
    }
  }, [location.pathname, dynamicMenus]);

  const toggleSubMenu = (menuKey: string) => {
    setOpenSubMenus((prev) => (prev[menuKey] ? {} : { [menuKey]: true }));
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

  // Render Role-Specific Sidebar for non-Super Admin roles
  if (user.role === 'LOAN_AGENT') {
    return <LoanAgentSidebar isOpen={isOpen} onClose={onClose} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />;
  }
  if (user.role === 'INSURANCE_AGENT') {
    return <InsuranceAgentSidebar isOpen={isOpen} onClose={onClose} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />;
  }
  if (user.role === 'INVESTMENT_AGENT') {
    return <InvestmentAgentSidebar isOpen={isOpen} onClose={onClose} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />;
  }
  if (user.role === 'CUSTOMER') {
    return <CustomerSidebar isOpen={isOpen} onClose={onClose} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />;
  }

  const renderIcon = (iconName: string) => {
    const IconComp = AVAILABLE_ICONS[iconName] || FileText;
    return <IconComp className="w-[19px] h-[19px] shrink-0" />;
  };

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
            <Crown className="w-4 h-4 text-[#1E4FD6] fill-blue-100 shrink-0" />
            {isExpanded && <span className="truncate font-bold">Super Admin</span>}
          </div>

          {/* Dynamic Menu Navigation List */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1.5 custom-scrollbar">
            {dynamicMenus.length > 0 ? (
              dynamicMenus.map((m) => {
                const hasChildren = m.children && m.children.length > 0;

                if (!hasChildren) {
                  return (
                    <NavLink
                      key={m.id}
                      to={m.url}
                      onClick={handleItemClick}
                      title={!isExpanded ? m.name : undefined}
                      className={({ isActive }) => getNavItemClasses(isActive)}
                    >
                      {renderIcon(m.icon)}
                      {isExpanded && <span className="truncate">{m.name}</span>}
                    </NavLink>
                  );
                }

                const isSubOpen = Boolean(openSubMenus[m.id]);
                return (
                  <div key={m.id}>
                    <button
                      onClick={() => handleParentClick(m.id)}
                      title={!isExpanded ? m.name : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
                        isSubOpen ? 'bg-[#16273D] text-white' : 'text-[#8FA0B8] hover:bg-[#16273D] hover:text-white'
                      }`}
                    >
                      {renderIcon(m.icon)}
                      {isExpanded && (
                        <>
                          <span className="truncate text-left flex-1">{m.name}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                              isSubOpen ? 'rotate-180 text-white' : ''
                            }`}
                          />
                        </>
                      )}
                    </button>

                    {isExpanded && isSubOpen && (
                      <div className="pl-8 pr-1 py-1 space-y-1">
                        {m.children.map((c: any) => (
                          <NavLink
                            key={c.id}
                            to={c.url}
                            onClick={handleItemClick}
                            className={({ isActive }) =>
                              `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                                isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                              }`
                            }
                          >
                            {c.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              /* Hardcoded Navigation */
              <>
                <NavLink
                  to="/superadmin/dashboard"
                  onClick={handleItemClick}
                  title={!isExpanded ? 'Dashboard' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  <LayoutDashboard className="w-[19px] h-[19px] shrink-0" />
                  {isExpanded && <span className="truncate">Dashboard</span>}
                </NavLink>

                {/* Users Management */}
                <div>
                  <button
                    onClick={() => handleParentClick('users-parent')}
                    title={!isExpanded ? 'Users Management' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
                      location.pathname.startsWith('/superadmin/users') || location.pathname.startsWith('/superadmin/agents') || location.pathname.startsWith('/superadmin/customers')
                        ? 'bg-[#1E4FD6] text-white font-semibold shadow-md shadow-blue-600/30'
                        : openSubMenus['users-parent']
                        ? 'bg-[#16273D] text-white'
                        : 'text-[#8FA0B8] hover:bg-[#16273D] hover:text-white'
                    }`}
                  >
                    <Users className="w-[19px] h-[19px] shrink-0" />
                    {isExpanded && (
                      <>
                        <span className="truncate text-left flex-1">Users Management</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                            openSubMenus['users-parent'] ? 'rotate-180 text-white' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {isExpanded && openSubMenus['users-parent'] && (
                    <div className="pl-8 pr-1 py-1 space-y-1">
                      <NavLink
                        to="/superadmin/users"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        All Portal Users
                      </NavLink>
                      <NavLink
                        to="/superadmin/users/create"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Create / Invite User
                      </NavLink>
                      <NavLink
                        to="/superadmin/agents/manage"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Manage &amp; Invite Agents
                      </NavLink>
                      <NavLink
                        to="/superadmin/customers"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Customers
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* Applications */}
                <div>
                  <button
                    onClick={() => handleParentClick('applications')}
                    title={!isExpanded ? 'Applications' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
                      location.pathname.startsWith('/superadmin/applications') || location.pathname.startsWith('/superadmin/create-application')
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
                        to="/superadmin/applications/all"
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
                        to="/superadmin/applications/loans"
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
                        to="/superadmin/applications/insurance"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Insurance Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/applications/investments"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Investment Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/create-application"
                        onClick={handleItemClick}
                        className="block py-1.5 px-2.5 rounded-lg text-xs font-bold text-[#1E4FD6] bg-white hover:bg-slate-100 flex items-center gap-1 mt-1"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> + Create Application
                      </NavLink>
                    </div>
                  )}
                </div>

                <NavLink
                  to="/superadmin/documents"
                  onClick={handleItemClick}
                  title={!isExpanded ? 'Documents' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  <FolderOpen className="w-[19px] h-[19px] shrink-0" />
                  {isExpanded && <span className="truncate">Documents</span>}
                </NavLink>

                <NavLink
                  to="/superadmin/products/catalog"
                  onClick={handleItemClick}
                  title={!isExpanded ? 'Products & Services' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  <Package className="w-[19px] h-[19px] shrink-0" />
                  {isExpanded && <span className="truncate">Products &amp; Services</span>}
                </NavLink>

                <NavLink
                  to="/superadmin/permissions/menu-items"
                  onClick={handleItemClick}
                  title={!isExpanded ? 'Roles & Permissions' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  <ShieldCheck className="w-[19px] h-[19px] shrink-0" />
                  {isExpanded && <span className="truncate">Roles &amp; Permissions</span>}
                </NavLink>

                <NavLink
                  to="/superadmin/system/configurations"
                  onClick={handleItemClick}
                  title={!isExpanded ? 'System Management' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  <Sliders className="w-[19px] h-[19px] shrink-0" />
                  {isExpanded && <span className="truncate">System Management</span>}
                </NavLink>

                {/* Website & Portal */}
                <div>
                  <button
                    onClick={() => handleParentClick('website')}
                    title={!isExpanded ? 'Website & Portal' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
                      location.pathname.startsWith('/superadmin/website-management')
                        ? 'bg-[#1E4FD6] text-white font-semibold shadow-md shadow-blue-600/30'
                        : openSubMenus['website']
                        ? 'bg-[#16273D] text-white'
                        : 'text-[#8FA0B8] hover:bg-[#16273D] hover:text-white'
                    }`}
                  >
                    <Globe className="w-[19px] h-[19px] shrink-0" />
                    {isExpanded && (
                      <>
                        <span className="truncate text-left flex-1">Website &amp; Portal</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                            openSubMenus['website'] ? 'rotate-180 text-white' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {isExpanded && openSubMenus['website'] && (
                    <div className="pl-8 pr-1 py-1 space-y-1">
                      <NavLink
                        to="/superadmin/website-management/content"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Website Content
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/contact"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Contact Info
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/social"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Social Media
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/media"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Images &amp; Media
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/preview"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Preview Changes
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/history"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'text-white bg-[#16273D] font-bold' : 'text-[#8FA0B8] hover:text-white hover:bg-[#16273D]'
                          }`
                        }
                      >
                        Change History
                      </NavLink>
                    </div>
                  )}
                </div>

                <NavLink
                  to="/superadmin/updates/release-notes"
                  onClick={handleItemClick}
                  title={!isExpanded ? 'Updates & Versions' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  <RefreshCw className="w-[19px] h-[19px] shrink-0" />
                  {isExpanded && <span className="truncate">Updates &amp; Versions</span>}
                </NavLink>

                <NavLink
                  to="/superadmin/enquiries"
                  onClick={handleItemClick}
                  title={!isExpanded ? 'Enquiries / Complaints' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  <MessageSquare className="w-[19px] h-[19px] shrink-0" />
                  {isExpanded && <span className="truncate">Enquiries / Complaints</span>}
                </NavLink>

                <NavLink
                  to="/superadmin/reports"
                  onClick={handleItemClick}
                  title={!isExpanded ? 'Reports' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  <BarChart3 className="w-[19px] h-[19px] shrink-0" />
                  {isExpanded && <span className="truncate">Reports</span>}
                </NavLink>

                <NavLink
                  to="/superadmin/audit-logs"
                  onClick={handleItemClick}
                  title={!isExpanded ? 'Audit Logs' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  <History className="w-[19px] h-[19px] shrink-0" />
                  {isExpanded && <span className="truncate">Audit Logs</span>}
                </NavLink>

                <NavLink
                  to="/superadmin/settings/portal"
                  onClick={handleItemClick}
                  title={!isExpanded ? 'Settings' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  <Settings className="w-[19px] h-[19px] shrink-0" />
                  {isExpanded && <span className="truncate">Settings</span>}
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};
