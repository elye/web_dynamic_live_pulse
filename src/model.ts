export type Kind = "cloud" | "poll" | "quiz" | "text";
export type Question = {
  id: string;
  type: Kind;
  title: string;
  options: string[];
  correct: number | null;
  responses?: number;
  results?: { text: string; count: number }[];
};
export type Session = {
  id: string;
  title: string;
  theme: string;
  questions: Question[];
  updated: number;
  hostedRooms?: { code: string; token: string }[];
};
export type Room = {
  code: string;
  title: string;
  active: number;
  accepting: boolean;
  revealed: boolean;
  ended: boolean;
  participants: number;
  questions: Question[];
  leaderboard: { name: string; score: number }[];
};
export const labels: Record<Kind, string> = {
  cloud: "Word cloud",
  poll: "Multiple choice",
  quiz: "Quiz",
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
      text: "What is one thing we could do better?",
    }[type],
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
          : [],
    correct: type === "quiz" ? 1 : null,
  };
}

export function newSession(template = "checkin"): Session {
  const questions =
    template === "trivia"
      ? [
          newQuestion("quiz"),
          {
            ...newQuestion("quiz"),
            title: "How many hearts does an octopus have?",
            options: ["One", "Two", "Three", "Four"],
            correct: 2,
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
      questions: session.questions.map(({ type, title, options, correct }) => ({
        type,
        title,
        options,
        correct,
      })),
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
        !["cloud", "poll", "quiz", "text"].includes(question.type)
      )
        throw new Error(prefix + "unsupported question type.");
      if (
        typeof question.title !== "string" ||
        !question.title.trim() ||
        question.title.length > 200
      )
        throw new Error(prefix + "title must contain 1 to 200 characters.");
      const options = question.options;
      if (
        !Array.isArray(options) ||
        options.some((option) => typeof option !== "string")
      )
        throw new Error(prefix + "options must be an array of strings.");
      if (["poll", "quiz"].includes(question.type)) {
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
        question.type === "quiz" &&
        (typeof question.correct !== "number" ||
          !Number.isInteger(question.correct) ||
          question.correct < 0 ||
          question.correct >= options.length)
      )
        throw new Error(
          prefix + "correct must be a valid zero-based option index.",
        );
      return {
        id: createId(),
        type: question.type as Kind,
        title: question.title.trim(),
        options: options.map((option: string) => option.trim()),
        correct: question.type === "quiz" ? (question.correct as number) : null,
      };
    },
  );
  return {
    id: createId(),
    title: data.title.trim(),
    theme: data.theme,
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
