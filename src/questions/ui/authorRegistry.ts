import { type Kind } from "../registry";
import { type QuestionAuthor } from "./author";
import { author as slide } from "../types/slide/author";
import { author as cloud } from "../types/cloud/author";
import { author as poll } from "../types/poll/author";
import { author as manyoptions } from "../types/manyoptions/author";
import { author as ranking } from "../types/ranking/author";
import { author as slider } from "../types/slider/author";
import { author as qna } from "../types/qna/author";
import { author as points100 } from "../types/points100/author";
import { author as grid2x2 } from "../types/grid2x2/author";
import { author as peerpraise } from "../types/peerpraise/author";
import { author as text } from "../types/text/author";
import { author as quiz } from "../types/quiz/author";
import { author as truefalse } from "../types/truefalse/author";
import { author as twotruths } from "../types/twotruths/author";
import { author as match } from "../types/match/author";

/** Typed against `Kind`, so a new question type does not compile until it says how players write it. */
const authors: Record<Kind, QuestionAuthor> = {
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

export const authorOf = (kind: Kind): QuestionAuthor => authors[kind];
