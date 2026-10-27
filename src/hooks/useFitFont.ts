import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Grows the font size of `list` to the largest value (between min and max, in px)
 * whose content still fits inside `box`, and keeps it fitted on resize.
 * `onFit` reports whether the content fits even at the minimum size.
 */
export function useFitFont(
  box: RefObject<HTMLElement | null>,
  list: RefObject<HTMLElement | null>,
  min: number,
  max: number,
  key: string,
  onFit?: (fits: boolean) => void,
) {
  const report = useRef(onFit);
  useLayoutEffect(() => {
    report.current = onFit;
  });
  useLayoutEffect(() => {
    const container = box.current;
    const content = list.current;
    if (!container || !content) return;
    const fit = () => {
      let low = min;
      let high = max;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        content.style.fontSize = `${middle}px`;
        if (
          content.offsetHeight <= container.clientHeight &&
          content.scrollWidth <= container.clientWidth
        )
          low = middle;
        else high = middle - 1;
      }
      content.style.fontSize = `${low}px`;
      report.current?.(
        content.offsetHeight <= container.clientHeight &&
          content.scrollWidth <= container.clientWidth,
      );
    };
    fit();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) fit();
    });
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [box, list, min, max, key]);
}
