import { useRef } from "react";
import { useFitFont } from "../../hooks/useFitFont";

/** 2×2 grid axis title: as large as its box allows, smaller only when the text is long. */
export function GridAxisLabel({
  side,
  text,
  max = 24,
}: {
  side: "top" | "bottom" | "left" | "right";
  text: string;
  max?: number;
}) {
  const box = useRef<HTMLSpanElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  useFitFont(box, content, 9, max, text);
  return (
    <span className={`grid2x2-axis-label grid2x2-${side}`} ref={box}>
      <span className="grid2x2-axis-text" ref={content}>
        {text}
      </span>
    </span>
  );
}
