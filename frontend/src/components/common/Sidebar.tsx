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
  ChevronRight,
  X,
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
  Globe,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { GFSLogo } from './GFSLogo';
import { SidebarTooltip } from './SidebarTooltip';
import { api } from '../../services/api';

import { LoanAgentSidebar } from './LoanAgentSidebar';
import { InsuranceAgentSidebar } from './InsuranceAgentSidebar';
import { InvestmentAgentSidebar } from './InvestmentAgentSidebar';
import { CustomerSidebar } from './CustomerSidebar';
import { SidebarIconLoading } from './SidebarIconLoading';

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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Dynamic Menus State & Menu Loading
  const [dynamicMenus, setDynamicMenus] = useState<any[]>([]);
  const [menuLoading, setMenuLoading] = useState<boolean>(true);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  const fetchMyMenus = async () => {
    try {
      setMenuLoading(true);
      const res = await api.get('/menus/my-menus');
      if (res.data?.success) {
        const filtered = (res.data.data || []).filter(
          (m: any) => !m.url?.includes('/notifications') && m.name !== 'Notifications'
        );
        setDynamicMenus(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch dynamic menus:', err);
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyMenus();
    } else {
      setMenuLoading(false);
    }

    const handleUpdate = () => fetchMyMenus();
    window.addEventListener('menuPermissionsUpdated', handleUpdate);
    return () => window.removeEventListener('menuPermissionsUpdated', handleUpdate);
  }, [user]);

  // Close mobile sidebar drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Accordion auto-expansion based on active route
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
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
    }
    setOpenSubMenus((prev) => (prev[menuKey] ? {} : { [menuKey]: true }));
  };

  const handleNavItemClick = () => {
    onClose();
  };

  const handleLogoClick = () => {
    const targetDashboard = '/superadmin/dashboard';
    if (location.pathname === targetDashboard) {
      window.location.reload();
    } else {
      navigate(targetDashboard);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onClose();
    }
  };

  // Safe Dynamic Role Mapping
  const getRoleDisplayName = (): string => {
    if (!user) return 'Portal User';
    const roleStr = String(user.role);
    switch (roleStr) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin';
      case 'LOAN_AGENT':
        return 'Loan Advisor';
      case 'INSURANCE_AGENT':
        return 'Insurance Advisor';
      case 'INVESTMENT_AGENT':
        return 'Investment Advisor';
      case 'CUSTOMER':
        return 'Customer';
      default:
        return roleStr.replace('_', ' ');
    }
  };

  // 1. Render Loading State during Auth / Role Recovery
  if (authLoading || !user) {
    return (
      <SidebarIconLoading
        isOpen={isOpen}
        onClose={onClose}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        variant="blue"
        roleName="GFS Portal"
      />
    );
  }

  // 2. Delegate to Role-Specific Sidebar for non-Super Admin / Admin roles
  if (user.role === 'LOAN_AGENT') {
    return <LoanAgentSidebar isOpen={isOpen} onClose={onClose} isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />;
  }
  if (user.role === 'INSURANCE_AGENT') {
    return <InsuranceAgentSidebar isOpen={isOpen} onClose={onClose} isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />;
  }
  if (user.role === 'INVESTMENT_AGENT') {
    return <InvestmentAgentSidebar isOpen={isOpen} onClose={onClose} isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />;
  }
  if (user.role === 'CUSTOMER') {
    return <CustomerSidebar isOpen={isOpen} onClose={onClose} isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />;
  }

  // 3. Render Loading State while Super Admin Dynamic Menus are Fetching
  if (menuLoading) {
    return (
      <SidebarIconLoading
        isOpen={isOpen}
        onClose={onClose}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        variant="blue"
        roleName={getRoleDisplayName()}
      />
    );
  }

  const renderIcon = (iconName: string, isActive: boolean) => {
    const IconComp = AVAILABLE_ICONS[iconName] || FileText;
    return (
      <IconComp
        className={`h-5 w-5 flex-shrink-0 transition-all ${
          isCollapsed ? 'mr-0' : 'mr-3'
        } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
      />
    );
  };

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

      {/* Sidebar Container: Premium GFS Light SaaS Theme */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-[#f0f5ff] text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-blue-200/80 shadow-sm relative ${
          isCollapsed ? 'lg:w-20 w-64' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3 top-7 z-20 w-6 h-6 rounded-full bg-blue-600 text-white shadow-md items-center justify-center hover:bg-blue-700 transition-transform hover:scale-110 cursor-pointer border-2 border-white"
            aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}

        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Identity Header: GFS Company Logo + Dynamic Role Badge */}
          <div className="pt-5 pb-4 px-3 flex flex-col items-center justify-center relative border-b border-blue-200/60 bg-gradient-to-b from-blue-100/50 to-transparent">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-black/5 lg:hidden"
              aria-label="Close sidebar menu"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="transition-transform duration-300 hover:scale-105">
              <GFSLogo size={isCollapsed ? 'xs' : 'sm'} variant="card" onClick={handleLogoClick} />
            </div>

            {!isCollapsed ? (
              <div className="mt-3 px-3.5 py-1 rounded-full bg-white/95 text-[#1e3a8a] border border-blue-200/90 text-[11px] font-extrabold tracking-wide shadow-sm flex items-center justify-center gap-1.5 transition-all">
                <Crown className="w-3.5 h-3.5 text-blue-600 fill-blue-100 flex-shrink-0" />
                <span>{getRoleDisplayName()}</span>
              </div>
            ) : (
              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            )}
          </div>

          {/* Scrollable Navigation Menu List */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1 text-[13.5px] custom-scrollbar">
            {dynamicMenus.length > 0 ? (
              dynamicMenus.map((m) => {
                const hasChildren = m.children && m.children.length > 0;

                if (!hasChildren) {
                  return (
                    <SidebarTooltip key={m.id} content={m.name} isCollapsed={isCollapsed}>
                      <NavLink
                        to={m.url}
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getNavItemClasses(isActive)}
                      >
                        {({ isActive }) => (
                          <>
                            {renderIcon(m.icon, isActive)}
                            {!isCollapsed && (
                              <span className="truncate font-semibold transition-opacity duration-200">{m.name}</span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarTooltip>
                  );
                }

                // Collapsible Submenu Parent Item
                const isSubOpen = Boolean(openSubMenus[m.id]);
                return (
                  <div key={m.id} className="w-full">
                    <SidebarTooltip content={m.name} isCollapsed={isCollapsed}>
                      <button
                        onClick={() => toggleSubMenu(m.id)}
                        className={`w-full flex items-center ${
                          isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                        } h-11 rounded-xl transition-all duration-200 text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852] font-semibold ${
                          isSubOpen ? 'bg-blue-100/60 text-[#0f2852]' : ''
                        }`}
                      >
                        <div className="flex items-center truncate">
                          {renderIcon(m.icon, false)}
                          {!isCollapsed && (
                            <span className="truncate font-semibold transition-opacity duration-200">{m.name}</span>
                          )}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown
                            className={`h-4 w-4 text-blue-500 ml-auto flex-shrink-0 transition-transform duration-200 ${
                              isSubOpen ? 'rotate-180 text-blue-700' : ''
                            }`}
                          />
                        )}
                      </button>
                    </SidebarTooltip>

                    {isSubOpen && !isCollapsed && (
                      <div className="pl-9 pr-2 py-1.5 space-y-1 bg-white/80 rounded-xl my-1 border border-blue-100/80 shadow-sm">
                        {m.children.map((c: any) => (
                          <NavLink
                            key={c.id}
                            to={c.url}
                            onClick={handleNavItemClick}
                            className={({ isActive }) => getSubItemClasses(isActive)}
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
              /* Hardcoded Fallback Menu Structure with Section Headers */
              <>
                {/* SECTION 1: MAIN */}
                {!isCollapsed && (
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-900/60 px-3 pt-2 pb-1">
                    Main
                  </div>
                )}
                <SidebarTooltip content="Dashboard" isCollapsed={isCollapsed}>
                  <NavLink
                    to="/superadmin/dashboard"
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

                {/* SECTION 2: MANAGEMENT */}
                {!isCollapsed && (
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-900/60 px-3 pt-3 pb-1">
                    Management
                  </div>
                )}

                {/* Users Management Submenu */}
                <div className="w-full">
                  <SidebarTooltip content="Users Management" isCollapsed={isCollapsed}>
                    <button
                      onClick={() => toggleSubMenu('users-parent')}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                      } h-11 rounded-xl transition-all duration-200 text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852] font-semibold ${
                        openSubMenus['users-parent'] ? 'bg-blue-100/60 text-[#0f2852]' : ''
                      }`}
                    >
                      <div className="flex items-center truncate">
                        <Users
                          className={`h-5 w-5 flex-shrink-0 text-blue-600 group-hover:text-blue-700 ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">Users Management</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown
                          className={`h-4 w-4 text-blue-500 ml-auto flex-shrink-0 transition-transform duration-200 ${
                            openSubMenus['users-parent'] ? 'rotate-180 text-blue-700' : ''
                          }`}
                        />
                      )}
                    </button>
                  </SidebarTooltip>

                  {openSubMenus['users-parent'] && !isCollapsed && (
                    <div className="pl-9 pr-2 py-1.5 space-y-1 bg-white/80 rounded-xl my-1 border border-blue-100/80 shadow-sm">
                      <NavLink
                        to="/superadmin/users"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        All Portal Users
                      </NavLink>
                      <NavLink
                        to="/superadmin/users/create"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Create / Invite User
                      </NavLink>
                      <NavLink
                        to="/superadmin/agents/manage"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Manage & Invite Agents
                      </NavLink>
                      <NavLink
                        to="/superadmin/customers"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Customers
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* SECTION 3: OPERATIONS */}
                {!isCollapsed && (
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-900/60 px-3 pt-3 pb-1">
                    Operations
                  </div>
                )}

                {/* Applications Submenu */}
                <div className="w-full">
                  <SidebarTooltip content="Applications" isCollapsed={isCollapsed}>
                    <button
                      onClick={() => toggleSubMenu('applications')}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                      } h-11 rounded-xl transition-all duration-200 text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852] font-semibold ${
                        openSubMenus['applications'] ? 'bg-blue-100/60 text-[#0f2852]' : ''
                      }`}
                    >
                      <div className="flex items-center truncate">
                        <FileText
                          className={`h-5 w-5 flex-shrink-0 text-blue-600 group-hover:text-blue-700 ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">Applications</span>}
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
                        to="/superadmin/applications/all"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        All Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/applications/loans"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Loan Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/applications/insurance"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Insurance Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/applications/investments"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Investment Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/create-application"
                        onClick={handleNavItemClick}
                        className={({ isActive }) =>
                          `block py-2 px-3 rounded-lg font-bold text-blue-700 hover:bg-blue-100/80 border-t border-blue-100 mt-1 pt-2 ${
                            isActive ? 'bg-blue-100/90 font-extrabold text-blue-800' : ''
                          }`
                        }
                      >
                        + Create Application
                      </NavLink>
                    </div>
                  )}
                </div>

                <SidebarTooltip content="Documents" isCollapsed={isCollapsed}>
                  <NavLink
                    to="/superadmin/documents"
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
                        {!isCollapsed && <span className="truncate font-semibold">Documents</span>}
                      </>
                    )}
                  </NavLink>
                </SidebarTooltip>

                <SidebarTooltip content="Products & Services" isCollapsed={isCollapsed}>
                  <NavLink
                    to="/superadmin/products/catalog"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getNavItemClasses(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <Package
                          className={`h-5 w-5 flex-shrink-0 transition-all ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">Products & Services</span>}
                      </>
                    )}
                  </NavLink>
                </SidebarTooltip>

                <SidebarTooltip content="Roles & Permissions" isCollapsed={isCollapsed}>
                  <NavLink
                    to="/superadmin/permissions/menu-items"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getNavItemClasses(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <ShieldCheck
                          className={`h-5 w-5 flex-shrink-0 transition-all ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">Roles & Permissions</span>}
                      </>
                    )}
                  </NavLink>
                </SidebarTooltip>

                <SidebarTooltip content="System Management" isCollapsed={isCollapsed}>
                  <NavLink
                    to="/superadmin/system/configurations"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getNavItemClasses(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <Sliders
                          className={`h-5 w-5 flex-shrink-0 transition-all ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">System Management</span>}
                      </>
                    )}
                  </NavLink>
                </SidebarTooltip>

                {/* Website & Portal Management Submenu */}
                <div className="w-full">
                  <SidebarTooltip content="Website & Portal" isCollapsed={isCollapsed}>
                    <button
                      onClick={() => toggleSubMenu('website')}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                      } h-11 rounded-xl transition-all duration-200 text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852] font-semibold ${
                        openSubMenus['website'] ? 'bg-blue-100/60 text-[#0f2852]' : ''
                      }`}
                    >
                      <div className="flex items-center truncate">
                        <Globe
                          className={`h-5 w-5 flex-shrink-0 text-blue-600 group-hover:text-blue-700 ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">Website & Portal</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown
                          className={`h-4 w-4 text-blue-500 ml-auto flex-shrink-0 transition-transform duration-200 ${
                            openSubMenus['website'] ? 'rotate-180 text-blue-700' : ''
                          }`}
                        />
                      )}
                    </button>
                  </SidebarTooltip>

                  {openSubMenus['website'] && !isCollapsed && (
                    <div className="pl-9 pr-2 py-1.5 space-y-1 bg-white/80 rounded-xl my-1 border border-blue-100/80 shadow-sm">
                      <NavLink
                        to="/superadmin/website-management/content"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Website Content
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/contact"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Contact Info
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/social"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Social Media
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/media"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Images & Media
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/preview"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Preview Changes
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/history"
                        onClick={handleNavItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Change History
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* SECTION 4: SUPPORT & ANALYTICS */}
                {!isCollapsed && (
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-900/60 px-3 pt-3 pb-1">
                    Support & Analytics
                  </div>
                )}

                <SidebarTooltip content="Updates & Versions" isCollapsed={isCollapsed}>
                  <NavLink
                    to="/superadmin/updates/release-notes"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getNavItemClasses(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <RefreshCw
                          className={`h-5 w-5 flex-shrink-0 transition-all ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">Updates & Versions</span>}
                      </>
                    )}
                  </NavLink>
                </SidebarTooltip>

                <SidebarTooltip content="Enquiries / Complaints" isCollapsed={isCollapsed}>
                  <NavLink
                    to="/superadmin/enquiries"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getNavItemClasses(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <MessageSquare
                          className={`h-5 w-5 flex-shrink-0 transition-all ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">Enquiries / Complaints</span>}
                      </>
                    )}
                  </NavLink>
                </SidebarTooltip>

                <SidebarTooltip content="Reports" isCollapsed={isCollapsed}>
                  <NavLink
                    to="/superadmin/reports"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getNavItemClasses(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <BarChart3
                          className={`h-5 w-5 flex-shrink-0 transition-all ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">Reports</span>}
                      </>
                    )}
                  </NavLink>
                </SidebarTooltip>

                <SidebarTooltip content="Audit Logs" isCollapsed={isCollapsed}>
                  <NavLink
                    to="/superadmin/audit-logs"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getNavItemClasses(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <History
                          className={`h-5 w-5 flex-shrink-0 transition-all ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">Audit Logs</span>}
                      </>
                    )}
                  </NavLink>
                </SidebarTooltip>

                <SidebarTooltip content="Settings" isCollapsed={isCollapsed}>
                  <NavLink
                    to="/superadmin/settings/portal"
                    onClick={handleNavItemClick}
                    className={({ isActive }) => getNavItemClasses(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <Settings
                          className={`h-5 w-5 flex-shrink-0 transition-all ${
                            isCollapsed ? 'mr-0' : 'mr-3'
                          } ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`}
                        />
                        {!isCollapsed && <span className="truncate font-semibold">Settings</span>}
                      </>
                    )}
                  </NavLink>
                </SidebarTooltip>
              </>
            )}
          </nav>

          {/* Bottom Utility Bar: Logout Account */}
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

export default Sidebar;
