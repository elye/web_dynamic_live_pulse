import { type Kind } from "../registry";
import { type QuestionResults } from "./results";
import { results as slide } from "../types/slide/results";
import { results as cloud } from "../types/cloud/results";
import { results as poll } from "../types/poll/results";
import { results as manyoptions } from "../types/manyoptions/results";
import { results as ranking } from "../types/ranking/results";
import { results as slider } from "../types/slider/results";
import { results as qna } from "../types/qna/results";
import { results as points100 } from "../types/points100/results";
import { results as grid2x2 } from "../types/grid2x2/results";
import { results as peerpraise } from "../types/peerpraise/results";
import { results as text } from "../types/text/results";
import { results as quiz } from "../types/quiz/results";
import { results as truefalse } from "../types/truefalse/results";
import { results as twotruths } from "../types/twotruths/results";

/** Typed against `Kind`, so a new question type does not compile until it can show its responses. */
const all: Record<Kind, QuestionResults> = {
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
};

export const resultsOf = (kind: Kind): QuestionResults => all[kind];
