import {
  BarChart3,
  Cloud,
  Drama,
  FileText,
  Grid2x2,
  ListOrdered,
  MessageCircle,
  MessageCircleQuestion,
  Percent,
  SlidersHorizontal,
  ToggleLeft,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { type Kind } from "../model";

export const icons: Record<Kind, LucideIcon> = {
  slide: FileText,
  cloud: Cloud,
  poll: BarChart3,
  quiz: Trophy,
  truefalse: ToggleLeft,
  twotruths: Drama,
  ranking: ListOrdered,
  slider: SlidersHorizontal,
  qna: MessageCircleQuestion,
  points100: Percent,
  grid2x2: Grid2x2,
  peerpraise: Users,
  text: MessageCircle,
};

/** Question types whose options are shown on the stage even while responses are hidden. */
export const optionKinds: Kind[] = [
  "poll",
  "quiz",
  "truefalse",
  "twotruths",
  "ranking",
  "points100",
];

/** Kinds with a frame (axes / range) that can be shown while responses are hidden. */
export const frameKinds: Kind[] = ["grid2x2", "slider"];

/** Questions without a right answer show responses live; questions with one are scored and ranked. */
export const kindGroups: { title: string; hint: string; kinds: Kind[] }[] = [
  {
    title: "Without an answer",
    hint: "Gather opinions and ideas. Responses can show live or after reveal.",
    kinds: [
      "slide",
      "cloud",
      "poll",
      "ranking",
      "slider",
      "qna",
      "points100",
      "grid2x2",
      "peerpraise",
      "text",
    ],
  },
  {
    title: "With an answer",
    hint: "Score players. Responses stay hidden and a top 10 ranking follows.",
    kinds: ["quiz", "truefalse", "twotruths"],
  },
];

/** Question types a player can write themselves (everything that collects a response). */
export const crowdGroups = kindGroups.map((group) => ({
  ...group,
  kinds: group.kinds.filter((kind) => kind !== "slide"),
}));

export const kindHints: Record<Kind, string> = {
  slide: "Just a title and description, no input needed",
  cloud: "One word, a whole room of perspectives",
  poll: "Let everyone pick their favorite",
  quiz: "A correct answer and a little competition",
  truefalse: "A binary choice: true or false",
  twotruths: "Two true statements and one lie. Spot the lie",
  ranking: "Drag to sort items from most to least important",
  slider: "Estimate a numeric value on a sliding scale",
  qna: "Participants submit and upvote live questions",
  points100: "Allocate 100 points across a set of options to show priorities",
  grid2x2: "Rate items across a two-axis graph",
  peerpraise: "Write something kind about another player",
  text: "Give every thought a little room",
};

export const samples = [
  { text: "excited", count: 12 },
  { text: "curious", count: 9 },
  { text: "inspired", count: 8 },
  { text: "optimistic", count: 7 },
  { text: "energized", count: 6 },
  { text: "ready", count: 5 },
  { text: "focused", count: 4 },
  { text: "grateful", count: 3 },
  { text: "creative", count: 3 },
  { text: "hopeful", count: 2 },
  { text: "connected", count: 2 },
];
