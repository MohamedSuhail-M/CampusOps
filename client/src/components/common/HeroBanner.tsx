import React from 'react';

interface HeroBannerProps {
  badge: string;
  subBadge?: string;
  title: string;
  highlightedTitle?: string;
  description: string;
  actionText?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  badge,
  subBadge,
  title,
  highlightedTitle,
  description,
  actionText,
  actionIcon,
  onAction,
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-brandCream border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] p-6 lg:p-8 mb-8 text-brandDark">
      {/* Luminous lime orbital halo */}
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-brandLime/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-brandDark" />
            <span className="px-2 py-0.5 rounded bg-brandLime text-brandDark font-bold border border-brandDark">
              {badge}
            </span>
            {subBadge && <span className="text-[#4A4A4A] font-bold">// {subBadge}</span>}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase font-bold tracking-tight leading-tight text-brandDark">
            {title}{' '}
            {highlightedTitle && (
              <span className="underline decoration-brandLime decoration-4">{highlightedTitle}</span>
            )}
          </h1>

          <p className="font-sans text-sm sm:text-base text-[#2A2A2A] max-w-xl font-medium leading-relaxed">
            {description}
          </p>
        </div>

        {actionText && (
          <div className="shrink-0">
            <button
              type="button"
              onClick={onAction}
              className="group inline-flex items-center gap-2 bg-brandLime hover:bg-[#b2dc26] text-brandDark px-6 py-3.5 rounded-xl font-display text-sm uppercase font-bold tracking-wider border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#0A0A0A] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-200"
            >
              {actionIcon}
              <span>{actionText}</span>
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
