import type { ReactNode } from "react";
import { useSlideScale } from "../../../hooks/useSlideScale";

/** Reference slide size; the slide is scaled up from here to fill the screen. */
const BASE_WIDTH = 1100;
const BASE_HEIGHT = 700;

/** Fills the whole window with its slide, scaling the slide's layout to fit. */
export function SlideFit({ children }: { children: ReactNode }) {
  const { scale, width, height } = useSlideScale(BASE_WIDTH, BASE_HEIGHT);
  return (
    <div className="slide-fit">
      <div
        className="slide-fit-inner"
        style={{ width, height, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
