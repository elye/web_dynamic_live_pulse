import { type Kind } from "../registry";
import { type QuestionMeta } from "./meta";
import { meta as slide } from "../types/slide/ui";
import { meta as cloud } from "../types/cloud/ui";
import { meta as poll } from "../types/poll/ui";
import { meta as manyoptions } from "../types/manyoptions/ui";
import { meta as ranking } from "../types/ranking/ui";
import { meta as slider } from "../types/slider/ui";
import { meta as qna } from "../types/qna/ui";
import { meta as points100 } from "../types/points100/ui";
import { meta as grid2x2 } from "../types/grid2x2/ui";
import { meta as peerpraise } from "../types/peerpraise/ui";
import { meta as text } from "../types/text/ui";
import { meta as quiz } from "../types/quiz/ui";
import { meta as truefalse } from "../types/truefalse/ui";
import { meta as twotruths } from "../types/twotruths/ui";
import { meta as match } from "../types/match/ui";

/** Typed against `Kind`, so a new question type does not compile until it has its look. */
const metas: Record<Kind, QuestionMeta> = {
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

export const metaOf = (kind: Kind): QuestionMeta => metas[kind];
