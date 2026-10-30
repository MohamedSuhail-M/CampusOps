import React from 'react';

interface CampusOpsLogoProps {
  roleBadge?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const CampusOpsLogo: React.FC<CampusOpsLogoProps> = ({
  roleBadge,
  size = 'md',
  showSubtitle = true,
}) => {
  const badgeSize = size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-10 h-10 text-xl' : 'w-8 h-8 text-sm';
  const titleSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`${badgeSize} rounded bg-brandLime text-brandDark font-black flex items-center justify-center font-mono tracking-tighter border border-brandDark shadow-[2px_2px_0px_#0A0A0A] shrink-0`}
      >
        CO
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-display ${titleSize} font-bold tracking-wider text-brandCream uppercase`}>
            CAMPUS<span className="text-brandLime">OPS</span>
          </span>
          {roleBadge && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brandLime text-brandDark font-black tracking-widest leading-none border border-brandDark shrink-0">
              {roleBadge}
            </span>
          )}
        </div>
        {showSubtitle && (
          <span className="text-[8px] font-mono text-on-surface-variant tracking-[0.2em] uppercase leading-none mt-1">
            OPERATIONS ENGINE
          </span>
        )}
      </div>
    </div>
  );
};
