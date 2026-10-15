import { SlidersHorizontal } from "lucide-react";

/** A slider track showing every participant's value as a dot, with the average as a larger, brighter circle. */
export function SliderResults({
  min,
  max,
  summary,
  values,
  average,
}: {
  min: number;
  max: number;
  summary: string;
  values: { value: number; count: number }[];
  average: number | null;
}) {
  const span = max - min || 1;
  const toPercent = (value: number) =>
    Math.min(100, Math.max(0, ((value - min) / span) * 100));
  const tallest = Math.max(1, ...values.map((item) => item.count));
  const step = Math.min(18, 110 / tallest);
  return (
    <div className="slider-results">
      <div className="slider-average">
        <SlidersHorizontal size={20} />
        <strong>{summary}</strong>
      </div>
      <div className="slider-visual">
        <div className="slider-dots">
          {values.map((item) =>
            Array.from({ length: item.count }, (_, stack) => (
              <span
                key={`${item.value}-${stack}`}
                className="slider-dot"
                style={{
                  left: `${toPercent(item.value)}%`,
                  bottom: `${stack * step}px`,
                }}
              />
            )),
          )}
        </div>
        <div className="slider-track">
          {average !== null && (
            <span
              className="slider-average-dot"
              style={{ left: `${toPercent(average)}%` }}
              title={`Average ${average}`}
            />
          )}
        </div>
        <div className="slider-scale">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}
