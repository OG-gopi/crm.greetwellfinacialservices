import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { VersionProvider, useVersion } from './context/VersionContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ProtectedRoleRoute } from './components/common/ProtectedRoleRoute';
import { resolveRoleRedirectPath } from './utils/navigation';

// Fast Initial Auth Pages
import { Login } from './pages/auth/Login';
import { CustomerRegister } from './pages/auth/CustomerRegister';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { AcceptInvite } from './pages/auth/AcceptInvite';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { EmailLogin } from './pages/auth/EmailLogin';
import { SetPassword } from './pages/auth/SetPassword';

// Lazy Loaded Dashboards & Subpages for Ultra-Fast Initial Load
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const AgentManagement = lazy(() => import('./pages/admin/AgentManagement').then(m => ({ default: m.AgentManagement })));
const VerificationCenter = lazy(() => import('./pages/admin/VerificationCenter').then(m => ({ default: m.VerificationCenter })));
const ProductCMS = lazy(() => import('./pages/admin/ProductCMS').then(m => ({ default: m.ProductCMS })));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs').then(m => ({ default: m.AuditLogs })));
const EmailLogs = lazy(() => import('./pages/admin/EmailLogs').then(m => ({ default: m.EmailLogs })));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings').then(m => ({ default: m.SystemSettings })));

const UsersManagementSub = lazy(() => import('./pages/admin/UsersManagementSub').then(m => ({ default: m.UsersManagementSub })));
const AgentsSub = lazy(() => import('./pages/admin/AgentsSub').then(m => ({ default: m.AgentsSub })));
const CustomersSub = lazy(() => import('./pages/admin/CustomersSub').then(m => ({ default: m.CustomersSub })));
const ApplicationsSub = lazy(() => import('./pages/admin/ApplicationsSub').then(m => ({ default: m.ApplicationsSub })));
const DocumentsSub = lazy(() => import('./pages/admin/DocumentsSub').then(m => ({ default: m.DocumentsSub })));
const ProductsSub = lazy(() => import('./pages/admin/ProductsSub').then(m => ({ default: m.ProductsSub })));
const PermissionsSub = lazy(() => import('./pages/admin/PermissionsSub').then(m => ({ default: m.PermissionsSub })));
const SystemSub = lazy(() => import('./pages/admin/SystemSub').then(m => ({ default: m.SystemSub })));
const UpdatesSub = lazy(() => import('./pages/admin/UpdatesSub').then(m => ({ default: m.UpdatesSub })));
const ReportsSub = lazy(() => import('./pages/admin/ReportsSub').then(m => ({ default: m.ReportsSub })));
const EnquiriesSub = lazy(() => import('./pages/admin/EnquiriesSub').then(m => ({ default: m.EnquiriesSub })));
const WebsiteManagementSub = lazy(() => import('./pages/admin/WebsiteManagementSub').then(m => ({ default: m.WebsiteManagementSub })));

// Agent Pages
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard').then(m => ({ default: m.AgentDashboard })));
const AgentApplications = lazy(() => import('./pages/agent/AgentApplications').then(m => ({ default: m.AgentApplications })));
const AgentTasks = lazy(() => import('./pages/agent/AgentTasks').then(m => ({ default: m.AgentTasks })));
const AgentCustomers = lazy(() => import('./pages/agent/AgentCustomers').then(m => ({ default: m.AgentCustomers })));

// Customer Pages
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard').then(m => ({ default: m.CustomerDashboard })));
const CreateApplication = lazy(() => import('./pages/customer/CreateApplication').then(m => ({ default: m.CreateApplication })));
const CustomerDocuments = lazy(() => import('./pages/customer/CustomerDocuments').then(m => ({ default: m.CustomerDocuments })));
const CustomerProfile = lazy(() => import('./pages/customer/CustomerProfile').then(m => ({ default: m.CustomerProfile })));

// Notification History Page
const NotificationHistory = lazy(() => import('./pages/common/NotificationHistory').then(m => ({ default: m.NotificationHistory })));

import { MenuRouteGuard } from './components/common/MenuRouteGuard';

// Error Pages
import { Unauthorized } from './pages/error/Unauthorized';
import { NotFound } from './pages/error/NotFound';

import { PageSkeleton } from './components/common/Skeletons';

const MainLayout: React.FC = () => {
  const { versionDisplay } = useVersion();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 relative">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 max-w-full">
          <div className="max-w-[1920px] mx-auto w-full">
            <MenuRouteGuard>
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </MenuRouteGuard>
          </div>
        </main>
      </div>
    </div>
  );
};



const AgentRouteResolver: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const currentPathWithSearch = `${location.pathname}${location.search}`;

  if (!isAuthenticated || !user) {
    return <Navigate to={`/email-login?redirect=${encodeURIComponent(currentPathWithSearch)}`} replace />;
  }

  const targetPath = resolveRoleRedirectPath(user.role, currentPathWithSearch);
  return <Navigate to={targetPath} replace />;
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'SUPER_ADMIN':
      return <Navigate to="/superadmin/dashboard" replace />;
    case 'LOAN_AGENT':
      return <Navigate to="/loan-agent/dashboard" replace />;
    case 'INSURANCE_AGENT':
      return <Navigate to="/insurance-agent/dashboard" replace />;
    case 'INVESTMENT_AGENT':
      return <Navigate to="/investment-agent/dashboard" replace />;
    case 'CUSTOMER':
      return <Navigate to="/customer/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <VersionProvider>
            <Routes>

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/email-login" element={<EmailLogin />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/superadmin/login" element={<Login />} />
          <Route path="/register" element={<CustomerRegister />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Role-Specific Public Auth Routes All Unified to Common Login */}
          <Route path="/agent/login" element={<Login />} />
          <Route path="/loan-agent/login" element={<Login />} />
          <Route path="/insurance-agent/login" element={<Login />} />
          <Route path="/investment-agent/login" element={<Login />} />
          <Route path="/customer/login" element={<Login />} />
          <Route path="/customer/register" element={<CustomerRegister />} />

          {/* Generic Agent Route Resolver */}
          <Route path="/agent/*" element={<AgentRouteResolver />} />
          <Route path="/agent" element={<AgentRouteResolver />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Main Layout Routes */}
          <Route element={<MainLayout />}>
            {/* SUPER ADMIN ROUTES */}
            <Route element={<ProtectedRoleRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/superadmin/dashboard" element={<AdminDashboard />} />

              {/* 2. Users Management */}
              <Route path="/superadmin/users-parent" element={<UsersManagementSub subPage="all" />} />
              <Route path="/superadmin/users" element={<UsersManagementSub subPage="all" />} />
              <Route path="/superadmin/users/create" element={<UsersManagementSub subPage="create" />} />
              <Route path="/superadmin/users/verification" element={<UsersManagementSub subPage="verification" />} />
              <Route path="/superadmin/users/status" element={<UsersManagementSub subPage="all" />} />

              {/* 3. Agents */}
              <Route path="/superadmin/agents" element={<AgentsSub subPage="manage" />} />
              <Route path="/superadmin/agents/manage" element={<AgentsSub subPage="manage" />} />
              <Route path="/superadmin/agents/invite" element={<UsersManagementSub subPage="create" />} />
              <Route path="/superadmin/agents/verification" element={<AgentsSub subPage="verification" />} />

              {/* 4. Customers */}
              <Route path="/superadmin/customers" element={<CustomersSub subPage="all" />} />
              <Route path="/superadmin/customers/create" element={<UsersManagementSub subPage="create" />} />
              <Route path="/superadmin/customers/verification" element={<CustomersSub subPage="verification" />} />

              {/* 5. Applications */}
              <Route path="/superadmin/applications-parent" element={<ApplicationsSub subPage="all" />} />
              <Route path="/superadmin/applications" element={<ApplicationsSub subPage="all" />} />
              <Route path="/superadmin/applications/all" element={<ApplicationsSub subPage="all" />} />
              <Route path="/superadmin/applications/loans" element={<ApplicationsSub subPage="loans" />} />
              <Route path="/superadmin/applications/insurance" element={<ApplicationsSub subPage="insurance" />} />
              <Route path="/superadmin/applications/investments" element={<ApplicationsSub subPage="investments" />} />
              <Route path="/superadmin/applications/assignments" element={<ApplicationsSub subPage="all" />} />
              <Route path="/superadmin/applications/status" element={<ApplicationsSub subPage="all" />} />
              <Route path="/superadmin/applications/:id" element={<ApplicationsSub subPage="all" />} />
              <Route path="/superadmin/applications/view/:id" element={<ApplicationsSub subPage="all" />} />
              <Route path="/superadmin/create-application" element={<CreateApplication />} />
              <Route path="/superadmin/applications/create" element={<CreateApplication />} />

              {/* 6. Documents */}
              <Route path="/superadmin/documents" element={<DocumentsSub subPage="all" />} />
              <Route path="/superadmin/documents/verification" element={<DocumentsSub subPage="verification" />} />
              <Route path="/superadmin/documents/download" element={<DocumentsSub subPage="all" />} />
              <Route path="/superadmin/documents/categories" element={<DocumentsSub subPage="all" />} />

              {/* 7. Products & Services */}
              <Route path="/superadmin/products-parent" element={<ProductsSub subPage="catalog" />} />
              <Route path="/superadmin/products" element={<ProductsSub subPage="catalog" />} />
              <Route path="/superadmin/products/catalog" element={<ProductsSub subPage="catalog" />} />
              <Route path="/superadmin/products/loans" element={<ProductsSub subPage="catalog" />} />
              <Route path="/superadmin/products/insurance" element={<ProductsSub subPage="catalog" />} />
              <Route path="/superadmin/products/investments" element={<ProductsSub subPage="catalog" />} />
              <Route path="/superadmin/products/categories" element={<ProductsSub subPage="catalog" />} />

              {/* 8. Roles & Permissions */}
              <Route path="/superadmin/permissions-parent" element={<PermissionsSub subPage="menu-items" />} />
              <Route path="/superadmin/permissions" element={<PermissionsSub subPage="menu-items" />} />
              <Route path="/superadmin/permissions/menu-items" element={<PermissionsSub subPage="menu-items" />} />
              <Route path="/superadmin/permissions/method-permissions" element={<PermissionsSub subPage="method-permissions" />} />
              <Route path="/superadmin/permissions/roles" element={<PermissionsSub subPage="roles" />} />
              <Route path="/superadmin/permissions/menus" element={<PermissionsSub subPage="menu-items" />} />
              <Route path="/superadmin/permissions/methods" element={<PermissionsSub subPage="method-permissions" />} />
              <Route path="/superadmin/permissions/groups" element={<PermissionsSub subPage="roles" />} />

              {/* 9. System Management */}
              <Route path="/superadmin/system-parent" element={<SystemSub subPage="configurations" />} />
              <Route path="/superadmin/system/configurations" element={<SystemSub subPage="configurations" />} />
              <Route path="/superadmin/system/email-templates" element={<SystemSub subPage="email-templates" />} />
              <Route path="/superadmin/system/fields" element={<SystemSub subPage="configurations" />} />
              <Route path="/superadmin/system/integrations" element={<SystemSub subPage="configurations" />} />
              <Route path="/superadmin/system/backup" element={<SystemSub subPage="backup" />} />

              {/* 10. Updates & Versions */}
              <Route path="/superadmin/updates" element={<UpdatesSub />} />
              <Route path="/superadmin/updates/release-notes" element={<UpdatesSub />} />
              <Route path="/superadmin/updates/manage" element={<UpdatesSub />} />

              {/* 11. Notifications */}
              <Route path="/superadmin/notifications" element={<NotificationHistory />} />
              <Route path="/superadmin/notifications/settings" element={<SystemSettings />} />

              {/* 12. Enquiries / Complaints */}
              <Route path="/superadmin/enquiries" element={<EnquiriesSub subPage="all" />} />
              <Route path="/superadmin/enquiries/categories" element={<EnquiriesSub subPage="categories" />} />
              <Route path="/superadmin/enquiries/status" element={<EnquiriesSub subPage="all" />} />

              {/* 13. Reports */}
              <Route path="/superadmin/reports" element={<ReportsSub subPage="applications" />} />
              <Route path="/superadmin/reports/applications" element={<ReportsSub subPage="applications" />} />
              <Route path="/superadmin/reports/users" element={<ReportsSub subPage="users" />} />
              <Route path="/superadmin/reports/agents" element={<ReportsSub subPage="agents" />} />
              <Route path="/superadmin/reports/downloads" element={<ReportsSub subPage="applications" />} />

              {/* 14. Audit Logs */}
              <Route path="/superadmin/audit-logs" element={<AuditLogs />} />
              <Route path="/superadmin/audit-logs/search" element={<AuditLogs />} />
              <Route path="/superadmin/email-logs" element={<EmailLogs />} />
              <Route path="/superadmin/system/email-logs" element={<SystemSub subPage="email-logs" />} />

              {/* 15. Settings */}
              <Route path="/superadmin/settings" element={<SystemSettings />} />
              <Route path="/superadmin/settings/profile" element={<CustomerProfile />} />
              <Route path="/superadmin/settings/account" element={<CustomerProfile />} />
              <Route path="/superadmin/settings/password" element={<CustomerProfile />} />
              <Route path="/superadmin/settings/portal" element={<SystemSettings />} />

              {/* 16. Website & Portal Management */}
              <Route path="/superadmin/website-management" element={<WebsiteManagementSub subPage="content" />} />
              <Route path="/superadmin/website-management/content" element={<WebsiteManagementSub subPage="content" />} />
              <Route path="/superadmin/website-management/contact" element={<WebsiteManagementSub subPage="contact" />} />
              <Route path="/superadmin/website-management/social" element={<WebsiteManagementSub subPage="social" />} />
              <Route path="/superadmin/website-management/media" element={<WebsiteManagementSub subPage="media" />} />
              <Route path="/superadmin/website-management/preview" element={<WebsiteManagementSub subPage="preview" />} />
              <Route path="/superadmin/website-management/history" element={<WebsiteManagementSub subPage="history" />} />

              {/* Legacy /admin aliases redirect to /superadmin/* */}
              <Route path="/admin/dashboard" element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="/admin/users" element={<Navigate to="/superadmin/users" replace />} />
              <Route path="/admin/agents" element={<Navigate to="/superadmin/agents" replace />} />
              <Route path="/admin/applications" element={<Navigate to="/superadmin/applications/all" replace />} />
              <Route path="/admin/verification" element={<Navigate to="/superadmin/users/verification" replace />} />
              <Route path="/admin/products" element={<Navigate to="/superadmin/products/catalog" replace />} />
              <Route path="/admin/audit-logs" element={<Navigate to="/superadmin/audit-logs" replace />} />
              <Route path="/admin/settings" element={<Navigate to="/superadmin/settings" replace />} />
            </Route>

            {/* LOAN AGENT ROUTES */}
            <Route element={<ProtectedRoleRoute allowedRoles={['LOAN_AGENT']} />}>
              <Route path="/loan-agent/dashboard" element={<AgentDashboard />} />
              <Route path="/loan-agent/customers" element={<AgentCustomers />} />
              <Route path="/loan-agent/applications" element={<AgentApplications forcedType="LOAN" />} />
              <Route path="/loan-agent/applications/:id" element={<AgentApplications forcedType="LOAN" />} />
              <Route path="/loan-agent/create-application" element={<CreateApplication />} />
              <Route path="/loan-agent/applications/create" element={<CreateApplication />} />
              <Route path="/loan-agent/documents" element={<CustomerDocuments />} />
              <Route path="/loan-agent/tasks" element={<AgentTasks />} />
              <Route path="/loan-agent/reports" element={<ReportsSub subPage="applications" />} />
              <Route path="/loan-agent/enquiries" element={<EnquiriesSub subPage="all" />} />
              <Route path="/loan-agent/notifications" element={<NotificationHistory />} />
            </Route>

            {/* INSURANCE AGENT ROUTES */}
            <Route element={<ProtectedRoleRoute allowedRoles={['INSURANCE_AGENT']} />}>
              <Route path="/insurance-agent/dashboard" element={<AgentDashboard />} />
              <Route path="/insurance-agent/customers" element={<AgentCustomers />} />
              <Route path="/insurance-agent/applications" element={<AgentApplications forcedType="INSURANCE" />} />
              <Route path="/insurance-agent/applications/:id" element={<AgentApplications forcedType="INSURANCE" />} />
              <Route path="/insurance-agent/create-application" element={<CreateApplication />} />
              <Route path="/insurance-agent/applications/create" element={<CreateApplication />} />
              <Route path="/insurance-agent/documents" element={<CustomerDocuments />} />
              <Route path="/insurance-agent/tasks" element={<AgentTasks />} />
              <Route path="/insurance-agent/reports" element={<ReportsSub subPage="applications" />} />
              <Route path="/insurance-agent/enquiries" element={<EnquiriesSub subPage="all" />} />
              <Route path="/insurance-agent/notifications" element={<NotificationHistory />} />
            </Route>

            {/* INVESTMENT AGENT ROUTES */}
            <Route element={<ProtectedRoleRoute allowedRoles={['INVESTMENT_AGENT']} />}>
              <Route path="/investment-agent/dashboard" element={<AgentDashboard />} />
              <Route path="/investment-agent/customers" element={<AgentCustomers />} />
              <Route path="/investment-agent/applications" element={<AgentApplications forcedType="INVESTMENT" />} />
              <Route path="/investment-agent/applications/:id" element={<AgentApplications forcedType="INVESTMENT" />} />
              <Route path="/investment-agent/create-application" element={<CreateApplication />} />
              <Route path="/investment-agent/applications/create" element={<CreateApplication />} />
              <Route path="/investment-agent/products" element={<ProductCMS />} />
              <Route path="/investment-agent/documents" element={<CustomerDocuments />} />
              <Route path="/investment-agent/tasks" element={<AgentTasks />} />
              <Route path="/investment-agent/reports" element={<ReportsSub subPage="applications" />} />
              <Route path="/investment-agent/enquiries" element={<EnquiriesSub subPage="all" />} />
              <Route path="/investment-agent/notifications" element={<NotificationHistory />} />
            </Route>

            {/* CUSTOMER ROUTES */}
            <Route element={<ProtectedRoleRoute allowedRoles={['CUSTOMER']} />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/applications" element={<AgentApplications />} />
              <Route path="/customer/applications/:id" element={<AgentApplications />} />
              <Route path="/customer/create-application" element={<CreateApplication />} />
              <Route path="/customer/applications/create" element={<CreateApplication />} />
              <Route path="/customer/documents" element={<CustomerDocuments />} />
              <Route path="/customer/enquiries" element={<EnquiriesSub subPage="all" />} />
              <Route path="/customer/notifications" element={<NotificationHistory />} />
              <Route path="/customer/updates" element={<UpdatesSub />} />
            </Route>

            {/* SHARED PROTECTED ROUTES */}
            <Route element={<ProtectedRoleRoute allowedRoles={['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT', 'CUSTOMER']} />}>
              <Route path="/create-application" element={<CreateApplication />} />
              <Route path="/profile" element={<CustomerProfile />} />
              <Route path="/profile/settings" element={<CustomerProfile />} />
              <Route path="/profile/account" element={<CustomerProfile />} />
              <Route path="/profile/password" element={<CustomerProfile />} />
            </Route>
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </VersionProvider>
    </NotificationProvider>
  </ToastProvider>
</AuthProvider>

);
};

export default App;
