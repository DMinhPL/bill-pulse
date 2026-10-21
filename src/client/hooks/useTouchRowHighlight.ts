import { useEffect, useRef, useState } from 'react';
import type { PointerEventHandler } from 'react';

const MAX_TAP_MOVEMENT_PX = 8;

export const TOUCH_ROW_HIGHLIGHT_CLASS =
  'bg-amber-500/15 shadow-[inset_3px_0_0_#f59e0b]';

interface TouchStart {
  rowId: string;
  x: number;
  y: number;
}

/** Persistent touch-only row selection that ignores horizontal and vertical swipes. */
export function useTouchRowHighlight(resetKey?: string | number | null) {
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const touchStart = useRef<TouchStart | null>(null);

  useEffect(() => setHighlightedRowId(null), [resetKey]);

  const getTouchRowProps = (rowId: string) => {
    const onPointerDown: PointerEventHandler<HTMLTableRowElement> = event => {
      if (event.pointerType !== 'touch') return;
      touchStart.current = { rowId, x: event.clientX, y: event.clientY };
    };

    const onPointerUp: PointerEventHandler<HTMLTableRowElement> = event => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start || event.pointerType !== 'touch' || start.rowId !== rowId) return;

      const movement = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (movement > MAX_TAP_MOVEMENT_PX) return;

      setHighlightedRowId(current => current === rowId ? null : rowId);
    };

    const onPointerCancel: PointerEventHandler<HTMLTableRowElement> = () => {
      touchStart.current = null;
    };

    return {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      'data-touch-highlighted': highlightedRowId === rowId || undefined,
    };
  };

  return {
    getTouchRowProps,
    isRowHighlighted: (rowId: string) => highlightedRowId === rowId,
  };
}
