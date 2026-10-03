export type Kind =
  | "slide"
  | "cloud"
  | "poll"
  | "quiz"
  | "truefalse"
  | "ranking"
  | "slider"
  | "qna"
  | "points100"
  | "grid2x2"
  | "text";
export type RevealMode = "live" | "onDone";
export const revealModes: RevealMode[] = ["live", "onDone"];
/** Slides collect nothing and Q&A is always live, so neither has a reveal mode. */
export function hasRevealMode(type: Kind) {
  return type !== "slide" && type !== "qna";
}
/** Only questions with a correct answer can be scored and ranked. */
export function canCompete(type: Kind) {
  return type === "quiz" || type === "truefalse";
}
/** Questions with an answer hide responses until the host reveals them; all others show them live. */
export function defaultRevealMode(type: Kind): RevealMode {
  return canCompete(type) ? "onDone" : "live";
}
export type Question = {
  id: string;
  type: Kind;
  title: string;
  description?: string;
  options: string[];
  correct: number | null;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  revealMode?: RevealMode;
  competitive?: boolean;
  /** Show the top-10 ranking after this question's results (answered questions only). */
  showRanking?: boolean;
  /** Name of the player who wrote this question (player-made sessions only). */
  author?: string;
  responses?: number;
  results?: { text: string; count: number; id?: string }[];
};
export type Session = {
  id: string;
  title: string;
  theme: string;
  /** Show the join QR code in the corner of every live slide (default on). */
  showQr?: boolean;
  questions: Question[];
  updated: number;
  hostedRooms?: { code: string; token: string }[];
};
export type Room = {
  code: string;
  title: string;
  active: number;
  started: boolean;
  accepting: boolean;
  revealed: boolean;
  /** The host is showing the top-10 ranking. */
  ranking: boolean;
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
  leaderboard: { name: string; score: number }[];
};
export const labels: Record<Kind, string> = {
  slide: "Title & description",
  cloud: "Word cloud",
  poll: "Multiple choice",
  quiz: "Quiz",
  truefalse: "True or false",
  ranking: "Ranking",
  slider: "Slider",
  qna: "Q&A",
  points100: "100 Points",
  grid2x2: "2x2 Grid",
  text: "Open response",
};

export function createId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

export function newQuestion(type: Kind): Question {
  return {
    id: createId(),
    type,
    title: {
      cloud: "How are you feeling in one word?",
      poll: "What should we focus on next?",
      quiz: "Which planet has the most moons?",
      truefalse: "Octopuses have three hearts.",
      ranking: "Rank these from most to least important",
      slider: "How many hours a day do you spend in meetings?",
      qna: "Ask us anything",
      points100: "Allocate 100 points across what matters most to you",
      grid2x2: "Place your priority on the grid",
      text: "What is one thing we could do better?",
      slide: "A quick word before we dive in",
    }[type],
    ...(type === "slide"
      ? {
          description:
            "Take a breath, get comfortable, and get ready to share.",
        }
      : {}),
    ...(type === "slider"
      ? { sliderMin: 0, sliderMax: 10, sliderStep: 1 }
      : {}),
    ...(hasRevealMode(type) ? { revealMode: defaultRevealMode(type) } : {}),
    ...(canCompete(type) ? { competitive: true, showRanking: true } : {}),
    options:
      type === "quiz"
        ? ["Jupiter", "Saturn", "Neptune", "Mars"]
        : type === "poll"
          ? [
              "Fresh ideas",
              "Team connection",
              "Learning something new",
              "Making things happen",
            ]
          : type === "truefalse"
            ? ["True", "False"]
            : type === "ranking"
              ? ["Speed", "Quality", "Cost", "Communication"]
              : type === "points100"
                ? ["Design", "Performance", "Reliability", "Cost"]
                : type === "grid2x2"
                  ? ["Low urgency", "High urgency", "Low impact", "High impact"]
                  : [],
    correct: type === "quiz" ? 1 : type === "truefalse" ? 0 : null,
  };
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
      questions: session.questions.map(
        ({
          type,
          title,
          options,
          correct,
          description,
          sliderMin,
          sliderMax,
          sliderStep,
          revealMode,
          competitive,
          showRanking,
        }) => ({
          type,
          title,
          options,
          correct,
          ...(canCompete(type)
            ? {
                competitive: competitive !== false,
                showRanking: showRanking !== false,
              }
            : {}),
          ...(type === "slide" ? { description } : {}),
          ...(type === "slider" ? { sliderMin, sliderMax, sliderStep } : {}),
          ...(hasRevealMode(type)
            ? { revealMode: revealMode ?? defaultRevealMode(type) }
            : {}),
        }),
      ),
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
  if (
    !Array.isArray(data.questions) ||
    !data.questions.length ||
    data.questions.length > 30
  )
    throw new Error("A session must contain 1 to 30 questions.");
  const questions: Question[] = data.questions.map(
    (item: unknown, index: number) => {
      const prefix = `Question ${index + 1}: `;
      if (!item || typeof item !== "object" || Array.isArray(item))
        throw new Error(prefix + "expected a question object.");
      const question = item as Record<string, unknown>;
      if (
        typeof question.type !== "string" ||
        !(
          [
            "slide",
            "cloud",
            "poll",
            "quiz",
            "truefalse",
            "ranking",
            "slider",
            "qna",
            "points100",
            "grid2x2",
            "text",
          ] as string[]
        ).includes(question.type)
      )
        throw new Error(prefix + "unsupported question type.");
      if (
        typeof question.title !== "string" ||
        !question.title.trim() ||
        question.title.length > 200
      )
        throw new Error(prefix + "title must contain 1 to 200 characters.");
      if (
        question.type === "slide" &&
        (typeof question.description !== "string" ||
          !question.description.trim() ||
          question.description.length > 280)
      )
        throw new Error(
          prefix + "add a description with 1 to 280 characters.",
        );
      const options = question.options;
      if (
        !Array.isArray(options) ||
        options.some((option) => typeof option !== "string")
      )
        throw new Error(prefix + "options must be an array of strings.");
      if (question.type === "truefalse") {
        if (
          options.length !== 2 ||
          options.some(
            (option: string) => !option.trim() || option.length > 100,
          )
        )
          throw new Error(prefix + "add exactly 2 nonempty options.");
      } else if (question.type === "grid2x2") {
        if (
          options.length !== 4 ||
          options.some(
            (option: string) => !option.trim() || option.length > 40,
          )
        )
          throw new Error(
            prefix +
              "add exactly 4 axis labels (x-low, x-high, y-low, y-high), up to 40 characters each.",
          );
      } else if (["poll", "quiz", "ranking", "points100"].includes(question.type)) {
        if (
          options.length < 2 ||
          options.length > 6 ||
          options.some(
            (option: string) => !option.trim() || option.length > 100,
          )
        )
          throw new Error(
            prefix + "add 2 to 6 nonempty options, up to 100 characters each.",
          );
      } else if (options.length)
        throw new Error(prefix + "this question type must have empty options.");
      if (
        ["quiz", "truefalse"].includes(question.type) &&
        (typeof question.correct !== "number" ||
          !Number.isInteger(question.correct) ||
          question.correct < 0 ||
          question.correct >= options.length)
      )
        throw new Error(
          prefix + "correct must be a valid zero-based option index.",
        );
      if (question.type === "slider") {
        const { sliderMin, sliderMax, sliderStep } = question;
        if (
          typeof sliderMin !== "number" ||
          typeof sliderMax !== "number" ||
          typeof sliderStep !== "number" ||
          !Number.isFinite(sliderMin) ||
          !Number.isFinite(sliderMax) ||
          !Number.isFinite(sliderStep) ||
          sliderStep <= 0 ||
          sliderMax <= sliderMin ||
          (sliderMax - sliderMin) / sliderStep > 1000
        )
          throw new Error(
            prefix + "add a valid slider minimum, maximum, and step.",
          );
      }
      if (
        hasRevealMode(question.type as Kind) &&
        question.revealMode !== undefined &&
        !(revealModes as unknown[]).includes(question.revealMode)
      )
        throw new Error(prefix + 'revealMode must be "live" or "onDone".');
      if (
        question.competitive !== undefined &&
        (typeof question.competitive !== "boolean" ||
          (question.competitive && !canCompete(question.type as Kind)))
      )
        throw new Error(
          prefix + "only quiz and truefalse questions can set competitive to true.",
        );
      if (
        question.showRanking !== undefined &&
        typeof question.showRanking !== "boolean"
      )
        throw new Error(prefix + "showRanking must be true or false.");
      return {
        id: createId(),
        type: question.type as Kind,
        title: question.title.trim(),
        ...(canCompete(question.type as Kind)
          ? {
              competitive: question.competitive !== false,
              showRanking: question.showRanking !== false,
            }
          : {}),
        ...(question.type === "slide"
          ? { description: (question.description as string).trim() }
          : {}),
        ...(question.type === "slider"
          ? {
              sliderMin: question.sliderMin as number,
              sliderMax: question.sliderMax as number,
              sliderStep: question.sliderStep as number,
            }
          : {}),
        ...(hasRevealMode(question.type as Kind)
          ? {
              revealMode:
                (question.revealMode as RevealMode) ??
                defaultRevealMode(question.type as Kind),
            }
          : {}),
        options: options.map((option: string) => option.trim()),
        correct: ["quiz", "truefalse"].includes(question.type)
          ? (question.correct as number)
          : null,
      };
    },
  );
  return {
    id: createId(),
    title: data.title.trim(),
    theme: data.theme,
    showQr: data.showQr !== false,
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
        result.text,
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
