import React from 'react';

interface MetricCardProps {
  category?: string;
  title?: string;
  label?: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeText?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  progress?: number;
  progressPercent?: number;
  metaText?: string;
  variant?: 'cream' | 'lime' | 'dark';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  category,
  title,
  label,
  value,
  subtitle,
  badge,
  badgeText,
  badgeColor,
  icon,
  progress,
  progressPercent,
  metaText,
  variant = 'cream',
}) => {
  const displayTitle = title || label || '';
  const displayBadge = badge || badgeText;
  const isLime = variant === 'lime';
  const isDark = variant === 'dark';

  const containerStyles = isLime
    ? 'bg-brandLime text-brandDark border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A]'
    : isDark
    ? 'bg-[#141414] text-brandCream border-2 border-[#2A2A2A] shadow-[4px_4px_0px_#0A0A0A]'
    : 'bg-brandCream text-brandDark border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A]';

  const headerTextStyles = isLime
    ? 'text-brandDark font-bold'
    : isDark
    ? 'text-on-surface-variant font-semibold'
    : 'text-[#4A4A4A] font-semibold';

  const titleStyles = isLime
    ? 'text-brandDark'
    : isDark
    ? 'text-brandCream'
    : 'text-brandDark';

  const iconBg = isLime
    ? 'bg-brandDark text-brandLime border border-brandDark'
    : isDark
    ? 'bg-[#1C1C1C] text-brandLime border border-[#2A2A2A]'
    : 'bg-brandDark text-brandCream border border-brandDark';

  const progressTrack = isLime ? 'bg-brandDark/20' : isDark ? 'bg-[#2A2A2A]' : 'bg-[#D5D0C6]';
  const progressFill = isLime ? 'bg-brandDark' : isDark ? 'bg-brandLime' : 'bg-brandDark';

  const displayProgress = progressPercent !== undefined ? progressPercent : progress;

  return (
    <div
      className={`p-6 rounded-xl ${containerStyles} flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0A0A0A] transition-all group min-w-0`}
    >
      <div className="flex items-start justify-between min-w-0 gap-2">
        <div className="flex flex-col min-w-0">
          {(category || subtitle) && (
            <span
              className={`font-mono text-[11px] uppercase tracking-wider truncate ${headerTextStyles}`}
            >
              {category || subtitle}
            </span>
          )}
          <span
            className={`font-display text-2xl uppercase font-bold mt-1 truncate ${titleStyles}`}
          >
            {displayTitle}
          </span>
        </div>

        {icon && (
          <div
            className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0 shadow-sm`}
          >
            {typeof icon === 'string' ? (
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
            ) : (
              icon
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-baseline justify-between min-w-0">
        <span
          className={`font-display text-5xl font-bold leading-none tracking-tight ${titleStyles}`}
        >
          {value}
        </span>

        {(displayBadge || metaText) && (
          <div className="flex flex-col items-end shrink-0">
            {displayBadge && (
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  badgeColor === 'red'
                    ? 'bg-red-900/60 text-red-300 border border-red-500'
                    : badgeColor === 'amber'
                    ? 'bg-amber-900/60 text-amber-300 border border-amber-500'
                    : badgeColor === 'emerald'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500'
                    : isLime
                    ? 'bg-brandDark text-brandLime border border-brandDark'
                    : isDark
                    ? 'bg-brandLime text-brandDark border border-brandLime'
                    : 'bg-brandLime text-brandDark border border-brandDark'
                }`}
              >
                {displayBadge}
              </span>
            )}
            {metaText && (
              <span className="text-[11px] font-mono text-neutral-400 mt-1 font-medium">
                {metaText}
              </span>
            )}
          </div>
        )}
      </div>

      {displayProgress !== undefined && (
        <div className={`w-full ${progressTrack} h-1.5 rounded-full mt-4 overflow-hidden`}>
          <div
            className={`${progressFill} h-full rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
          />
        </div>
      )}
    </div>
  );
};
