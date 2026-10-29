import {
  createQuestion,
  definitionOf,
  kinds,
  parseQuestion,
  serializeQuestion,
  type Kind,
  type Question,
  type RevealMode,
} from "./questions/index.ts";

export {
  canCompete,
  defaultRevealMode,
  defaultVoteColors,
  hasRevealMode,
  isVoteColorsValid,
  manyOptionLabels,
  manyOptionLength,
  manyOptionsGrid,
  manyOptionsMax,
  manyOptionsMaxColumns,
  manyOptionsMaxRows,
  othersLabel,
  twoTruthsTitle,
  voteColor,
  voteColorsMax,
} from "./questions/index.ts";
export type {
  Kind,
  PollDisplay,
  Question,
  RevealMode,
  VoteColor,
} from "./questions/index.ts";

export const revealModes: RevealMode[] = ["live", "onDone"];

export type Session = {
  id: string;
  title: string;
  theme: string;
  /** Show the join QR code in the corner of every live slide (default on). */
  showQr?: boolean;
  /** Present slides with a dark palette. */
  dark?: boolean;
  /** Generate name-like participant labels instead of asking for names. */
  nameless?: boolean;
  questions: Question[];
  updated: number;
  hostedRooms?: { code: string; token: string }[];
};
export type Room = {
  code: string;
  title: string;
  /** Participants receive generated names and the welcome lobby shows only a count. */
  nameless: boolean;
  active: number;
  started: boolean;
  accepting: boolean;
  revealed: boolean;
  /** The host has hidden the live responses of an on-the-fly question. */
  hidden?: boolean;
  /** The host is showing the top-10 ranking. */
  ranking: boolean;
  /** The host is holding the room just before revealing the final podium. */
  suspense: boolean;
  /** The host is showing the final podium. */
  podium: boolean;
  ended: boolean;
  participants: number;
  participantNames: string[];
  questions: Question[];
  competitive: boolean;
  /** At least one question has a correct answer, so players earn points. */
  scored: boolean;
  /** Set when players write the questions themselves. */
  crowd: {
    kind: Kind;
    /** The host has opened question writing. */
    authoring: boolean;
    /** Questions submitted so far (or in play, once started). */
    submitted: number;
    /** Names of players who have not submitted yet. */
    waiting: string[];
  } | null;
  leaderboard: { name: string; score: number; generated: boolean }[];
  /** The asking player's own place (participants only), even beyond the top 10. */
  me?: {
    rank: number;
    total: number;
    name: string;
    score: number;
    generated: boolean;
  } | null;
};
export const labels = Object.fromEntries(
  kinds.map((kind) => [kind, definitionOf(kind).label]),
) as Record<Kind, string>;

export function createId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

export function newQuestion(type: Kind): Question {
  return createQuestion(type, createId);
}

export function newSession(template = "checkin"): Session {
  const questions =
    template === "trivia"
      ? [
          { ...newQuestion("quiz"), competitive: true },
          {
            ...newQuestion("quiz"),
            title: "How many hearts does an octopus have?",
            options: ["One", "Two", "Three", "Four"],
            correct: 2,
            competitive: true,
          },
          newQuestion("cloud"),
        ]
      : template === "retro"
        ? [
            {
              ...newQuestion("cloud"),
              title: "Describe this sprint in one word.",
            },
            { ...newQuestion("text"), title: "What went really well?" },
            newQuestion("poll"),
            newQuestion("text"),
          ]
        : template === "blank"
          ? [newQuestion("cloud")]
          : [
              newQuestion("cloud"),
              newQuestion("poll"),
              newQuestion("quiz"),
              newQuestion("text"),
            ];
  return {
    id: createId(),
    title:
      {
        checkin: "Team check-in",
        trivia: "The big team quiz",
        retro: "Sprint retrospective",
        blank: "Untitled session",
      }[template] || "Team check-in",
    theme: "mint",
    questions,
    updated: Date.now(),
  };
}

export function readStored<Value>(key: string, fallback: Value): Value {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function serializeSession(session: Session): string {
  return JSON.stringify(
    {
      format: "pulse-session",
      version: 1,
      title: session.title,
      theme: session.theme,
      showQr: session.showQr !== false,
      dark: session.dark === true,
      nameless: session.nameless === true,
      questions: session.questions.map(serializeQuestion),
    },
    null,
    2,
  );
}

export function importSession(json: string): Session {
  if (new Blob([json]).size > 128 * 1024)
    throw new Error("JSON must be smaller than 128 KB.");
  let input: unknown;
  try {
    input = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON. Check the file or pasted text.");
  }
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Expected a Pulse session object.");
  const data = input as Record<string, unknown>;
  if (data.format !== "pulse-session" || data.version !== 1)
    throw new Error(
      "Use a Pulse session export with format pulse-session and version 1.",
    );
  if (
    typeof data.title !== "string" ||
    !data.title.trim() ||
    data.title.length > 100
  )
    throw new Error("Session title must contain 1 to 100 characters.");
  if (
    typeof data.theme !== "string" ||
    !["mint", "peach", "lilac", "sky"].includes(data.theme)
  )
    throw new Error("Choose a supported theme: mint, peach, lilac, or sky.");
  if (data.showQr !== undefined && typeof data.showQr !== "boolean")
    throw new Error("showQr must be true or false.");
  if (data.dark !== undefined && typeof data.dark !== "boolean")
    throw new Error("dark must be true or false.");
  if (data.nameless !== undefined && typeof data.nameless !== "boolean")
    throw new Error("nameless must be true or false.");
  if (
    !Array.isArray(data.questions) ||
    !data.questions.length ||
    data.questions.length > 30
  )
    throw new Error("A session must contain 1 to 30 questions.");
  const questions: Question[] = data.questions.map(
    (item: unknown, index: number) => {
      try {
        return parseQuestion(item, { newId: createId });
      } catch (error) {
        const message = (error as Error).message;
        throw new Error(
          `Question ${index + 1}: ${message.charAt(0).toLowerCase()}${message.slice(1)}`,
        );
      }
    },
  );
  return {
    id: createId(),
    title: data.title.trim(),
    theme: data.theme,
    showQr: data.showQr !== false,
    dark: data.dark === true,
    nameless: data.nameless === true,
    questions,
    updated: Date.now(),
  };
}

export function exportSession(session: Session) {
  const url = URL.createObjectURL(
    new Blob([serializeSession(session)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${
    session.title
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "session"
  }.pulse.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function exportResults(room: Room) {
  const rows: (string | number)[][] = [
    ["Session", "Question", "Type", "Response", "Count"],
  ];
  room.questions.forEach((question) =>
    (question.results || []).forEach((result) =>
      rows.push([
        room.title,
        question.title,
        labels[question.type],
        result.target ? `For ${result.target}: ${result.text}` : result.text,
        result.count,
      ]),
    ),
  );
  const csv = rows
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(value)
              .replace(/^[=+@-]/, "'$&")
              .replaceAll('"', '""')}"`,
        )
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pulse-${room.code}-results.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
