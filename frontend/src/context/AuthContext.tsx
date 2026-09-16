import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // Exactly 10 minutes
const AUTH_CHANNEL_NAME = 'gfs_auth_channel';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: (reason?: string | React.SyntheticEvent) => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);

  const clearClientSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('gfs_session_active');
    setToken(null);
    setUser(null);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const redirectToLoginWithMessage = (msg: string) => {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/invite')) {
      const loginUrl = `/login?message=${encodeURIComponent(msg)}`;
      window.location.href = loginUrl;
    }
  };

  const logout = useCallback((reason?: string | React.SyntheticEvent) => {
    const logoutMsg = typeof reason === 'string' && reason.trim() !== ''
      ? reason
      : 'You have been logged out successfully. Please log in again.';

    // Broadcast logout event to sibling tabs
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type: 'LOGOUT', reason: logoutMsg });
      } catch (err) {
        console.error('BroadcastChannel error during logout:', err);
      }
    }

    clearClientSession();
    redirectToLoginWithMessage(logoutMsg);
  }, [clearClientSession]);

  // Initialize BroadcastChannel for cross-tab synchronization
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channelRef.current = bc;

      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'LOGOUT') {
          const reason = event.data.reason || 'Your session was ended from another tab.';
          clearClientSession();
          redirectToLoginWithMessage(reason);
        }
      };

      return () => {
        bc.close();
      };
    }
  }, [clearClientSession]);

  // Listen to window storage event as a fallback for cross-tab logout
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        clearClientSession();
        redirectToLoginWithMessage('You have been logged out from another tab.');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [clearClientSession]);

  // Initial Token Verification
  useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
            sessionStorage.setItem('gfs_session_active', 'true');
          } else {
            logout('Session invalid. Please log in again.');
          }
        } catch (err) {
          console.error('Failed to verify token profile:', err);
          logout('Session expired or invalid. Please log in again.');
        }
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [token, logout]);

  // 10-Minute User Inactivity Timer & Activity Listener
  useEffect(() => {
    if (!token || !user) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        logout('Your session expired due to inactivity. Please log in again.');
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Debounced user activity handler
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityTimeRef.current > 1000) { // Throttle activity resets to max once per second
        lastActivityTimeRef.current = now;
        resetInactivityTimer();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Start initial timer
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [token, user, logout]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    sessionStorage.setItem('gfs_session_active', 'true');
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
