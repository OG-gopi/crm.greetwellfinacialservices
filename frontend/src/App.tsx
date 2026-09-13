import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ProtectedRoleRoute } from './components/common/ProtectedRoleRoute';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AcceptInvite } from './pages/auth/AcceptInvite';
import { ForgotPassword } from './pages/auth/ForgotPassword';

import { LoanAgentLogin } from './pages/auth/LoanAgentLogin';
import { InsuranceAgentLogin } from './pages/auth/InsuranceAgentLogin';
import { InvestmentAgentLogin } from './pages/auth/InvestmentAgentLogin';
import { AgentLogin } from './pages/auth/AgentLogin';
import { CustomerLogin } from './pages/auth/CustomerLogin';
import { CustomerRegister } from './pages/auth/CustomerRegister';
import { VerifyEmail } from './pages/auth/VerifyEmail';

// Admin Base Pages & Subpages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { AgentManagement } from './pages/admin/AgentManagement';
import { VerificationCenter } from './pages/admin/VerificationCenter';
import { ProductCMS } from './pages/admin/ProductCMS';
import { AuditLogs } from './pages/admin/AuditLogs';
import { SystemSettings } from './pages/admin/SystemSettings';

import { UsersManagementSub } from './pages/admin/UsersManagementSub';
import { AgentsSub } from './pages/admin/AgentsSub';
import { CustomersSub } from './pages/admin/CustomersSub';
import { ApplicationsSub } from './pages/admin/ApplicationsSub';
import { DocumentsSub } from './pages/admin/DocumentsSub';
import { ProductsSub } from './pages/admin/ProductsSub';
import { PermissionsSub } from './pages/admin/PermissionsSub';
import { SystemSub } from './pages/admin/SystemSub';
import { UpdatesSub } from './pages/admin/UpdatesSub';
import { ReportsSub } from './pages/admin/ReportsSub';
import { EnquiriesSub } from './pages/admin/EnquiriesSub';
import { WebsiteManagementSub } from './pages/admin/WebsiteManagementSub';

// Agent Pages
import { AgentDashboard } from './pages/agent/AgentDashboard';
import { AgentApplications } from './pages/agent/AgentApplications';
import { AgentTasks } from './pages/agent/AgentTasks';
import { AgentCustomers } from './pages/agent/AgentCustomers';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CreateApplication } from './pages/customer/CreateApplication';
import { CustomerDocuments } from './pages/customer/CustomerDocuments';
import { CustomerProfile } from './pages/customer/CustomerProfile';

// Notification History Page
import { NotificationHistory } from './pages/common/NotificationHistory';

import { MenuRouteGuard } from './components/common/MenuRouteGuard';

// Error Pages
import { Unauthorized } from './pages/error/Unauthorized';
import { NotFound } from './pages/error/NotFound';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <MenuRouteGuard>
            <Outlet />
          </MenuRouteGuard>
        </main>
      </div>
    </div>
  );
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
          <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
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
      </NotificationProvider>
    </ToastProvider>
  </AuthProvider>
);
};

export default App;
