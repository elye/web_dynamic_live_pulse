import { useLayoutEffect, type RefObject } from "react";

/**
 * Shrinks the text of `target` from `max` px down to `min` px until it wraps to
 * at most `lines` lines. Re-fits on resize and when the title changes.
 * Does nothing unless `target` sits inside an element matching `scope`.
 */
export function useFitLines(
  target: RefObject<HTMLElement | null>,
  scope: string,
  lines: number,
  min: number,
  max: number,
  key: string,
) {
  useLayoutEffect(() => {
    const el = target.current;
    if (!el || !el.closest(scope)) return;
    const fit = () => {
      let low = min;
      let high = max;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        el.style.fontSize = `${middle}px`;
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        if (el.offsetHeight <= lineHeight * lines + 1) low = middle;
        else high = middle - 1;
      }
      el.style.fontSize = `${low}px`;
    };
    fit();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) fit();
    });
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
      el.style.fontSize = "";
    };
  }, [target, scope, lines, min, max, key]);
}
