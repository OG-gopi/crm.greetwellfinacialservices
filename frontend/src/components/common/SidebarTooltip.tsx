import React, { useState } from 'react';

interface SidebarTooltipProps {
  content: string | React.ReactNode;
  isCollapsed: boolean;
  children: React.ReactElement;
  badge?: number | string;
  side?: 'right' | 'top';
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({
  content,
  isCollapsed,
  children,
  badge,
  side = 'right',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!isCollapsed) {
    return children;
  }

  return (
    <div
      className="relative flex items-center group/tooltip w-full justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${
            side === 'right' ? 'left-full ml-3 top-1/2 -translate-y-1/2' : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
          } z-50 flex items-center pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95`}
        >
          {/* Arrow */}
          {side === 'right' && (
            <div className="w-2 h-2 bg-slate-900 rotate-45 -mr-1 border-l border-b border-slate-700/60 flex-shrink-0" />
          )}

          {/* Content Card */}
          <div className="px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700/60 whitespace-nowrap flex items-center gap-2">
            <span>{content}</span>
            {badge !== undefined && badge !== null && (
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-600 text-white rounded-full">
                {badge}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarTooltip;
