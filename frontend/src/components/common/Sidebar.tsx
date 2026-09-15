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
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  setIsCollapsed,
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

  // Render Role-Specific Sidebar for non-Super Admin roles
  if (user.role === 'LOAN_AGENT') {
    return <LoanAgentSidebar isOpen={isOpen} onClose={onClose} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
  }
  if (user.role === 'INSURANCE_AGENT') {
    return <InsuranceAgentSidebar isOpen={isOpen} onClose={onClose} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
  }
  if (user.role === 'INVESTMENT_AGENT') {
    return <InvestmentAgentSidebar isOpen={isOpen} onClose={onClose} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
  }
  if (user.role === 'CUSTOMER') {
    return <CustomerSidebar isOpen={isOpen} onClose={onClose} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
  }

  const renderIcon = (iconName: string, isActive: boolean) => {
    const IconComp = AVAILABLE_ICONS[iconName] || FileText;
    return (
      <IconComp
        className={`h-[22px] w-[22px] flex-shrink-0 transition-colors ${isCollapsed ? '' : 'mr-3.5'} ${
          isActive ? 'text-white' : 'text-[#1d63ed]'
        }`}
      />
    );
  };

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

  const getSubItemClasses = (isActive: boolean) =>
    `block py-2 px-3 rounded-lg transition-colors font-medium ${
      isActive ? 'text-blue-700 font-extrabold bg-blue-100/60' : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-[#e8f1fd] text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-blue-200/80 shadow-xs ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Mobile Close & Collapsed Role Badge */}
          <div className={`py-3 px-3 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} bg-[#e8f1fd] border-b border-blue-200/50`}>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>

            {!isCollapsed && (
              <div className="px-4 py-1.5 rounded-full bg-white/90 text-[#1e3a8a] border border-blue-200/80 text-xs font-extrabold shadow-2xs flex items-center gap-1.5 mx-auto">
                <Crown className="w-4 h-4 text-blue-600 fill-blue-100" />
                <span>Super Admin</span>
              </div>
            )}
            {isCollapsed && (
              <div title="Super Admin Portal" className="p-2 rounded-full bg-white/90 text-blue-600 border border-blue-200/80 shadow-2xs">
                <Crown className="w-4 h-4 fill-blue-100" />
              </div>
            )}
          </div>

          {/* Dynamic Menu Navigation List */}
          <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1.5 text-[14.5px] font-semibold custom-scrollbar">
            {dynamicMenus.length > 0 ? (
              dynamicMenus.map((m) => {
                const hasChildren = m.children && m.children.length > 0;

                if (!hasChildren) {
                  return (
                    <NavLink
                      key={m.id}
                      to={m.url}
                      onClick={handleItemClick}
                      title={isCollapsed ? m.name : undefined}
                      className={({ isActive }) => getNavItemClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          {isCollapsed && isActive && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                          )}
                          {renderIcon(m.icon, isActive)}
                          {!isCollapsed && <span className="truncate">{m.name}</span>}
                        </>
                      )}
                    </NavLink>
                  );
                }

                // Collapsible Parent Menu Item
                const isSubOpen = Boolean(openSubMenus[m.id]);
                return (
                  <div key={m.id}>
                    <button
                      onClick={() => handleParentClick(m.id)}
                      title={isCollapsed ? m.name : undefined}
                      className={
                        isCollapsed
                          ? `relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl transition-all cursor-pointer text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] ${
                              isSubOpen ? 'bg-blue-100/80 text-[#0f2852]' : ''
                            }`
                          : `w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] font-semibold ${
                              isSubOpen ? 'bg-blue-100/60 text-[#0f2852]' : ''
                            }`
                      }
                    >
                      {isCollapsed ? (
                        renderIcon(m.icon, false)
                      ) : (
                        <>
                          <div className="flex items-center truncate">
                            {renderIcon(m.icon, false)}
                            <span className="truncate">{m.name}</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-[#1d63ed] ml-auto flex-shrink-0 transition-transform ${
                              isSubOpen ? 'rotate-180 text-blue-700' : ''
                            }`}
                          />
                        </>
                      )}
                    </button>

                    {!isCollapsed && isSubOpen && (
                      <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-blue-100 text-xs shadow-inner">
                        {m.children.map((c: any) => (
                          <NavLink
                            key={c.id}
                            to={c.url}
                            onClick={handleItemClick}
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
              /* Hardcoded Fallback Navigation */
              <>
                <NavLink
                  to="/superadmin/dashboard"
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

                {/* Collapsible Users Management Menu */}
                <div>
                  <button
                    onClick={() => handleParentClick('users-parent')}
                    title={isCollapsed ? 'Users Management' : undefined}
                    className={
                      isCollapsed
                        ? `relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl transition-all cursor-pointer text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] ${
                            openSubMenus['users-parent'] ? 'bg-blue-100/80' : ''
                          }`
                        : `w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] font-semibold ${
                            openSubMenus['users-parent'] ? 'bg-blue-100/60 text-[#0f2852]' : ''
                          }`
                    }
                  >
                    {isCollapsed ? (
                      <Users className="h-[22px] w-[22px] text-[#1d63ed]" />
                    ) : (
                      <>
                        <div className="flex items-center truncate">
                          <Users className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-[#1d63ed]" />
                          <span className="truncate">Users Management</span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-[#1d63ed] ml-auto flex-shrink-0 transition-transform ${
                            openSubMenus['users-parent'] ? 'rotate-180 text-blue-700' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {!isCollapsed && openSubMenus['users-parent'] && (
                    <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-blue-100 text-xs shadow-inner">
                      <NavLink
                        to="/superadmin/users"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        All Portal Users
                      </NavLink>
                      <NavLink
                        to="/superadmin/users/create"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Create / Invite User
                      </NavLink>
                      <NavLink
                        to="/superadmin/agents/manage"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Manage & Invite Agents
                      </NavLink>
                      <NavLink
                        to="/superadmin/customers"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Customers
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* Collapsible Applications Menu */}
                <div>
                  <button
                    onClick={() => handleParentClick('applications')}
                    title={isCollapsed ? 'Applications' : undefined}
                    className={
                      isCollapsed
                        ? `relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl transition-all cursor-pointer text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] ${
                            openSubMenus['applications'] ? 'bg-blue-100/80' : ''
                          }`
                        : `w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] font-semibold ${
                            openSubMenus['applications'] ? 'bg-blue-100/60 text-[#0f2852]' : ''
                          }`
                    }
                  >
                    {isCollapsed ? (
                      <FileText className="h-[22px] w-[22px] text-[#1d63ed]" />
                    ) : (
                      <>
                        <div className="flex items-center truncate">
                          <FileText className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-[#1d63ed]" />
                          <span className="truncate">Applications</span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-[#1d63ed] ml-auto flex-shrink-0 transition-transform ${
                            openSubMenus['applications'] ? 'rotate-180 text-blue-700' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {!isCollapsed && openSubMenus['applications'] && (
                    <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-blue-100 text-xs shadow-inner">
                      <NavLink
                        to="/superadmin/applications/all"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        All Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/applications/loans"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Loan Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/applications/insurance"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Insurance Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/applications/investments"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Investment Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/create-application"
                        onClick={handleItemClick}
                        className={({ isActive }) =>
                          `block py-2 px-3 rounded-lg font-bold text-blue-700 hover:bg-blue-100/70 border-t border-blue-100 mt-1 pt-2 ${
                            isActive ? 'bg-blue-100/80 font-extrabold text-blue-800' : ''
                          }`
                        }
                      >
                        + Create Application
                      </NavLink>
                    </div>
                  )}
                </div>

                <NavLink
                  to="/superadmin/documents"
                  onClick={handleItemClick}
                  title={isCollapsed ? 'Documents' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                      )}
                      <FolderOpen className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      {!isCollapsed && <span>Documents</span>}
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/products/catalog"
                  onClick={handleItemClick}
                  title={isCollapsed ? 'Products & Services' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                      )}
                      <Package className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      {!isCollapsed && <span>Products & Services</span>}
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/permissions/menu-items"
                  onClick={handleItemClick}
                  title={isCollapsed ? 'Roles & Permissions' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                      )}
                      <ShieldCheck className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      {!isCollapsed && <span>Roles & Permissions</span>}
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/system/configurations"
                  onClick={handleItemClick}
                  title={isCollapsed ? 'System Management' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                      )}
                      <Sliders className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      {!isCollapsed && <span>System Management</span>}
                    </>
                  )}
                </NavLink>

                {/* Collapsible Website & Portal Management Menu */}
                <div>
                  <button
                    onClick={() => handleParentClick('website')}
                    title={isCollapsed ? 'Website & Portal' : undefined}
                    className={
                      isCollapsed
                        ? `relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl transition-all cursor-pointer text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] ${
                            openSubMenus['website'] ? 'bg-blue-100/80' : ''
                          }`
                        : `w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] font-semibold ${
                            openSubMenus['website'] ? 'bg-blue-100/60 text-[#0f2852]' : ''
                          }`
                    }
                  >
                    {isCollapsed ? (
                      <Globe className="h-[22px] w-[22px] text-[#1d63ed]" />
                    ) : (
                      <>
                        <div className="flex items-center truncate">
                          <Globe className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-[#1d63ed]" />
                          <span className="truncate">Website & Portal</span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-[#1d63ed] ml-auto flex-shrink-0 transition-transform ${
                            openSubMenus['website'] ? 'rotate-180 text-blue-700' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {!isCollapsed && openSubMenus['website'] && (
                    <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-blue-100 text-xs shadow-inner">
                      <NavLink
                        to="/superadmin/website-management/content"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Website Content
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/contact"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Contact Info
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/social"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Social Media
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/media"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Images & Media
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/preview"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Preview Changes
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/history"
                        onClick={handleItemClick}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Change History
                      </NavLink>
                    </div>
                  )}
                </div>

                <NavLink
                  to="/superadmin/updates/release-notes"
                  onClick={handleItemClick}
                  title={isCollapsed ? 'Updates & Versions' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                      )}
                      <RefreshCw className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      {!isCollapsed && <span>Updates & Versions</span>}
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/enquiries"
                  onClick={handleItemClick}
                  title={isCollapsed ? 'Enquiries / Complaints' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                      )}
                      <MessageSquare className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      {!isCollapsed && <span>Enquiries / Complaints</span>}
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/reports"
                  onClick={handleItemClick}
                  title={isCollapsed ? 'Reports' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                      )}
                      <BarChart3 className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      {!isCollapsed && <span>Reports</span>}
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/audit-logs"
                  onClick={handleItemClick}
                  title={isCollapsed ? 'Audit Logs' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                      )}
                      <History className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-[#1d63ed]' : 'text-[#1d63ed]'}`} />
                      {!isCollapsed && <span>Audit Logs</span>}
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/settings/portal"
                  onClick={handleItemClick}
                  title={isCollapsed ? 'Settings' : undefined}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2377fc] rounded-r-full" />
                      )}
                      <Settings className={`h-[22px] w-[22px] flex-shrink-0 ${isCollapsed ? '' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      {!isCollapsed && <span>Settings</span>}
                    </>
                  )}
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};
