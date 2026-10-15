import { canCompete, type Kind } from "../../model";

export type Authored = {
  title: string;
  options: string[];
  correct: number | null;
  multiple?: boolean;
  corrects?: number[];
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
};

/** An empty draft of a player-written question of the given kind. */
export function blankAuthored(kind: Kind): Authored {
  return {
    title: "",
    options:
      kind === "truefalse"
        ? ["True", "False"]
        : kind === "twotruths"
          ? ["", "", ""]
          : kind === "grid2x2"
            ? ["", "", "", ""]
            : ["poll", "quiz", "ranking", "points100"].includes(kind)
              ? ["", ""]
              : [],
    correct: canCompete(kind) ? 0 : null,
    ...(kind === "slider"
      ? { sliderMin: 0, sliderMax: 10, sliderStep: 1 }
      : {}),
  };
}
