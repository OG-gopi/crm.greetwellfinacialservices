import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { GFSLogo } from './GFSLogo';

interface ProtectedRoleRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoleRoute: React.FC<ProtectedRoleRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#091526]">
        <GFSLogo size="xl" variant="dark" />
        <div className="mt-6 flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent"></div>
          <p className="text-xs font-extrabold text-amber-300 tracking-wider uppercase">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const currentPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/email-login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
