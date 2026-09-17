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
import { GFSLogo } from './GFSLogo';
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
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
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

    // Listen for menu updates from Superadmin Permission Manager
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
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
    }
    setOpenSubMenus((prev) => (prev[menuKey] ? {} : { [menuKey]: true }));
  };

  const handleNavItemClick = () => {
    onClose();
    if (onToggleCollapse && !isCollapsed) {
      onToggleCollapse();
    }
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

  if (!user) return null;

  // Render Role-Specific Sidebar for non-Super Admin roles
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

  const renderIcon = (iconName: string, isActive: boolean) => {
    const IconComp = AVAILABLE_ICONS[iconName] || FileText;
    return (
      <IconComp
        className={`h-[22px] w-[22px] flex-shrink-0 transition-all ${
          isCollapsed ? 'mr-0' : 'mr-3.5'
        } ${isActive ? 'text-white' : 'text-[#1d63ed]'}`}
      />
    );
  };

  const getNavItemClasses = (isActive: boolean) =>
    `flex items-center h-12 rounded-xl transition-all ${
      isCollapsed ? 'justify-center px-0' : 'px-4'
    } ${
      isActive
        ? 'bg-[#2377fc] text-white font-bold shadow-md shadow-blue-500/20'
        : 'text-[#1e3a8a] hover:bg-blue-100/70 hover:text-[#0f2852]'
    }`;

  const getSubItemClasses = (isActive: boolean) =>
    `block py-2 px-3 rounded-lg transition-colors font-medium ${
      isActive ? 'text-blue-700 font-extrabold bg-blue-100/60' : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container: Light Soft Blue Background */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-[#e8f1fd] text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-blue-200/80 shadow-sm relative ${
          isCollapsed ? 'lg:w-20 w-64' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3 top-6 z-20 w-6 h-6 rounded-full bg-blue-600 text-white shadow-md items-center justify-center hover:bg-blue-700 transition-all cursor-pointer border-2 border-white"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}

        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Logo & Super Admin Crown Role Badge */}
          <div className="pt-4 pb-4 px-3 flex flex-col items-center justify-center relative bg-[#e8f1fd]">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-900 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>


            {/* Clickable GFS Logo at the Top */}
            <div className="transition-all">
              <GFSLogo size={isCollapsed ? 'sm' : 'lg'} variant="card" onClick={handleLogoClick} />
            </div>

            {/* Super Admin Role Badge */}
            <div className={`mt-3 px-3 py-1 rounded-full bg-white/90 text-[#1e3a8a] border border-blue-200/80 text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 font-sans transition-all ${
              isCollapsed ? 'px-2 py-1' : 'px-4 py-1.5'
            }`}>
              <Crown className="w-4 h-4 text-blue-600 fill-blue-100 flex-shrink-0" />
              {!isCollapsed && <span>Super Admin</span>}
            </div>
          </div>

          {/* Dynamic Menu Navigation List */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1.5 text-[14.5px] font-semibold custom-scrollbar">
            {dynamicMenus.length > 0 ? (
              dynamicMenus.map((m) => {
                const hasChildren = m.children && m.children.length > 0;

                if (!hasChildren) {
                  return (
                    <NavLink
                      key={m.id}
                      to={m.url}
                      onClick={handleNavItemClick}
                      title={m.name}
                      className={({ isActive }) => getNavItemClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
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
                      onClick={() => toggleSubMenu(m.id)}
                      title={m.name}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-0' : 'justify-between px-4'
                      } h-12 rounded-xl transition-all text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] font-semibold ${
                        isSubOpen ? 'bg-blue-100/60 text-[#0f2852]' : ''
                      }`}
                    >
                      <div className="flex items-center truncate">
                        {renderIcon(m.icon, false)}
                        {!isCollapsed && <span className="truncate">{m.name}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown
                          className={`h-4 w-4 text-[#1d63ed] ml-auto flex-shrink-0 transition-transform ${
                            isSubOpen ? 'rotate-180 text-blue-700' : ''
                          }`}
                        />
                      )}
                    </button>

                    {isSubOpen && !isCollapsed && (
                      <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-blue-100 text-xs shadow-inner">
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
              /* Hardcoded Navigation */
              <>
                <NavLink
                  to="/superadmin/dashboard"
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <LayoutDashboard className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      <span>Dashboard</span>
                    </>
                  )}
                </NavLink>

                {/* Collapsible Users Management Menu */}
                <div>
                  <button
                    onClick={() => toggleSubMenu('users-parent')}
                    className={`w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] font-semibold ${
                      openSubMenus['users-parent'] ? 'bg-blue-100/60 text-[#0f2852]' : ''
                    }`}
                  >
                    <div className="flex items-center truncate">
                      <Users className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-[#1d63ed]" />
                      <span className="truncate">Users Management</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#1d63ed] ml-auto flex-shrink-0 transition-transform ${
                        openSubMenus['users-parent'] ? 'rotate-180 text-blue-700' : ''
                      }`}
                    />
                  </button>

                  {openSubMenus['users-parent'] && (
                    <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-blue-100 text-xs shadow-inner">
                      <NavLink
                        to="/superadmin/users"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        All Portal Users
                      </NavLink>
                      <NavLink
                        to="/superadmin/users/create"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Create / Invite User
                      </NavLink>
                      <NavLink
                        to="/superadmin/agents/manage"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Manage & Invite Agents
                      </NavLink>
                      <NavLink
                        to="/superadmin/customers"
                        onClick={onClose}
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
                    onClick={() => toggleSubMenu('applications')}
                    className={`w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] font-semibold ${
                      openSubMenus['applications'] ? 'bg-blue-100/60 text-[#0f2852]' : ''
                    }`}
                  >
                    <div className="flex items-center truncate">
                      <FileText className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-[#1d63ed]" />
                      <span className="truncate">Applications</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#1d63ed] ml-auto flex-shrink-0 transition-transform ${
                        openSubMenus['applications'] ? 'rotate-180 text-blue-700' : ''
                      }`}
                    />
                  </button>

                  {openSubMenus['applications'] && (
                    <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-blue-100 text-xs shadow-inner">
                      <NavLink
                        to="/superadmin/applications/all"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        All Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/applications/loans"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Loan Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/applications/insurance"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Insurance Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/applications/investments"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Investment Applications
                      </NavLink>
                      <NavLink
                        to="/superadmin/create-application"
                        onClick={onClose}
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
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <FolderOpen className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      <span>Documents</span>
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/products/catalog"
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <Package className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      <span>Products & Services</span>
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/permissions/menu-items"
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <ShieldCheck className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      <span>Roles & Permissions</span>
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/system/configurations"
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <Sliders className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      <span>System Management</span>
                    </>
                  )}
                </NavLink>

                {/* Collapsible Website & Portal Management Menu */}
                <div>
                  <button
                    onClick={() => toggleSubMenu('website')}
                    className={`w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all text-[#1e3a8a] hover:bg-blue-100/80 hover:text-[#0f2852] font-semibold ${
                      openSubMenus['website'] ? 'bg-blue-100/60 text-[#0f2852]' : ''
                    }`}
                  >
                    <div className="flex items-center truncate">
                      <Globe className="h-[22px] w-[22px] mr-3.5 flex-shrink-0 text-[#1d63ed]" />
                      <span className="truncate">Website & Portal</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#1d63ed] ml-auto flex-shrink-0 transition-transform ${
                        openSubMenus['website'] ? 'rotate-180 text-blue-700' : ''
                      }`}
                    />
                  </button>

                  {openSubMenus['website'] && (
                    <div className="pl-11 pr-3 py-1.5 space-y-1 bg-white/70 rounded-xl my-1 border border-blue-100 text-xs shadow-inner">
                      <NavLink
                        to="/superadmin/website-management/content"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Website Content
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/contact"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Contact Info
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/social"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Social Media
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/media"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Images & Media
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/preview"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Preview Changes
                      </NavLink>
                      <NavLink
                        to="/superadmin/website-management/history"
                        onClick={onClose}
                        className={({ isActive }) => getSubItemClasses(isActive)}
                      >
                        Change History
                      </NavLink>
                    </div>
                  )}
                </div>

                <NavLink
                  to="/superadmin/updates/release-notes"
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <RefreshCw className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      <span>Updates & Versions</span>
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/enquiries"
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <MessageSquare className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      <span>Enquiries / Complaints</span>
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/reports"
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <BarChart3 className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      <span>Reports</span>
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/audit-logs"
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <History className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      <span>Audit Logs</span>
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/superadmin/settings/portal"
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <Settings className={`h-[22px] w-[22px] mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1d63ed]'}`} />
                      <span>Settings</span>
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
