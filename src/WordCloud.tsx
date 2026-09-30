import { useEffect, useRef } from "react";
import renderCloud from "wordcloud";
import fontUrl from "@fontsource/manrope/files/manrope-latin-700-normal.woff2?url";

type Entry = { text: string; count: number };
const colors = [
  "#426c4b",
  "#7b9264",
  "#c87c65",
  "#8585a0",
  "#4e8778",
  "#8f9971",
];
const fontFamily = '"Pulse Cloud", sans-serif';
const fontReady = new FontFace("Pulse Cloud", `url(${fontUrl})`, {
  weight: "700",
})
  .load()
  .then((font) => document.fonts.add(font))
  .catch(() => undefined);

export default function WordCloud({ results }: { results: Entry[] }) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const entries = results.slice(0, 60);
  const signature = JSON.stringify(entries);

  useEffect(() => {
    const element = container.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    let disposed = false;
    let revision = 0;
    let previousWidth = 0;
    const words: Entry[] = JSON.parse(signature);
    const lookup = new Map(
      words.map((word, index) => [
        word.text,
        { ...word, color: colors[index % colors.length] },
      ]),
    );
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    let drawn = 0;
    const onWord = (event: Event) => {
      if ((event as CustomEvent<{ drawn: boolean }>).detail.drawn) drawn++;
    };
    const onComplete = () => {
      const pixels = surface
        .getContext("2d")!
        .getImageData(0, 0, surface.width, surface.height).data;
      let left = surface.width;
      let right = 0;
      let top = surface.height;
      let bottom = 0;
      for (let index = 0; index < pixels.length / 4; index++) {
        if (pixels[index * 4 + 3] === 0) continue;
        const column = index % surface.width;
        const row = Math.floor(index / surface.width);
        left = Math.min(left, column);
        right = Math.max(right, column);
        top = Math.min(top, row);
        bottom = Math.max(bottom, row);
      }
      if (drawn)
        surface.style.transform = `translate(${(surface.width - left - right) / (2 * ratio)}px, ${(surface.height - top - bottom) / (2 * ratio)}px)`;
      surface.dataset.words = String(drawn);
      surface.dataset.ready = "true";
    };
    surface.addEventListener("wordclouddrawn", onWord);
    surface.addEventListener("wordcloudstop", onComplete);

    async function draw(width: number) {
      const currentRevision = ++revision;
      surface!.dispatchEvent(new CustomEvent("wordcloudstart"));
      surface!.dataset.ready = "false";
      surface!.style.transform = "";
      await fontReady;
      if (disposed || currentRevision !== revision) return;
      const height = words.length > 30 && width < 480 ? 420 : 300;
      element!.style.height = `${height}px`;
      element!.style.minHeight = `${height}px`;
      element!.style.flexBasis = `${height}px`;
      surface!.style.height = `${height}px`;
      surface!.width = Math.round(width * ratio);
      surface!.height = Math.round(height * ratio);
      const context = surface!.getContext("2d")!;
      const maximum = Math.max(1, ...words.map((word) => word.count));
      const sizes = words.map((word) => {
        const size = 14 + Math.pow(word.count / maximum, 1.15) * 64;
        context.font = `700 ${size}px ${fontFamily}`;
        const textWidth = context.measureText(word.text).width;
        return Math.min(size, (size * (width - 24)) / Math.max(1, textWidth));
      });
      const area = words.reduce((sum, word, index) => {
        context.font = `700 ${sizes[index]}px ${fontFamily}`;
        return sum + context.measureText(word.text).width * sizes[index];
      }, 0);
      const density = Math.min(
        1,
        Math.sqrt((width * height * 0.36) / Math.max(1, area)),
      );
      drawn = 0;
      const options: renderCloud.Options & { wordPadding: number } = {
        list: words.map((word, index) => [
          word.text,
          Math.max(9, sizes[index] * density) * ratio,
        ]),
        fontFamily,
        fontWeight: "700",
        gridSize: Math.max(4, Math.round(4 * ratio)),
        wordPadding: (words.length <= 15 ? 7 : 5) * ratio,
        weightFactor: 1,
        minSize: 7 * ratio,
        backgroundColor: "transparent",
        color: (word) => lookup.get(word)!.color,
        shape: "circle",
        ellipticity: Math.min(1, height / width),
        shuffle: false,
        rotateRatio: 0.18,
        minRotation: Math.PI / 2,
        maxRotation: Math.PI / 2,
        drawOutOfBound: false,
        shrinkToFit: true,
        hover: (item) => {
          const word = item && lookup.get(item[0]);
          surface!.title = word
            ? `${word.text}: ${word.count} ${word.count === 1 ? "response" : "responses"}`
            : "";
        },
      };
      renderCloud(surface!, options);
    }
    const observer = new ResizeObserver(() => {
      const width = Math.floor(element.clientWidth);
      if (width < 40 || width === previousWidth) return;
      previousWidth = width;
      void draw(width);
    });
    observer.observe(element);
    return () => {
      disposed = true;
      revision++;
      observer.disconnect();
      surface.removeEventListener("wordclouddrawn", onWord);
      surface.removeEventListener("wordcloudstop", onComplete);
      surface.dispatchEvent(new CustomEvent("wordcloudstart"));
    };
  }, [signature]);

  return (
    <div
      ref={container}
      className="word-cloud scattered-cloud"
      aria-label="Word cloud results"
    >
      <canvas
        ref={canvas}
        className="cloud-canvas"
        role="img"
        aria-label={entries
          .map((word) => `${word.text}: ${word.count}`)
          .join(", ")}
      />
      <ul
        className="cloud-accessible-words"
        aria-label="Words and response counts"
      >
        {entries.map((word) => (
          <li
            key={word.text}
            className="cloud-word"
            title={`${word.count} ${word.count === 1 ? "response" : "responses"}`}
          >
            {word.text}: {word.count}{" "}
            {word.count === 1 ? "response" : "responses"}
          </li>
        ))}
      </ul>
    </div>
  );
}
