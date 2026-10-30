import React, { useEffect } from 'react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  onConfirm?: () => void;
  loading?: boolean;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  maxWidth = 'xl',
  confirmText,
  confirmLabel,
  cancelText = 'Cancel',
  onConfirm,
  loading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brandDark/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthClass} rounded-2xl bg-brandCream border-2 border-brandDark shadow-[8px_8px_0px_#0A0A0A] p-6 lg:p-8 z-10 text-brandDark transform transition-all animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b-2 border-brandDark gap-4">
          <div className="flex flex-col">
            {badge && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-brandLime text-brandDark border border-brandDark font-bold uppercase w-fit mb-1.5 shadow-[1px_1px_0px_#0A0A0A]">
                {badge}
              </span>
            )}
            {subtitle && (
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-neutral-600 mb-0.5">
                {subtitle}
              </span>
            )}
            <h2 className="font-display text-2xl uppercase font-bold tracking-tight text-brandDark leading-tight">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white border-2 border-brandDark flex items-center justify-center text-brandDark hover:bg-neutral-100 transition-colors shadow-[2px_2px_0px_#0A0A0A] cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px] font-bold">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6">{children}</div>

        {/* Footer Actions if onConfirm provided */}
        {onConfirm && (
          <div className="mt-6 pt-4 border-t-2 border-brandDark flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border-2 border-brandDark rounded-lg font-mono text-xs uppercase font-bold text-brandDark hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2 bg-brandLime border-2 border-brandDark rounded-lg font-mono text-xs uppercase font-bold text-brandDark hover:bg-[#b0dc28] transition-colors shadow-[2px_2px_0px_#0A0A0A] cursor-pointer flex items-center gap-2"
            >
              {loading && <span className="animate-spin text-sm">⌛</span>}
              {confirmText || confirmLabel || 'Confirm'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
