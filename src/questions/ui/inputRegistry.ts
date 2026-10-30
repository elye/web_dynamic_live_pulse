import { type Kind } from "../registry";
import { type QuestionInput } from "./input";
import { input as slide } from "../types/slide/input";
import { input as cloud } from "../types/cloud/input";
import { input as poll } from "../types/poll/input";
import { input as manyoptions } from "../types/manyoptions/input";
import { input as ranking } from "../types/ranking/input";
import { input as slider } from "../types/slider/input";
import { input as qna } from "../types/qna/input";
import { input as points100 } from "../types/points100/input";
import { input as grid2x2 } from "../types/grid2x2/input";
import { input as peerpraise } from "../types/peerpraise/input";
import { input as text } from "../types/text/input";
import { input as quiz } from "../types/quiz/input";
import { input as truefalse } from "../types/truefalse/input";
import { input as twotruths } from "../types/twotruths/input";
import { input as match } from "../types/match/input";

/** Typed against `Kind`, so a new question type does not compile until a player can answer it. */
const inputs: Record<Kind, QuestionInput> = {
  slide,
  cloud,
  poll,
  manyoptions,
  ranking,
  slider,
  qna,
  points100,
  grid2x2,
  peerpraise,
  text,
  quiz,
  truefalse,
  twotruths,
  match,
};

export const inputOf = (kind: Kind): QuestionInput => inputs[kind];
