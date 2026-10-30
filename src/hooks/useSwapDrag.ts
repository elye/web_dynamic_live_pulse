import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type Drag = { from: number; x: number; y: number; over: number | null };

const MOVE_THRESHOLD = 6;
/** How long the two tiles that just traded places stay highlighted. */
const HIGHLIGHT_MS = 1000;

/**
 * Lets a list of items trade places: drag one onto another and the two swap. It works with
 * a mouse, a finger or the keyboard (press Enter on one item, then on another), and a tap on
 * one item followed by a tap on another swaps them too.
 */
export function useSwapDrag(
  swapItems: (first: number, second: number) => void,
) {
  const group = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [swapped, setSwapped] = useState<{ items: number[]; pulse: number }>({
    items: [],
    pulse: 0,
  });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onSwap = (first: number, second: number) => {
    swapItems(first, second);
    // Alternating the class restarts the fade when a swap lands during the previous one.
    setSwapped(({ pulse }) => ({ items: [first, second], pulse: pulse + 1 }));
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setSwapped(({ pulse }) => ({ items: [], pulse })),
      HIGHLIGHT_MS,
    );
  };

  function choose(index: number) {
    if (selected === null) setSelected(index);
    else {
      if (selected !== index) onSwap(selected, index);
      setSelected(null);
    }
  }

  const overIndex = (x: number, y: number) => {
    const target = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>(`[data-swap-group="${group}"]`);
    return target ? Number(target.dataset.swapIndex) : null;
  };

  function startDrag(index: number, event: PointerEvent) {
    if (event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    let over: number | null = null;
    const move = (next: globalThis.PointerEvent) => {
      const x = next.clientX - startX;
      const y = next.clientY - startY;
      if (!moved && Math.hypot(x, y) < MOVE_THRESHOLD) return;
      moved = true;
      over = overIndex(next.clientX, next.clientY);
      setDrag({ from: index, x, y, over });
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
    };
    const end = () => {
      stop();
      setDrag(null);
      if (!moved) choose(index);
      else {
        setSelected(null);
        if (over !== null && over !== index) onSwap(index, over);
      }
    };
    const cancel = () => {
      stop();
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", cancel);
  }

  /** Everything an item needs to be dragged, dropped on and chosen. */
  function item(index: number) {
    const dragging = drag?.from === index;
    const style: CSSProperties = dragging
      ? {
          transform: `translate(${drag.x}px, ${drag.y}px)`,
          zIndex: 10,
          pointerEvents: "none",
        }
      : {};
    const state = [
      dragging ? "is-dragging" : "",
      drag && drag.over === index && !dragging ? "is-swap-target" : "",
      selected === index ? "is-selected" : "",
      swapped.items.includes(index)
        ? `is-swapped swapped-${swapped.pulse % 2}`
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    return {
      className: state,
      style,
      role: "button" as const,
      tabIndex: 0,
      "aria-pressed": selected === index,
      "data-swap-group": group,
      "data-swap-index": index,
      onPointerDown: (event: PointerEvent) => startDrag(index, event),
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose(index);
        } else if (event.key === "Escape") setSelected(null);
      },
    };
  }

  return { item };
}
