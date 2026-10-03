import {
  canCompete,
  labels,
  newQuestion,
  newSession,
  serializeSession,
} from "./model.ts";
import type { Kind } from "./model.ts";

/**
 * Describes one slide type to an AI model so it can generate importable session JSON.
 *
 * `slideSpecs` is a `Record<Kind, …>`: when a new slide type is added to `Kind` in
 * `model.ts`, TypeScript refuses to compile until an entry is added here, so the
 * "Generate AI prompt" system prompt can never miss a slide type.
 * The example JSON in the prompt is generated from `newQuestion(kind)`, so it stays in
 * sync with the real defaults automatically.
 */
export type SlideSpec = {
  /** What the slide does and when an author should use it. */
  purpose: string;
  /** Exact field rules the importer enforces for this type. */
  rules: string;
};

export const slideSpecs: Record<Kind, SlideSpec> = {
  slide: {
    purpose:
      "Display-only title and description slide. Participants answer nothing. Use it for intros, section breaks and instructions.",
    rules:
      'options: []. correct: null. "description" is REQUIRED (1-280 characters). No revealMode.',
  },
  cloud: {
    purpose:
      "Word cloud. Each participant submits a short word or phrase; the most common words grow largest.",
    rules: "options: []. correct: null. Title is an open prompt answerable in one or two words.",
  },
  poll: {
    purpose: "Multiple choice poll with no correct answer. Participants pick one option.",
    rules: "options: 2-6 strings (max 100 characters each). correct: null.",
  },
  quiz: {
    purpose: "Multiple choice quiz with one correct answer. Scored and ranked.",
    rules:
      'options: 2-6 strings (max 100 characters each). "correct": zero-based index of the right option (REQUIRED). Optional: competitive (boolean, default true = faster answers score more), showRanking (boolean, default true), revealMode ("live" or "onDone", default "onDone").',
  },
  truefalse: {
    purpose: "True or false statement. Scored and ranked. The title is the statement to judge.",
    rules:
      'options: exactly ["True","False"]. "correct": 0 if the statement is true, 1 if it is false (REQUIRED). Optional competitive, showRanking, revealMode as for quiz.',
  },
  twotruths: {
    purpose:
      "Two truths and a lie. Participants pick the statement that is not true. Scored and ranked.",
    rules:
      'title must be exactly "Pick the one that is not true." options: exactly 3 statements (max 200 characters each). "correct": zero-based index of the false statement (REQUIRED). Optional competitive, showRanking, revealMode as for quiz.',
  },
  ranking: {
    purpose: "Participants drag options into an order from most to least important.",
    rules: "options: 2-6 strings (max 100 characters each). correct: null.",
  },
  slider: {
    purpose: "Participants choose a number on a slider; results show the distribution and average.",
    rules:
      "options: []. correct: null. sliderMin, sliderMax, sliderStep are REQUIRED numbers: sliderMax > sliderMin, sliderStep > 0, and (sliderMax - sliderMin) / sliderStep <= 1000.",
  },
  qna: {
    purpose: "Open Q&A. Participants submit questions and upvote others. Always live.",
    rules: "options: []. correct: null. No revealMode.",
  },
  points100: {
    purpose: "Participants distribute 100 points across the options to show priorities.",
    rules: "options: 2-6 strings (max 100 characters each). correct: null.",
  },
  grid2x2: {
    purpose: "Participants place a dot on a 2x2 grid (e.g. urgency vs impact).",
    rules:
      "options: exactly 4 axis labels in this order: x-axis low, x-axis high, y-axis low, y-axis high (max 40 characters each). correct: null.",
  },
  text: {
    purpose: "Open response. Participants type a free-text answer that the host reads.",
    rules: "options: []. correct: null.",
  },
};

/** Every slide type currently supported by the app (derived from the typed `labels` map). */
export const allKinds = Object.keys(labels) as Kind[];

/** Starter requests shown in the UI so authors see that surveys, quizzes and mixes are all possible. */
export const promptExamples = [
  {
    id: "survey",
    label: "Survey",
    hint: "No right answers. Collect opinions, feelings and ideas.",
    text: "Create a 6-question team retrospective survey. Start with a word cloud about how the sprint felt, then a multiple choice poll on what to improve, a slider for workload (1-10), a ranking of our priorities, and an open response asking what we should change. No right or wrong answers.",
  },
  {
    id: "quiz",
    label: "Quiz",
    hint: "Right answers, scoring and a leaderboard.",
    text: "Create an 8-question general science trivia quiz for adults. Use multiple choice quiz questions, a few true or false statements, and one 'two truths and a lie'. Every question has a correct answer; mix easy and hard.",
  },
  {
    id: "mix",
    label: "Survey + quiz",
    hint: "Combine both in one session.",
    text: "Create a 10-question onboarding session for new hires. Begin with a welcome slide and a word cloud icebreaker, then survey questions about their expectations (poll, slider, open response), then a short quiz of 4 questions checking they understood our company values. End with an open response asking for feedback.",
  },
] as const;

/** Slide types split by whether participants are scored on a correct answer. */
export function kindCategories() {
  const survey = allKinds.filter((k) => k !== "slide" && !canCompete(k));
  const quiz = allKinds.filter((k) => canCompete(k));
  return { survey, quiz };
}

/** The complete system prompt without the user's request. */
export function buildSystemPrompt(): string {
  const { survey, quiz } = kindCategories();
  const list = (kinds: Kind[]) => kinds.map((k) => `"${k}"`).join(", ");
  const types = allKinds
    .map(
      (kind) =>
        `- "${kind}" (${labels[kind]}): ${slideSpecs[kind].purpose}\n  Rules: ${slideSpecs[kind].rules}`,
    )
    .join("\n");
  const example = serializeSession({
    ...newSession("blank"),
    title: "Example session",
    questions: allKinds.map((kind) => newQuestion(kind)),
  });
  return `You generate session files for "Pulse", a live audience-interaction app where a host presents polls, quizzes, word clouds and other interactive slides to participants on their phones. Convert the user's request into ONE valid JSON document that the app can import.

OUTPUT RULES
- Reply with ONLY the raw JSON. No explanations, no comments, no markdown.
- Use double quotes, no trailing commas, no comments. The JSON must stay under 128 KB.
- Do not include ids, responses, results or room codes.

TOP-LEVEL SHAPE
{
  "format": "pulse-session",
  "version": 1,
  "title": string (1-100 characters),
  "theme": "mint" | "peach" | "lilac" | "sky",
  "showQr": boolean (true shows the join QR code on every slide),
  "questions": [ ... 1 to 30 items ... ]
}

EVERY QUESTION HAS
- "type": one of the slide types below
- "title": string (1-200 characters)
- "options": string[] (rules depend on the type)
- "correct": number | null (rules depend on the type)
Other fields depend on the type, as listed below. Only use the fields a type lists.

SLIDE TYPES (${allKinds.length} available)
${types}

SURVEY vs QUIZ (decide from the user's request, and freely combine them in one session)
- SURVEY questions have NO correct answer and collect opinions, feelings or ideas: ${list(survey)}. Always set "correct": null.
- QUIZ questions have ONE correct answer and are scored on a leaderboard: ${list(quiz)}. Always set a valid "correct" index.
- "slide" is neutral and can be used in either kind of session.
- Examples: "How did this sprint feel?" is a survey (cloud/poll/slider). "Which planet has the most moons?" is a quiz. "Run a team retro" => surveys only. "Make a trivia night" => quizzes only. "Onboarding with a knowledge check" => a mix.
- If the user is vague, default to surveys, and add a short quiz only when they mention testing, learning, trivia, knowledge, scoring or competition.

GENERAL GUIDANCE
- Choose the slide types that fit the user's goal; mix types for variety.
- Start with a "slide" welcome slide and end with an open-ended question when it suits the request.
- Write concise, friendly, audience-ready text. Keep every string within its limit.
- For scored types (quiz, truefalse, twotruths) make sure "correct" really points at the right option.

EXAMPLE containing one question of every type (replace the content, follow the structure):
${example}`;
}

/** The text copied to the clipboard: the system prompt plus the user's own request. */
export function buildClipboardPrompt(userPrompt: string): string {
  return `${buildSystemPrompt()}

USER REQUEST
${userPrompt.trim()}

Now output ONLY the JSON for this request.`;
}
