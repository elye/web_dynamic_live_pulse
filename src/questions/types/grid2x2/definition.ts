import { defineQuestion } from "../../platform/define.ts";

type Point = { x: number; y: number };

export const grid2x2 = defineQuestion({
  kind: "grid2x2",
  label: "2x2 Grid",
  hint: "Rate items across a two-axis graph",
  tagline: "Place a point across two axes.",
  traits: { frameVisibleWhenHidden: true },
  options: {
    min: 4,
    max: 4,
    maxLength: 40,
    message:
      "A 2x2 grid question needs exactly 4 axis labels (x-low, x-high, y-low, y-high), up to 40 characters each.",
  },
  create: () => ({
    title: "Place your priority on the grid",
    options: ["Low urgency", "High urgency", "Low impact", "High impact"],
    correct: null,
  }),
  answer: {
    parse(_question, value) {
      const point = value as Partial<Point> | null;
      if (
        !point ||
        typeof point !== "object" ||
        Array.isArray(point) ||
        typeof point.x !== "number" ||
        typeof point.y !== "number" ||
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y) ||
        point.x < -100 ||
        point.x > 100 ||
        point.y < -100 ||
        point.y > 100
      )
        throw new Error("Place a point on the grid between -100 and 100.");
      return { x: point.x, y: point.y };
    },
    describe: (_question, answer) => {
      const { x, y } = answer as Point;
      return `x: ${x} · y: ${y}`;
    },
    simulate: (_question, random) => ({
      x: Math.round(((random() + random()) / 2) * 200 - 100),
      y: Math.round(((random() + random()) / 2) * 200 - 100),
    }),
  },
  results: {
    aggregate(_question, values) {
      const points = values as Point[];
      const mean = (axis: "x" | "y") =>
        points.length
          ? points.reduce((sum, point) => sum + point[axis], 0) / points.length
          : 0;
      return [
        {
          text: `Average: ${Math.round(mean("x") * 10) / 10},${Math.round(mean("y") * 10) / 10}`,
          count: points.length,
        },
        ...points.map((point) => ({ text: `${point.x},${point.y}`, count: 1 })),
      ];
    },
  },
  author: { toRaw: (input) => ({ options: input.options }) },
  prompt: {
    purpose: "Participants place a dot on a 2x2 grid (e.g. urgency vs impact).",
    rules:
      "options: exactly 4 axis labels in this order: x-axis low, x-axis high, y-axis low, y-axis high (max 40 characters each). correct: null.",
  },
});
