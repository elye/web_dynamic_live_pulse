import { useEffect, useState } from "react";

/**
 * Scales a slide designed at `baseWidth` x `baseHeight` px to fill the window.
 * The slide's logical size grows along the longer axis so no space is wasted.
 */
export function useSlideScale(baseWidth: number, baseHeight: number) {
  const measure = () => {
    const scale = Math.min(
      window.innerWidth / baseWidth,
      window.innerHeight / baseHeight,
    );
    return {
      scale,
      width: window.innerWidth / scale,
      height: window.innerHeight / scale,
    };
  };
  const [size, setSize] = useState(measure);
  useEffect(() => {
    const update = () => setSize(measure());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseWidth, baseHeight]);
  return size;
}
