import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { pendingRequestStore } from '../utils/api';

// Requests faster than this don't flash the bar
const SHOW_DELAY_MS = 150;

/** Thin animated bar pinned to the top of the page while any API request is in flight. */
export const GlobalLoadingBar: React.FC = () => {
  const pending = useSyncExternalStore(pendingRequestStore.subscribe, pendingRequestStore.getSnapshot);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pending === 0) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pending > 0]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label="Đang tải"
      className="fixed top-0 inset-x-0 z-70 h-0.5 overflow-hidden bg-emerald-500/15 pointer-events-none"
    >
      <div className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 animate-indeterminate" />
    </div>
  );
};
