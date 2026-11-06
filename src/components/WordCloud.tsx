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

type Item = {
  text: string;
  x: number;
  y: number;
  angle: number;
  size: number;
  width: number;
  color: string;
  alpha: number;
};

const ANIMATION_MS = 800;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) ** 2);
const mix = (from: number, to: number, t: number) => from + (to - from) * t;

function hashValue(text: string) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.codePointAt(0)!) | 0;
  return Math.abs(hash);
}

const hashColor = (text: string) => colors[hashValue(text) % colors.length];

/** Draws items in CSS pixels onto a canvas backed by `ratio` device pixels. */
function paint(surface: HTMLCanvasElement, items: Item[], ratio: number) {
  const context = surface.getContext("2d")!;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, surface.width, surface.height);
  context.textBaseline = "middle";
  context.textAlign = "center";
  for (const item of items) {
    if (item.alpha <= 0.005) continue;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.translate(item.x * ratio, item.y * ratio);
    context.rotate(item.angle);
    context.globalAlpha = item.alpha;
    context.font = `700 ${item.size * ratio}px ${fontFamily}`;
    context.fillStyle = item.color;
    context.fillText(item.text, 0, 0);
  }
  context.globalAlpha = 1;
  context.setTransform(1, 0, 0, 1, 0, 0);
}

export default function WordCloud({
  results,
  limit = 60,
}: {
  results: Entry[];
  limit?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  // Survives re-renders so each new layout animates from what is on screen.
  const shown = useRef<Item[]>([]);
  const firstSeen = useRef(new Map<string, number>());
  const lastDensity = useRef(0);
  const lastShift = useRef({ x: 0, y: 0 });
  const entries = results.slice(0, limit);
  const signature = JSON.stringify(entries);

  useEffect(() => {
    const element = container.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    let disposed = false;
    let revision = 0;
    let previousWidth = 0;
    let frame = 0;
    let cancelLayout: (() => void) | undefined;
    const words: Entry[] = JSON.parse(signature);
    // Equal counts keep first-seen order so earlier words are placed the same way.
    for (const word of words)
      if (!firstSeen.current.has(word.text))
        firstSeen.current.set(word.text, firstSeen.current.size);
    words.sort(
      (a, b) =>
        b.count - a.count ||
        firstSeen.current.get(a.text)! - firstSeen.current.get(b.text)!,
    );
    const lookup = new Map(words.map((word) => [word.text, word]));
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    function layout(
      width: number,
      height: number,
      sizes: number[],
      density: number,
    ) {
      return new Promise<Item[] | null>((resolve) => {
        const scratch = document.createElement("canvas");
        scratch.width = Math.round(width * ratio);
        scratch.height = Math.round(height * ratio);
        const context = scratch.getContext("2d")!;
        const nativeFill = context.fillText.bind(context);
        const placed: Item[] = [];
        // Capture where the engine puts each word instead of showing it directly.
        context.fillText = (text: string, x: number, y: number) => {
          const matrix = context.getTransform();
          const scale = Math.hypot(matrix.a, matrix.b);
          const fontPixels = Number(context.font.match(/([\d.]+)px/)?.[1] || 0);
          const size = (fontPixels * scale) / ratio;
          const width = (context.measureText(text).width * scale) / ratio;
          const angle = Math.atan2(matrix.b, matrix.a);
          // Track the visual centre so a word turns on the spot when its orientation changes.
          const localX = (x * scale) / ratio + width / 2;
          const localY = (y * scale) / ratio;
          placed.push({
            text,
            x:
              matrix.e / ratio +
              localX * Math.cos(angle) -
              localY * Math.sin(angle),
            y:
              matrix.f / ratio +
              localX * Math.sin(angle) +
              localY * Math.cos(angle),
            angle,
            size,
            width,
            color: hashColor(text),
            alpha: 1,
          });
          nativeFill(text, x, y);
        };
        cancelLayout = () => {
          scratch.dispatchEvent(new CustomEvent("wordcloudstart"));
          resolve(null);
        };
        scratch.addEventListener("wordcloudstop", () => {
          const pixels = context.getImageData(
            0,
            0,
            scratch.width,
            scratch.height,
          ).data;
          let left = scratch.width;
          let right = 0;
          let top = scratch.height;
          let bottom = 0;
          for (let index = 0; index < pixels.length / 4; index++) {
            if (pixels[index * 4 + 3] === 0) continue;
            const column = index % scratch.width;
            const row = Math.floor(index / scratch.width);
            left = Math.min(left, column);
            right = Math.max(right, column);
            top = Math.min(top, row);
            bottom = Math.max(bottom, row);
          }
          if (placed.length) {
            let shiftX = (scratch.width - left - right) / (2 * ratio);
            let shiftY = (scratch.height - top - bottom) / (2 * ratio);
            // Keep the previous centring unless it is visibly off, so words don't all slide when the bounds change.
            const kept = lastShift.current;
            const fits = (
              shift: number,
              low: number,
              high: number,
              size: number,
            ) => low / ratio + shift >= 1 && high / ratio + shift <= size - 2;
            if (
              Math.abs(kept.x - shiftX) < 12 &&
              fits(kept.x, left, right, width)
            )
              shiftX = kept.x;
            if (
              Math.abs(kept.y - shiftY) < 12 &&
              fits(kept.y, top, bottom, height)
            )
              shiftY = kept.y;
            lastShift.current = { x: shiftX, y: shiftY };
            for (const item of placed) {
              item.x += shiftX;
              item.y += shiftY;
            }
          }
          resolve(placed);
        });
        const options: renderCloud.Options & {
          wordPadding: number;
          rotate: (word: string, attempt: number) => number;
        } = {
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
          color: "#000",
          shape: "circle",
          ellipticity: Math.min(1, height / width),
          shuffle: false,
          rotateRatio: 0.18,
          // Orientation is stable per word; the other one is only used when a word doesn't fit, and the change is animated.
          rotate: (word, attempt) =>
            hashValue(word) % 100 < 18 !== (attempt === 1) ? Math.PI / 2 : 0,
          drawOutOfBound: false,
          shrinkToFit: true,
        };
        renderCloud(scratch, options);
      });
    }

    /** Moves surviving words, grows new ones in and fades removed ones out. */
    function animate(target: Item[]) {
      cancelAnimationFrame(frame);
      const from = new Map(shown.current.map((item) => [item.text, item]));
      const kept = new Set(target.map((item) => item.text));
      const steps = [
        ...target.map((end) => {
          const start = from.get(end.text) ?? {
            ...end,
            size: end.size * 0.4,
            alpha: 0,
          };
          return { start, end };
        }),
        ...shown.current
          .filter((item) => !kept.has(item.text))
          .map((start) => ({ start, end: { ...start, alpha: 0 } })),
      ];
      const began = performance.now();
      const finish = () => {
        shown.current = target;
        paint(surface!, target, ratio);
        surface!.dataset.words = String(target.length);
        surface!.dataset.ready = "true";
      };
      if (reduceMotion || !steps.length) return finish();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - began) / ANIMATION_MS);
        if (progress >= 1) return finish();
        const t = easeInOut(progress);
        shown.current = steps.map(({ start, end }) => ({
          ...end,
          x: mix(start.x, end.x, t),
          y: mix(start.y, end.y, t),
          angle: mix(start.angle, end.angle, t),
          size: mix(start.size, end.size, t),
          width: mix(start.width, end.width, t),
          alpha: mix(start.alpha, end.alpha, t),
        }));
        paint(surface!, shown.current, ratio);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    async function draw(width: number) {
      const currentRevision = ++revision;
      cancelLayout?.();
      cancelAnimationFrame(frame);
      surface!.dataset.ready = "false";
      await fontReady;
      if (disposed || currentRevision !== revision) return;
      const height =
        (words.length > 30 && width < 480 ? 420 : 300) +
        Math.max(0, words.length - 60) * 2.5;
      element!.style.height = `${height}px`;
      element!.style.minHeight = `${height}px`;
      element!.style.flexBasis = `${height}px`;
      surface!.style.height = `${height}px`;
      const pixelWidth = Math.round(width * ratio);
      const pixelHeight = Math.round(height * ratio);
      if (surface!.width !== pixelWidth || surface!.height !== pixelHeight) {
        surface!.width = pixelWidth;
        surface!.height = pixelHeight;
        paint(surface!, shown.current, ratio);
      }
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
      const ideal = Math.min(
        1,
        Math.sqrt((width * height * 0.36) / Math.max(1, area)),
      );
      // Reuse the previous scale while it still fits, so one extra word does not resize every word.
      const requested = new Map(
        words.map((word, index) => [word.text, sizes[index]]),
      );
      const previous = lastDensity.current;
      const reusable =
        previous > 0 && previous >= ideal * 0.8 && previous <= ideal * 1.25;
      let density = reusable ? previous : ideal;
      let target = await layout(width, height, sizes, density);
      if (
        reusable &&
        target &&
        previous > ideal &&
        (target.length < words.length ||
          target.some(
            (item) =>
              item.size <
              Math.max(9, requested.get(item.text)! * density) * 0.97,
          ))
      ) {
        density = ideal;
        target = await layout(width, height, sizes, density);
      }
      lastDensity.current = density;
      if (disposed || currentRevision !== revision || !target) return;
      animate(target);
    }

    surface.onpointermove = (event) => {
      const bounds = surface.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      const hit = [...shown.current].reverse().find((item) => {
        if (item.alpha < 0.5) return false;
        const dx = pointerX - item.x;
        const dy = pointerY - item.y;
        const localX = dx * Math.cos(item.angle) + dy * Math.sin(item.angle);
        const localY = -dx * Math.sin(item.angle) + dy * Math.cos(item.angle);
        return (
          Math.abs(localX) <= item.width / 2 &&
          Math.abs(localY) <= item.size / 2
        );
      });
      const word = hit && lookup.get(hit.text);
      surface.title = word
        ? `${word.text}: ${word.count} ${word.count === 1 ? "response" : "responses"}`
        : "";
    };
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
      cancelAnimationFrame(frame);
      cancelLayout?.();
      observer.disconnect();
      surface.onpointermove = null;
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
