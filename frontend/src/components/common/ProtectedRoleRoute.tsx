import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { GFSLogo } from './GFSLogo';
import { resolveRoleRedirectPath } from '../../utils/navigation';

interface ProtectedRoleRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoleRoute: React.FC<ProtectedRoleRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070d19] text-slate-100 p-4">
        <GFSLogo size="xl" variant="dark" />
        <div className="mt-6 flex flex-col items-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent shadow-lg shadow-amber-400/20"></div>
          <p className="text-xs font-extrabold text-amber-300 tracking-wider uppercase">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const currentPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const currentPath = `${location.pathname}${location.search}`;
    const targetPath = resolveRoleRedirectPath(user.role, currentPath);
    const targetPathname = targetPath.split('?')[0];

    // Redirect to target path if it maps to a different route for the user's role
    if (targetPathname && targetPathname !== location.pathname && !targetPathname.startsWith('/unauthorized')) {
      return <Navigate to={targetPath} replace />;
    }

    // Fallback to role-specific dashboard if trying to access unauthorized route
    const dashboardPath = resolveRoleRedirectPath(user.role, '/dashboard');
    if (dashboardPath && dashboardPath !== location.pathname) {
      return <Navigate to={dashboardPath} replace />;
    }

    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
