import { type Kind } from "../registry";
import { type QuestionEditor } from "./editor";
import { editor as slide } from "../types/slide/editor";
import { editor as cloud } from "../types/cloud/editor";
import { editor as poll } from "../types/poll/editor";
import { editor as manyoptions } from "../types/manyoptions/editor";
import { editor as ranking } from "../types/ranking/editor";
import { editor as slider } from "../types/slider/editor";
import { editor as qna } from "../types/qna/editor";
import { editor as points100 } from "../types/points100/editor";
import { editor as grid2x2 } from "../types/grid2x2/editor";
import { editor as peerpraise } from "../types/peerpraise/editor";
import { editor as text } from "../types/text/editor";
import { editor as quiz } from "../types/quiz/editor";
import { editor as truefalse } from "../types/truefalse/editor";
import { editor as twotruths } from "../types/twotruths/editor";

/** Typed against `Kind`, so a new question type does not compile until it has its editor. */
const editors: Record<Kind, QuestionEditor> = {
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

export const editorOf = (kind: Kind): QuestionEditor => editors[kind];
