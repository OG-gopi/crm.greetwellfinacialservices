import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Legacy EmailLogin Component - Deprecated in favor of Unified Portal Gateway (/login).
 * Redirects any legacy email login links to the main unified login page preserving query parameters.
 */
export const EmailLogin: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`/login${location.search}`} replace />;
};

export default EmailLogin;
