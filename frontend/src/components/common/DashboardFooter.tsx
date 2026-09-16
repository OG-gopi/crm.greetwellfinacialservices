import React from 'react';
import { useVersion } from '../../context/VersionContext';

export const DashboardFooter: React.FC = () => {
  const { versionDisplay } = useVersion();
  return (
    <div className="pt-6 mt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-medium w-full">
      <span>© {new Date().getFullYear()} Greetwell Financial Services. All rights reserved.</span>
      <span className="font-mono font-bold text-slate-600 bg-slate-200/60 px-2.5 py-0.5 rounded-md border border-slate-200">
        {versionDisplay}
      </span>
    </div>
  );
};

export default DashboardFooter;
