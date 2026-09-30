import { useEffect, useLayoutEffect, useRef, useState } from "react";
import cloud from "d3-cloud";

type Entry = { text: string; count: number };
type CloudWord = cloud.Word & Entry & { color: number };
type Layout = { words: CloudWord[]; width: number; offsetX: number; offsetY: number };

export default function WordCloud({ results }: { results: Entry[] }) {
  const container = useRef<HTMLDivElement>(null);
  const group = useRef<SVGGElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const signature = JSON.stringify(results.slice(0, 60));

  useLayoutEffect(() => {
    if (!group.current || !layout) return;
    const bounds = group.current.getBBox();
    group.current.setAttribute("transform", `translate(${layout.width / 2 - bounds.x - bounds.width / 2}, ${150 - bounds.y - bounds.height / 2})`);
  }, [layout]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let stopped = false;
    let previousWidth = 0;
    let engine: ReturnType<typeof cloud<CloudWord>> | undefined;
    const entries: Entry[] = JSON.parse(signature);
    const height = 300;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    const maskCanvas = document.createElement("canvas");
    const mask = maskCanvas.getContext("2d")!;
    mask.fillText = (text, left, baseline) => {
      const metrics = mask.measureText(text);
      mask.fillRect(left, baseline - metrics.fontBoundingBoxAscent, metrics.width, metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent);
    };

    function draw(width: number, attempt = 0) {
      if (stopped || width < 40) return;
      engine?.stop();
      let seed = 193;
      const maximum = Math.max(1, ...entries.map((entry) => entry.count));
      const words = entries.map((entry, index) => {
        const preferred = 20 + Math.sqrt(entry.count / maximum) * 42;
        context!.font = `700 ${preferred}px Manrope`;
        const measured = context!.measureText(entry.text).width;
        const fitted = Math.min(preferred, preferred * (width - 40) / Math.max(1, measured));
        return { ...entry, color: index % 6, size: Math.max(8, Math.floor(fitted * Math.pow(0.82, attempt))) };
      });
      engine = cloud<CloudWord>()
        .canvas(() => maskCanvas)
        .size([width, height])
        .words(words)
        .text((word) => word.text)
        .font("Manrope")
        .fontWeight(700)
        .fontSize((word) => word.size!)
        .padding(0)
        .rotate(0)
        .spiral("archimedean")
        .random(() => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; })
        .on("end", (placed, bounds) => {
          if (stopped) return;
          if (placed.length < entries.length && attempt < 10) { draw(width, attempt + 1); return; }
          const centerX = bounds ? (bounds[0].x + bounds[1].x) / 2 : width / 2;
          const centerY = bounds ? (bounds[0].y + bounds[1].y) / 2 : height / 2;
          setLayout({ words: placed, width, offsetX: width - centerX, offsetY: height - centerY });
        });
      engine.start();
    }
    const observer = new ResizeObserver(() => {
      const width = Math.floor(element.clientWidth / 32) * 32;
      if (width === previousWidth) return;
      previousWidth = width;
      void document.fonts.load("700 62px Manrope").then(() => { if (!stopped && width === previousWidth) draw(width); });
    });
    observer.observe(element);
    return () => { stopped = true; observer.disconnect(); engine?.stop(); };
  }, [signature]);

  return <div ref={container} className="word-cloud scattered-cloud" aria-label="Word cloud results">
    {layout && <svg role="img" aria-label="Word cloud" width="100%" height="300" viewBox={`0 0 ${layout.width} 300`}>
      <g ref={group} transform={`translate(${layout.offsetX}, ${layout.offsetY})`}>
        {layout.words.map((word) => <text key={word.text} className={`cloud-word cloud-color-${word.color}`} x={word.x} y={word.y} textAnchor="middle" fontFamily="Manrope" fontWeight={700} fontSize={word.size}>
          <title>{`${word.count} ${word.count === 1 ? "response" : "responses"}`}</title>{word.text}
        </text>)}
      </g>
    </svg>}
  </div>;
}