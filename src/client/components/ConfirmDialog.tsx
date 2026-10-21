import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' for destructive actions (red button, Cancel focused by default) */
  tone?: 'danger' | 'default';
  /**
   * Optional work to run after the user confirms. The dialog stays open with a
   * spinner until it settles, so the user sees the request in progress.
   */
  action?: () => Promise<unknown>;
  /** Button label while action runs, e.g. 'Đang xóa...' */
  busyLabel?: string;
}

interface ConfirmDialogProps extends Omit<ConfirmOptions, 'action'> {
  open: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  tone = 'default',
  busy = false,
  busyLabel = 'Đang xử lý...',
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the safe choice first, and restore focus when the dialog closes
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    (tone === 'danger' ? cancelRef : confirmRef).current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [open, tone]);

  // Escape cancels, except while the confirmed action is running
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const isDanger = tone === 'danger';
  const Icon = isDanger ? AlertTriangle : HelpCircle;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        aria-busy={busy}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border ${
              isDanger
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-white">
              {title}
            </h2>
            {message && (
              <div id={messageId} className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                {message}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 px-4 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-10 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 disabled:opacity-80 disabled:cursor-wait ${
              isDanger
                ? 'bg-rose-500 hover:bg-rose-400 text-white focus-visible:ring-rose-300'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 focus-visible:ring-emerald-300'
            }`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── useConfirm: promise-based replacement for window.confirm ───────────────

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(next => {
    // A new request cancels any dialog still open
    resolverRef.current?.(false);
    setOptions(next);
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setBusy(false);
    setOptions(null);
  }, []);

  // With an action, keep the dialog open (and locked) until the work finishes
  const handleConfirm = useCallback(async () => {
    if (options?.action) {
      setBusy(true);
      try {
        await options.action();
      } catch {
        // The action reports its own errors; just close the dialog
      }
    }
    settle(true);
  }, [options, settle]);
  const handleCancel = useCallback(() => settle(false), [settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <ConfirmDialog open {...options} busy={busy} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </ConfirmContext.Provider>
  );
};

/** const confirm = useConfirm(); if (!(await confirm({ title: '...' }))) return; */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
}
