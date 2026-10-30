import { useLayoutEffect, useRef } from "react";

const DURATION_MS = 700;

/**
 * Slides the children of a list to their new places when the order changes, instead of
 * having them jump. Each child needs a `data-flip` key. `order` must change whenever the
 * order does. Layout offsets are used, so a scaled stage doesn't distort the movement.
 */
export function useFlip<T extends HTMLElement>(order: string) {
  const list = useRef<T>(null);
  const tops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const parent = list.current;
    if (!parent) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    parent
      .querySelectorAll<HTMLElement>(":scope > [data-flip]")
      .forEach((child) => {
        const key = child.dataset.flip ?? "";
        const top = child.offsetTop;
        next.set(key, top);
        const before = tops.current.get(key);
        if (before === undefined || before === top || calm) return;
        child.animate(
          [
            { transform: `translateY(${before - top}px)` },
            { transform: "none" },
          ],
          { duration: DURATION_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
        );
      });
    tops.current = next;
  }, [order]);
  return list;
}
