import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { PORTAL_VERSION } from '../config/version';

interface VersionContextType {
  version: string;
  versionDisplay: string;
  loading: boolean;
  refreshVersion: () => Promise<void>;
  setVersionState: (newVersion: string) => void;
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

export const VersionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [version, setVersion] = useState<string>(PORTAL_VERSION);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchVersion = async () => {
    try {
      const res = await api.get('/updates/public-version');
      if (res.data.success && res.data.data?.version) {
        setVersion(res.data.data.version);
      }
    } catch (err) {
      // Fallback to static version configuration if backend unavailable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersion();
  }, []);

  const refreshVersion = async () => {
    await fetchVersion();
  };

  const setVersionState = (newVersion: string) => {
    setVersion(newVersion);
  };

  const versionDisplay = `GFS Portal v${version}`;

  return (
    <VersionContext.Provider
      value={{
        version,
        versionDisplay,
        loading,
        refreshVersion,
        setVersionState,
      }}
    >
      {children}
    </VersionContext.Provider>
  );
};

export const useVersion = (): VersionContextType => {
  const context = useContext(VersionContext);
  if (!context) {
    // Return safe fallback if used outside provider
    return {
      version: PORTAL_VERSION,
      versionDisplay: `GFS Portal v${PORTAL_VERSION}`,
      loading: false,
      refreshVersion: async () => {},
      setVersionState: () => {},
    };
  }
  return context;
};
