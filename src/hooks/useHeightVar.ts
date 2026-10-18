import { RefObject, useLayoutEffect } from 'react';

/**
 * Publishes an element's rendered height as a CSS variable on <html>, e.g.
 * --app-header-h: 105px. Sticky elements use it as their `top` offset so they
 * sit right below other sticky bars. A hidden element (display: none) reports 0.
 */
export function useHeightVar(ref: RefObject<HTMLElement | null>, name: `--${string}`) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty(name, `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty(name);
    };
  }, [ref, name]);
}
