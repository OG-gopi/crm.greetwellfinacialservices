import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Key,
  Check,
  Code,
  Shield,
  Search,
  Filter,
  Edit,
  Trash2,
  Power,
  Layers,
  ArrowUpDown,
  FileText,
  Users,
  User,
  DollarSign,
  Package,
  Settings,
  Bell,
  MessageSquare,
  BarChart3,
  History,
  FolderOpen,
  LayoutDashboard,
  Menu as MenuIcon,
  RefreshCw,
  Sliders,
  TrendingUp,
  Activity,
  PlusCircle,
  UserCheck,
  CheckSquare,
  AlertCircle,
  Info,
  X,
  Lock,
  ChevronRight,
  Eye,
  CheckCircle2,
  Slash
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { SearchableSelect } from '../../components/common/SearchableSelect';

const ALL_ROLES = [
  { code: 'SUPER_ADMIN', label: 'Super Admin' },
  { code: 'LOAN_AGENT', label: 'Loan Agent' },
  { code: 'INSURANCE_AGENT', label: 'Insurance Agent' },
  { code: 'INVESTMENT_AGENT', label: 'Investment Agent' },
  { code: 'CUSTOMER', label: 'Customer' },
];

const PERMISSION_TYPES = [
  'Read',
  'Create',
  'Update',
  'Delete',
  'Download',
  'Upload',
  'Approve',
  'Reject',
  'Assign',
  'Unassign',
  'Export',
];

const AVAILABLE_ICONS: Record<string, any> = {
  LayoutDashboard,
  Users,
  UserCheck,
  User,
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
  Activity,
  PlusCircle,
  CheckSquare,
  AlertCircle,
  Menu: MenuIcon,
  Sliders,
  Layers,
};

export const PermissionsSub: React.FC<{ subPage?: string }> = ({ subPage = 'roles' }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'menu-items' | 'method-permissions' | 'roles'>(
    subPage === 'method-permissions' || subPage === 'methods'
      ? 'method-permissions'
      : subPage === 'menu-items' || subPage === 'menus'
      ? 'menu-items'
      : 'roles'
  );

  useEffect(() => {
    if (subPage === 'method-permissions' || subPage === 'methods') {
      setActiveTab('method-permissions');
    } else if (subPage === 'menu-items' || subPage === 'menus') {
      setActiveTab('menu-items');
    } else {
      setActiveTab('roles');
    }
  }, [subPage]);

  // Sync search term from URL parameter if passed from Audit Logs inspector
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchVal = params.get('search');
    if (searchVal) {
      setSearchTerm(searchVal);
    }
  }, [location.search]);

  // Data States
  const [menus, setMenus] = useState<any[]>([]);
  const [methodPerms, setMethodPerms] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast / Alert Feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [parentMenuFilter, setParentMenuFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    parentId: '',
    url: '',
    icon: 'FileText',
    displayOrder: 1,
    isActive: true,
    description: '',
    rolePermissions: {
      SUPER_ADMIN: true,
      LOAN_AGENT: false,
      INSURANCE_AGENT: false,
      INVESTMENT_AGENT: false,
      CUSTOMER: false,
    } as Record<string, boolean>,
  });
  const [menuFormErrors, setMenuFormErrors] = useState<Record<string, string>>({});

  // Manage Access Modal State
  const [manageAccessMenu, setManageAccessMenu] = useState<any | null>(null);
  const [accessModalPermissions, setAccessModalPermissions] = useState<Record<string, boolean>>({});
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  // Delete Confirm Modal State
  const [deleteConfirmMenu, setDeleteConfirmMenu] = useState<any | null>(null);

  // Method Modal State
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [methodForm, setMethodForm] = useState({
    methodName: '',
    endpoint: '',
    httpMethod: 'GET',
    permissionType: 'Read',
    isActive: true,
    description: '',
    rolePermissions: {
      SUPER_ADMIN: true,
      LOAN_AGENT: false,
      INSURANCE_AGENT: false,
      INVESTMENT_AGENT: false,
      CUSTOMER: false,
    } as Record<string, boolean>,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, mtRes, rRes] = await Promise.all([
        api.get('/menus'),
        api.get('/permissions/methods'),
        api.get('/permissions/roles'),
      ]);
      setMenus(mRes.data.data || []);
      setMethodPerms(mtRes.data.data || []);
      setRoles(rRes.data.data || []);
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- MENU HANDLERS ---
  const handleOpenCreateMenu = () => {
    setEditingMenu(null);
    setMenuFormErrors({});
    setMenuForm({
      name: '',
      parentId: '',
      url: '',
      icon: 'FileText',
      displayOrder: menus.length + 1,
      isActive: true,
      description: '',
      rolePermissions: {
        SUPER_ADMIN: true,
        LOAN_AGENT: false,
        INSURANCE_AGENT: false,
        INVESTMENT_AGENT: false,
        CUSTOMER: false,
      },
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenu = (menuItem: any) => {
    setEditingMenu(menuItem);
    setMenuFormErrors({});

    const rolePermMap: Record<string, boolean> = {
      SUPER_ADMIN: true,
      LOAN_AGENT: false,
      INSURANCE_AGENT: false,
      INVESTMENT_AGENT: false,
      CUSTOMER: false,
    };
    if (menuItem.rolePermissions) {
      menuItem.rolePermissions.forEach((rp: any) => {
        rolePermMap[rp.role] = rp.canView;
      });
    }

    setMenuForm({
      name: menuItem.name || '',
      parentId: menuItem.parentId || '',
      url: menuItem.url || '',
      icon: menuItem.icon || 'FileText',
      displayOrder: menuItem.displayOrder || 1,
      isActive: menuItem.isActive !== undefined ? menuItem.isActive : true,
      description: menuItem.description || '',
      rolePermissions: rolePermMap,
    });
    setIsMenuModalOpen(true);
  };

  const validateMenuForm = () => {
    const errors: Record<string, string> = {};
    if (!menuForm.name || !menuForm.name.trim()) {
      errors.name = 'Menu Name is required.';
    }
    if (!menuForm.url || !menuForm.url.trim()) {
      errors.url = 'Menu URL is required.';
    } else if (!menuForm.url.startsWith('/')) {
      errors.url = 'Menu URL must start with a slash (/).';
    }
    if (editingMenu && menuForm.parentId === editingMenu.id) {
      errors.parentId = 'Parent Menu cannot be the same menu.';
    }
    setMenuFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMenuForm()) return;

    try {
      if (editingMenu) {
        await api.put(`/menus/${editingMenu.id}`, menuForm);
        setToastMessage({ type: 'success', text: `Menu '${menuForm.name}' updated successfully.` });
      } else {
        await api.post('/menus', menuForm);
        setToastMessage({ type: 'success', text: `New menu '${menuForm.name}' created successfully.` });
      }
      setIsMenuModalOpen(false);
      fetchData();
      window.dispatchEvent(new Event('menuPermissionsUpdated'));
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save menu item.' });
    }
  };

  const handleToggleMenuStatus = async (menuId: string, menuName: string, currentStatus: boolean) => {
    try {
      await api.patch(`/menus/${menuId}/status`, { isActive: !currentStatus });
      setToastMessage({
        type: 'success',
        text: `Menu '${menuName}' status changed to ${!currentStatus ? 'Active' : 'Inactive'}.`,
      });
      fetchData();
      window.dispatchEvent(new Event('menuPermissionsUpdated'));
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to toggle menu status.' });
    }
  };

  const handleConfirmDeleteMenu = async () => {
    if (!deleteConfirmMenu) return;
    try {
      await api.delete(`/menus/${deleteConfirmMenu.id}`);
      setToastMessage({ type: 'success', text: `Menu item '${deleteConfirmMenu.name}' deleted successfully.` });
      setDeleteConfirmMenu(null);
      fetchData();
      window.dispatchEvent(new Event('menuPermissionsUpdated'));
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete menu item.' });
    }
  };

  // --- MANAGE ACCESS MODAL HANDLERS ---
  const handleOpenManageAccess = (menuItem: any) => {
    setManageAccessMenu(menuItem);
    const roleMap: Record<string, boolean> = {
      SUPER_ADMIN: true,
      LOAN_AGENT: false,
      INSURANCE_AGENT: false,
      INVESTMENT_AGENT: false,
      CUSTOMER: false,
    };
    if (menuItem.rolePermissions) {
      menuItem.rolePermissions.forEach((rp: any) => {
        roleMap[rp.role] = rp.canView;
      });
    }
    setAccessModalPermissions(roleMap);
  };

  const handleSaveManageAccess = async () => {
    if (!manageAccessMenu) return;
    setIsSavingAccess(true);
    try {
      for (const r of ALL_ROLES) {
        await api.post('/menus/permissions', {
          menuId: manageAccessMenu.id,
          role: r.code,
          canView: Boolean(accessModalPermissions[r.code]),
        });
      }
      setToastMessage({
        type: 'success',
        text: `Role permissions for '${manageAccessMenu.name}' updated successfully.`,
      });
      setManageAccessMenu(null);
      fetchData();
      window.dispatchEvent(new Event('menuPermissionsUpdated'));
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update role permissions.' });
    } finally {
      setIsSavingAccess(false);
    }
  };

  // --- METHOD PERMISSION HANDLERS ---
  const handleOpenCreateMethod = () => {
    setEditingMethod(null);
    setMethodForm({
      methodName: '',
      endpoint: '/api/',
      httpMethod: 'GET',
      permissionType: 'Read',
      isActive: true,
      description: '',
      rolePermissions: {
        SUPER_ADMIN: true,
        LOAN_AGENT: false,
        INSURANCE_AGENT: false,
        INVESTMENT_AGENT: false,
        CUSTOMER: false,
      },
    });
    setIsMethodModalOpen(true);
  };

  const handleOpenEditMethod = (mp: any) => {
    setEditingMethod(mp);
    const rolePermMap: Record<string, boolean> = {
      SUPER_ADMIN: true,
      LOAN_AGENT: false,
      INSURANCE_AGENT: false,
      INVESTMENT_AGENT: false,
      CUSTOMER: false,
    };
    if (mp.rolePermissions) {
      mp.rolePermissions.forEach((rp: any) => {
        rolePermMap[rp.role] = rp.isAllowed;
      });
    }

    setMethodForm({
      methodName: mp.methodName || '',
      endpoint: mp.endpoint || '',
      httpMethod: mp.httpMethod || 'GET',
      permissionType: mp.permissionType || 'Read',
      isActive: mp.isActive !== undefined ? mp.isActive : true,
      description: mp.description || '',
      rolePermissions: rolePermMap,
    });
    setIsMethodModalOpen(true);
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodForm.methodName.trim()) {
      alert('Method Name is required.');
      return;
    }

    try {
      if (editingMethod) {
        await api.put(`/permissions/methods/${editingMethod.id}`, methodForm);
      } else {
        await api.post('/permissions/methods', methodForm);
      }
      setIsMethodModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save method permission.');
    }
  };

  const handleToggleMethodStatus = async (mpId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/permissions/methods/${mpId}/status`, { isActive: !currentStatus });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle method permission status.');
    }
  };

  const handleDeleteMethod = async (mpId: string, methodName: string) => {
    if (!window.confirm(`Are you sure you want to delete method permission '${methodName}'?`)) {
      return;
    }
    try {
      await api.delete(`/permissions/methods/${mpId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete method permission.');
    }
  };

  // --- TOP-LEVEL PARENT MENUS FOR FILTER ---
  const topLevelParents = menus.filter((m) => !m.parentId);

  // --- METRICS CALCULATION ---
  const totalMenus = menus.length;
  const activeMenus = menus.filter((m) => m.isActive).length;
  const inactiveMenus = menus.filter((m) => !m.isActive).length;
  const topLevelMenus = topLevelParents.length;

  // --- FILTERED MENUS ---
  const filteredMenus = menus.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? m.isActive
        : !m.isActive;

    let matchesParent = true;
    if (parentMenuFilter !== 'ALL') {
      matchesParent = m.parentId === parentMenuFilter || m.id === parentMenuFilter;
    }

    let matchesRole = true;
    if (roleFilter !== 'ALL') {
      const rp = m.rolePermissions?.find((r: any) => r.role === roleFilter);
      matchesRole = rp ? rp.canView : roleFilter === 'SUPER_ADMIN';
    }

    return matchesSearch && matchesStatus && matchesParent && matchesRole;
  });

  // --- FILTERED METHOD PERMISSIONS ---
  const filteredMethodPerms = methodPerms.filter((mp) => {
    const matchesSearch =
      mp.methodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mp.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mp.permissionType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? mp.isActive
        : !mp.isActive;

    let matchesRole = true;
    if (roleFilter !== 'ALL') {
      const rp = mp.rolePermissions?.find((r: any) => r.role === roleFilter);
      matchesRole = rp ? rp.isAllowed : roleFilter === 'SUPER_ADMIN';
    }

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Helper for rendering Lucide icons dynamically
  const renderIcon = (iconName: string) => {
    const IconComponent = AVAILABLE_ICONS[iconName] || FileText;
    return <IconComponent className="w-4 h-4 text-blue-600 flex-shrink-0" />;
  };

  const getRoleCanView = (menuItem: any, roleCode: string) => {
    const rp = menuItem.rolePermissions?.find((r: any) => r.role === roleCode);
    return rp ? rp.canView : roleCode === 'SUPER_ADMIN';
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4 text-current" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Menu & Permissions</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Super Admin can manage dynamic portal navigation menus, page hierarchy, and role-based access permissions.
            </p>
          </div>
        </div>

        {/* Action Button */}
        {activeTab === 'menu-items' ? (
          <button
            onClick={handleOpenCreateMenu}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md flex items-center gap-2 cursor-pointer text-xs self-start md:self-center transition-all shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" /> Add New Menu
          </button>
        ) : activeTab === 'method-permissions' ? (
          <button
            onClick={handleOpenCreateMethod}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md flex items-center gap-2 cursor-pointer text-xs self-start md:self-center transition-all shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4" /> Add Method Rule
          </button>
        ) : null}
      </div>

      {/* Summary Cards */}
      {activeTab === 'menu-items' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Menu Items</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalMenus}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <MenuIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Menus</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{activeMenus}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inactive Menus</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">{inactiveMenus}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Power className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Top-Level Menus</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">{topLevelMenus}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Submenu Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-1 rounded-xl border gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('menu-items')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'menu-items'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MenuIcon className="w-4 h-4" /> Menu Items & Permissions
        </button>

        <button
          onClick={() => setActiveTab('method-permissions')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'method-permissions'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4" /> API Method Permissions
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'roles'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" /> System Roles Matrix
        </button>
      </div>

      {/* SEARCH & FILTERS TOOLBAR */}
      {activeTab !== 'roles' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search menu items by name, description..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {activeTab === 'menu-items' && (
              <SearchableSelect
                options={[
                  { value: 'ALL', label: 'All Parent Menus' },
                  ...topLevelParents.map((pm) => ({ value: pm.id, label: pm.name })),
                ]}
                value={parentMenuFilter}
                onChange={setParentMenuFilter}
                placeholder="All Parent Menus"
                searchPlaceholder="Search parent menu..."
                className="w-44"
              />
            )}

            <SearchableSelect
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active Only' },
                { value: 'INACTIVE', label: 'Inactive Only' },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              placeholder="All Statuses"
              searchPlaceholder="Search status..."
              className="w-36"
            />

            <SearchableSelect
              options={[
                { value: 'ALL', label: 'All Roles' },
                ...ALL_ROLES.map((r) => ({ value: r.code, label: r.label })),
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="All Roles"
              searchPlaceholder="Search role..."
              className="w-36"
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. MENU ITEMS & ROLE PERMISSIONS TAB */}
      {/* ========================================================= */}
      {activeTab === 'menu-items' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <MenuIcon className="w-4 h-4 text-blue-600" /> Portal Menu Hierarchy & Role Permissions
            </h3>
            <span className="text-slate-500 font-medium text-xs">
              Showing {filteredMenus.length} of {menus.length} menus
            </span>
          </div>

          {/* Sticky Header Table Container */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative scrollbar-thin">
            <table className="w-full text-left font-medium border-collapse">
              {/* STICKY HEADER - Always visible on scroll */}
              <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-md shadow-sm border-b border-slate-200">
                <tr className="text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 bg-slate-100/95">Menu Item</th>
                  <th className="py-3.5 px-3 bg-slate-100/95">Parent Menu</th>
                  <th className="py-3.5 px-3 bg-slate-100/95">Access (Roles)</th>
                  <th className="py-3.5 px-2 text-center bg-slate-100/95">Status</th>
                  <th className="py-3.5 px-4 text-right bg-slate-100/95">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-semibold">
                      Loading menu permissions table...
                    </td>
                  </tr>
                ) : filteredMenus.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-semibold">
                      No menu items found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMenus.map((m) => {
                    const isChild = Boolean(m.parentId);

                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !m.isActive ? 'bg-slate-50/50 text-slate-400' : ''
                        }`}
                      >
                        {/* Menu Item & Icon */}
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-xl border flex-shrink-0 ${
                                isChild ? 'ml-4 bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              {renderIcon(m.icon)}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center gap-2">
                                {isChild && <span className="text-slate-400 font-mono">├──</span>}
                                <span>{m.name}</span>
                                {isChild ? (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                                    Child Menu
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-200">
                                    Top-Level Menu
                                  </span>
                                )}
                              </div>
                              {m.description && (
                                <div className="text-[11px] text-slate-400 font-normal mt-0.5 max-w-sm line-clamp-1">
                                  {m.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Parent Menu */}
                        <td className="py-3.5 px-3 text-slate-600 font-medium">
                          {m.parent ? (
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px]">
                              <FolderOpen className="w-3 h-3 text-slate-500" />
                              {m.parent.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]"> None (Top-Level)</span>
                          )}
                        </td>

                        {/* Access Column (Compact Role Permission Badges) */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                            {ALL_ROLES.map((r) => {
                              const canView = getRoleCanView(m, r.code);
                              return canView ? (
                                <span
                                  key={r.code}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-2xs ${
                                    r.code === 'SUPER_ADMIN'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : r.code === 'LOAN_AGENT'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : r.code === 'INSURANCE_AGENT'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : r.code === 'INVESTMENT_AGENT'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  }`}
                                  title={`${r.label}: Access Granted`}
                                >
                                  <Check className="w-3 h-3 text-current" />
                                  {r.label}
                                </span>
                              ) : (
                                <span
                                  key={r.code}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200/60 opacity-60"
                                  title={`${r.label}: No Access`}
                                >
                                  <Slash className="w-2.5 h-2.5 text-slate-400" />
                                  {r.label}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Status Toggle Button */}
                        <td className="py-3.5 px-2 text-center">
                          <button
                            onClick={() => handleToggleMenuStatus(m.id, m.name, m.isActive)}
                            className={`px-3 py-1 rounded-full font-extrabold text-[10px] uppercase cursor-pointer border transition-all ${
                              m.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                            }`}
                          >
                            {m.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenManageAccess(m)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] transition-colors flex items-center gap-1 border border-blue-200"
                              title="Manage Role Permissions"
                            >
                              <Key className="w-3.5 h-3.5" />
                              Access
                            </button>
                            <button
                              onClick={() => handleOpenEditMenu(m)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Edit Menu Item"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmMenu(m)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Delete Menu Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. METHOD PERMISSIONS TAB */}
      {/* ========================================================= */}
      {activeTab === 'method-permissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" /> REST API Method-Level Security Rules & Roles Matrix
            </h3>
            <span className="text-slate-500 font-medium text-xs">
              Showing {filteredMethodPerms.length} of {methodPerms.length} rules
            </span>
          </div>

          {/* Sticky Header Table Container */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative scrollbar-thin">
            <table className="w-full text-left font-medium border-collapse">
              {/* STICKY HEADER - Always visible on vertical scroll */}
              <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-md shadow-sm border-b border-slate-200">
                <tr className="text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 bg-slate-100/95">Method Name</th>
                  <th className="py-3.5 px-3 bg-slate-100/95">API Endpoint</th>
                  <th className="py-3.5 px-2 text-center bg-slate-100/95">HTTP Verb</th>
                  <th className="py-3.5 px-3 bg-slate-100/95">Permission Type</th>
                  <th className="py-3.5 px-2 text-center bg-slate-100/95">Status</th>
                  <th className="py-3.5 px-2 text-center bg-slate-100/95">Superadmin</th>
                  <th className="py-3.5 px-2 text-center bg-slate-100/95">Loan Agent</th>
                  <th className="py-3.5 px-2 text-center bg-slate-100/95">Insurance Agent</th>
                  <th className="py-3.5 px-2 text-center bg-slate-100/95">Investment Agent</th>
                  <th className="py-3.5 px-2 text-center bg-slate-100/95">Customer</th>
                  <th className="py-3.5 px-4 text-right bg-slate-100/95">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500 font-semibold">
                      Loading API method permissions...
                    </td>
                  </tr>
                ) : filteredMethodPerms.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500 font-semibold">
                      No method permission rules found.
                    </td>
                  </tr>
                ) : (
                  filteredMethodPerms.map((mp) => {
                    const getRoleIsAllowed = (roleCode: string) => {
                      const rp = mp.rolePermissions?.find((r: any) => r.role === roleCode);
                      return rp ? rp.isAllowed : roleCode === 'SUPER_ADMIN';
                    };

                    return (
                      <tr key={mp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{mp.methodName}</div>
                          {mp.description && (
                            <div className="text-[10px] text-slate-400 font-normal">{mp.description}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 font-mono text-purple-700 font-bold text-[11px]">
                          {mp.endpoint}
                        </td>

                        <td className="py-3.5 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-extrabold text-[10px] ${
                              mp.httpMethod === 'GET'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : mp.httpMethod === 'POST'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : mp.httpMethod === 'PUT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {mp.httpMethod}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 font-bold text-slate-800 text-[11px]">
                            {mp.permissionType}
                          </span>
                        </td>

                        <td className="py-3.5 px-2 text-center">
                          <button
                            onClick={() => handleToggleMethodStatus(mp.id, mp.isActive)}
                            className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase cursor-pointer border ${
                              mp.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            {mp.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {ALL_ROLES.map((r) => {
                          const isAllowed = getRoleIsAllowed(r.code);
                          return (
                            <td key={r.code} className="py-3.5 px-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  isAllowed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-50 text-rose-400 line-through'
                                }`}
                              >
                                {isAllowed ? 'Allowed' : 'Not Allowed'}
                              </span>
                            </td>
                          );
                        })}

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditMethod(mp)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors"
                              title="Edit Method Rule"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMethod(mp.id, mp.methodName)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                              title="Delete Method Rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ROLES TAB */}
      {/* ========================================================= */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-sm border-b pb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" /> Active System Roles & Category Bounds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">{r.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-extrabold text-[10px]">
                    {r.code}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{r.description || 'System Role'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: MANAGE ROLE PERMISSIONS MODAL */}
      {/* ========================================================= */}
      {manageAccessMenu && (
        <Modal
          isOpen={Boolean(manageAccessMenu)}
          onClose={() => setManageAccessMenu(null)}
          title={`Role Access Permissions - ${manageAccessMenu.name}`}
        >
          <div className="space-y-5 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-blue-200">
                {renderIcon(manageAccessMenu.icon)}
              </div>
              <div>
                <div className="font-extrabold text-slate-900">{manageAccessMenu.name}</div>
                <div className="text-[11px] font-mono text-blue-700 font-bold">{manageAccessMenu.url}</div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block font-black text-slate-900 uppercase tracking-wider text-[11px]">
                Role Access Matrix
              </label>

              <div className="space-y-2">
                {ALL_ROLES.map((r) => {
                  const isChecked = Boolean(accessModalPermissions[r.code]);
                  const isSuperAdmin = r.code === 'SUPER_ADMIN';

                  return (
                    <div
                      key={r.code}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isChecked ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            isChecked ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className="font-extrabold text-slate-900 text-xs">{r.label}</span>
                        {isSuperAdmin && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[9px] font-black">
                            FULL ADMIN
                          </span>
                        )}
                      </div>

                      <label className="inline-flex items-center cursor-pointer gap-2 font-bold text-slate-700">
                        <input
                          type="checkbox"
                          disabled={isSuperAdmin}
                          checked={isChecked}
                          onChange={(e) =>
                            setAccessModalPermissions({
                              ...accessModalPermissions,
                              [r.code]: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer disabled:opacity-50"
                        />
                        <span>{isChecked ? 'Access Granted' : 'Blocked'}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAccessModalPermissions({
                      SUPER_ADMIN: true,
                      LOAN_AGENT: true,
                      INSURANCE_AGENT: true,
                      INVESTMENT_AGENT: true,
                      CUSTOMER: true,
                    })
                  }
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Grant All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setAccessModalPermissions({
                      SUPER_ADMIN: true,
                      LOAN_AGENT: false,
                      INSURANCE_AGENT: false,
                      INVESTMENT_AGENT: false,
                      CUSTOMER: false,
                    })
                  }
                  className="text-[11px] font-bold text-slate-500 hover:underline"
                >
                  Super Admin Only
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setManageAccessMenu(null)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveManageAccess}
                  disabled={isSavingAccess}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSavingAccess ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {deleteConfirmMenu && (
        <Modal
          isOpen={Boolean(deleteConfirmMenu)}
          onClose={() => setDeleteConfirmMenu(null)}
          title="Confirm Delete Menu Item"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600 p-3 bg-rose-50 rounded-xl border border-rose-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-extrabold">Permanent Deletion Warning</div>
                <div className="text-[11px] font-medium text-rose-700 mt-0.5">
                  Are you sure you want to delete menu item <strong className="text-rose-900">"{deleteConfirmMenu.name}"</strong>?
                </div>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed font-medium">
              This will permanently remove the menu item route (<code className="font-mono text-purple-700">{deleteConfirmMenu.url}</code>) and clear all associated role permissions.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setDeleteConfirmMenu(null)}
                className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMenu}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CREATE / EDIT MENU ITEM */}
      {/* ========================================================= */}
      <Modal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        title={editingMenu ? 'Edit Menu Item' : 'Create New Menu Item'}
      >
        <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Menu Name *</label>
            <input
              type="text"
              required
              value={menuForm.name}
              onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="e.g. Loan Applications"
            />
            {menuFormErrors.name && (
              <p className="text-rose-600 text-[10px] mt-1 font-semibold">{menuFormErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Parent Menu (Optional)</label>
              <SearchableSelect
                options={[
                  { value: '', label: 'None (Top-Level Menu)' },
                  ...menus
                    .filter((m) => !editingMenu || m.id !== editingMenu.id)
                    .map((m) => ({ value: m.id, label: `${m.name} (${m.url})` })),
                ]}
                value={menuForm.parentId}
                onChange={(val) => setMenuForm({ ...menuForm, parentId: val })}
                placeholder="Select Parent Menu..."
                searchPlaceholder="Search parent menu..."
                className="w-full"
              />
              {menuFormErrors.parentId && (
                <p className="text-rose-600 text-[10px] mt-1 font-semibold">{menuFormErrors.parentId}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Menu Icon</label>
              <SearchableSelect
                options={Object.keys(AVAILABLE_ICONS).map((iconKey) => ({ value: iconKey, label: iconKey }))}
                value={menuForm.icon}
                onChange={(val) => setMenuForm({ ...menuForm, icon: val })}
                placeholder="Select icon..."
                searchPlaceholder="Search icon..."
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Menu URL Route *</label>
            <input
              type="text"
              required
              value={menuForm.url}
              onChange={(e) => setMenuForm({ ...menuForm, url: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-blue-700 font-bold text-xs outline-none"
              placeholder="/superadmin/applications/loans"
            />
            {menuFormErrors.url && (
              <p className="text-rose-600 text-[10px] mt-1 font-semibold">{menuFormErrors.url}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Display Order</label>
              <input
                type="number"
                value={menuForm.displayOrder}
                onChange={(e) => setMenuForm({ ...menuForm, displayOrder: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Is Active</label>
              <SearchableSelect
                options={[
                  { value: 'true', label: 'Active (Visible if Permitted)' },
                  { value: 'false', label: 'Inactive (Hidden & Blocked)' },
                ]}
                value={menuForm.isActive ? 'true' : 'false'}
                onChange={(val) => setMenuForm({ ...menuForm, isActive: val === 'true' })}
                placeholder="Select active status..."
                searchPlaceholder="Search status..."
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={menuForm.description}
              onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none"
              placeholder="Brief summary of what this menu page does..."
            />
          </div>

          {/* Role Permissions Matrix Checklist */}
          <div className="space-y-2 pt-2 border-t">
            <label className="block font-extrabold text-slate-900">Role-Wise Menu Permissions</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border">
              {ALL_ROLES.map((r) => (
                <label key={r.code} className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(menuForm.rolePermissions[r.code])}
                    onChange={(e) =>
                      setMenuForm({
                        ...menuForm,
                        rolePermissions: {
                          ...menuForm.rolePermissions,
                          [r.code]: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsMenuModalOpen(false)}
              className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md"
            >
              {editingMenu ? 'Update Menu' : 'Save Menu Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: CREATE / EDIT METHOD PERMISSION */}
      {/* ========================================================= */}
      <Modal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        title={editingMethod ? 'Edit Method Permission Rule' : 'Add API Method Permission Rule'}
      >
        <form onSubmit={handleSaveMethod} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Method Name *</label>
            <input
              type="text"
              required
              value={methodForm.methodName}
              onChange={(e) => setMethodForm({ ...methodForm, methodName: e.target.value })}
              className="w-full p-2.5 border rounded-xl text-xs font-bold outline-none"
              placeholder="e.g. GetLoanApplications"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">API Endpoint</label>
              <input
                type="text"
                value={methodForm.endpoint}
                onChange={(e) => setMethodForm({ ...methodForm, endpoint: e.target.value })}
                className="w-full p-2.5 border rounded-xl font-mono text-purple-700 text-xs outline-none"
                placeholder="/api/applications/loans"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">HTTP Verb Method</label>
              <SearchableSelect
                options={[
                  { value: 'GET', label: 'GET (Read / Query)' },
                  { value: 'POST', label: 'POST (Create / Upload)' },
                  { value: 'PUT', label: 'PUT (Update / Approve)' },
                  { value: 'DELETE', label: 'DELETE (Remove)' },
                ]}
                value={methodForm.httpMethod}
                onChange={(val) => setMethodForm({ ...methodForm, httpMethod: val })}
                placeholder="Select HTTP method..."
                searchPlaceholder="Search method..."
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Permission Type</label>
            <SearchableSelect
              options={PERMISSION_TYPES.map((pt) => ({ value: pt, label: pt }))}
              value={methodForm.permissionType}
              onChange={(val) => setMethodForm({ ...methodForm, permissionType: val })}
              placeholder="Select permission type..."
              searchPlaceholder="Search permission type..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={methodForm.description}
              onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })}
              className="w-full p-2.5 border rounded-xl outline-none"
              placeholder="Rule description..."
            />
          </div>

          {/* Role Method Permissions Matrix Checklist */}
          <div className="space-y-2 pt-2 border-t">
            <label className="block font-extrabold text-slate-900">Allowed User Roles</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border">
              {ALL_ROLES.map((r) => (
                <label key={r.code} className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(methodForm.rolePermissions[r.code])}
                    onChange={(e) =>
                      setMethodForm({
                        ...methodForm,
                        rolePermissions: {
                          ...methodForm.rolePermissions,
                          [r.code]: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsMethodModalOpen(false)}
              className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md"
            >
              {editingMethod ? 'Update Method Rule' : 'Save Method Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PermissionsSub;
