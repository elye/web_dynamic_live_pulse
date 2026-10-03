import { randomInt, randomUUID } from "node:crypto";

export const rooms = new Map();
const kinds = new Set(["slide", "cloud", "poll", "quiz", "truefalse", "twotruths", "ranking", "slider", "qna", "points100", "grid2x2", "text"]);
/** Two truths and a lie always asks the same question. */
export const twoTruthsTitle = "Pick the one that is not true.";

/** Question types players can write themselves (everything that collects a response). */
export const crowdKinds = [...kinds].filter((kind) => kind !== "slide");
const optionKinds = ["poll", "quiz", "truefalse", "twotruths", "ranking", "points100", "grid2x2"];

const hasRevealMode = (type) => type !== "slide" && type !== "qna";
/** Only questions with a correct answer can be competitive. */
const canCompete = (type) => type === "quiz" || type === "truefalse" || type === "twotruths";
/** Questions with a correct answer hide responses until revealed; all others show them live. */
const defaultRevealMode = (type) => (canCompete(type) ? "onDone" : "live");
export const baseScore = 500;
export const speedBonus = 500;
export const speedWindowMs = 20000;

export function validateQuestions(input) {
  if (!Array.isArray(input) || !input.length || input.length > 30)
    throw new Error("Add between 1 and 30 questions.");
  return input.map((raw) => {
    const question =
      raw?.type === "twotruths" ? { ...raw, title: twoTruthsTitle } : raw;
    if (
      !kinds.has(question.type) ||
      typeof question.title !== "string" ||
      !question.title.trim() ||
      question.title.length > 200
    )
      throw new Error("Each question needs a title (up to 200 characters).");
    if (question.type === "slide" && (typeof question.description !== "string" || !question.description.trim() || question.description.length > 280))
      throw new Error("Add a description with 1 to 280 characters.");
    const options = question.type !== "slide" && Array.isArray(question.options)
      ? question.options.map((option) => String(option).trim())
      : [];
    if (
      question.type === "truefalse" &&
      (options.length !== 2 ||
        options.some((option) => !option || option.length > 100))
    )
      throw new Error("A true-or-false question needs exactly 2 answer options.");
    if (
      question.type === "twotruths" &&
      (options.length !== 3 ||
        options.some((option) => !option || option.length > 200))
    )
      throw new Error("Two truths and a lie needs exactly 3 statements, up to 200 characters each.");
    if (
      question.type === "grid2x2" &&
      (options.length !== 4 ||
        options.some((option) => !option || option.length > 40))
    )
      throw new Error("A 2x2 grid question needs exactly 4 axis labels.");
    if (
      ["poll", "quiz", "ranking", "points100"].includes(question.type) &&
      (options.length < 2 ||
        options.length > 6 ||
        options.some((option) => !option || option.length > 100))
    )
      throw new Error("Add 2 to 6 answer options, up to 100 characters each.");
    if (
      canCompete(question.type) &&
      (!Number.isInteger(question.correct) ||
        question.correct < 0 ||
        question.correct >= options.length)
    )
      throw new Error("Choose the correct answer.");
    if (
      question.type === "slider" &&
      (typeof question.sliderMin !== "number" ||
        typeof question.sliderMax !== "number" ||
        typeof question.sliderStep !== "number" ||
        !Number.isFinite(question.sliderMin) ||
        !Number.isFinite(question.sliderMax) ||
        !Number.isFinite(question.sliderStep) ||
        question.sliderStep <= 0 ||
        question.sliderMax <= question.sliderMin ||
        (question.sliderMax - question.sliderMin) / question.sliderStep > 1000)
    )
      throw new Error("Add a valid slider minimum, maximum, and step.");
    if (
      hasRevealMode(question.type) &&
      question.revealMode !== undefined &&
      !(question.revealMode === "live" || question.revealMode === "onDone")
    )
      throw new Error('Reveal mode must be "live" or "onDone".');
    if (
      question.competitive !== undefined &&
      (typeof question.competitive !== "boolean" ||
        (question.competitive && !canCompete(question.type)))
    )
      throw new Error("Only quiz, true-or-false and two-truths questions can be competitive.");
    if (question.showRanking !== undefined && typeof question.showRanking !== "boolean")
      throw new Error("Show ranking must be true or false.");
    return {
      id: randomUUID(),
      type: question.type,
      title: question.title.trim(),
      ...(hasRevealMode(question.type)
        ? { revealMode: question.revealMode ?? defaultRevealMode(question.type) }
        : {}),
      ...(canCompete(question.type)
        ? { competitive: question.competitive !== false, showRanking: question.showRanking !== false }
        : {}),
      ...(question.type === "slide" ? { description: question.description.trim() } : {}),
      ...(question.type === "slider"
        ? { sliderMin: question.sliderMin, sliderMax: question.sliderMax, sliderStep: question.sliderStep }
        : {}),
      options,
      correct: canCompete(question.type) ? question.correct : null,
    };
  });
}

/**
 * With `crowdKind`, players write the questions: the room starts with none, collects one
 * question of that type from each player, then plays them in random order.
 */
export function createRoom(title, questions, crowdKind) {
  if (rooms.size >= 1000)
    throw new Error("The server is full. Please try again later.");
  if (crowdKind !== undefined && !crowdKinds.includes(crowdKind))
    throw new Error("Choose a question type for players to write.");
  let code;
  do {
    code = String(randomInt(100000, 1000000));
  } while (rooms.has(code));
  const room = {
    code,
    hostToken: randomUUID(),
    title: String(title || "Untitled session")
      .trim()
      .slice(0, 100),
    questions: crowdKind ? [] : validateQuestions(questions),
    crowd: crowdKind
      ? { kind: crowdKind, authoring: false, pending: new Map() }
      : null,
    /** Question id -> token of the player who wrote it. */
    authors: new Map(),
    active: 0,
    started: false,
    accepting: false,
    revealed: false,
    ranking: false,
    podium: false,
    ended: false,
    hearts: 0,
    participants: new Map(),
    votes: new Map(),
    upvotes: new Map(),
    openedAt: new Map(),
    answeredAt: new Map(),
    createdAt: Date.now(),
  };
  room.questions.forEach((question) => {
    room.answeredAt.set(question.id, new Map());
    room.votes.set(question.id, new Map());
    room.upvotes.set(question.id, new Map());
  });
  rooms.set(code, room);
  return room;
}

export function getRoom(code) {
  const room = rooms.get(String(code));
  if (!room)
    throw new Error(
      "Room not found. Check your code or ask your host for a new one.",
    );
  return room;
}

export function authorize(room, token) {
  if (room.hostToken !== token) throw new Error("Only the host can do that.");
}

export function joinRoom(room, name, token) {
  if (token && room.participants.has(token)) return token;
  if (room.ended) throw new Error("This session has ended.");
  if (room.participants.size >= 500) throw new Error("This room is full.");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 24)
    throw new Error("Enter a name with 1 to 24 characters.");
  const memberToken = randomUUID();
  room.participants.set(memberToken, { name: name.trim() });
  return memberToken;
}

/** Stores (or replaces) a player's own question while the host is collecting them. */
export function submitAuthored(room, token, input) {
  if (!room.participants.has(token))
    throw new Error("Join the room before writing a question.");
  if (!room.crowd)
    throw new Error("This session does not use player-made questions.");
  if (room.ended || room.started)
    throw new Error("The questions are already in play.");
  if (!room.crowd.authoring)
    throw new Error("Wait for the host to open question writing.");
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Write your question first.");
  const kind = room.crowd.kind;
  const [question] = validateQuestions([
    {
      type: kind,
      title: input.title,
      options: optionKinds.includes(kind) ? input.options : [],
      correct: input.correct,
      sliderMin: input.sliderMin,
      sliderMax: input.sliderMax,
      sliderStep: input.sliderStep,
    },
  ]);
  room.crowd.pending.set(token, question);
}

/** Turns the collected questions into the playable list, shuffled, each tagged with its author's name. */
function buildCrowdQuestions(room) {
  const entries = [...room.crowd.pending];
  for (let index = entries.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [entries[index], entries[other]] = [entries[other], entries[index]];
  }
  room.questions = entries.map(([token, question]) => {
    room.authors.set(question.id, token);
    room.answeredAt.set(question.id, new Map());
    room.votes.set(question.id, new Map());
    room.upvotes.set(question.id, new Map());
    return { ...question, author: room.participants.get(token).name };
  });
  room.crowd.pending.clear();
}

export function submitVote(room, token, questionId, value, now = Date.now()) {
  if (!room.participants.has(token))
    throw new Error("Join the room before responding.");
  const question = room.questions[room.active];
  if (question.type === "slide") throw new Error("This slide does not accept responses.");
  if (!room.started || room.ended || !room.accepting || question.id !== questionId)
    throw new Error("This question is no longer accepting responses.");
  const votes = room.votes.get(question.id);
  if (votes.has(token)) throw new Error("Your response is already in.");
  if (question.type === "poll" || canCompete(question.type)) {
    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value >= question.options.length
    )
      throw new Error("Choose one of the available options.");
  } else if (question.type === "ranking") {
    const order = question.options.map((_, index) => index);
    if (
      !Array.isArray(value) ||
      value.length !== question.options.length ||
      !order.every((index) => value.includes(index))
    )
      throw new Error("Rank every option exactly once.");
  } else if (question.type === "points100") {
    if (
      !Array.isArray(value) ||
      value.length !== question.options.length ||
      value.some((points) => !Number.isInteger(points) || points < 0) ||
      value.reduce((sum, points) => sum + points, 0) !== 100
    )
      throw new Error("Allocate exactly 100 points across the options.");
  } else if (question.type === "slider") {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < question.sliderMin ||
      value > question.sliderMax ||
      Math.abs(
        Math.round((value - question.sliderMin) / question.sliderStep) *
          question.sliderStep +
          question.sliderMin -
          value,
      ) > 1e-9
    )
      throw new Error("Choose a value on the slider.");
  } else if (question.type === "grid2x2") {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      typeof value.x !== "number" ||
      typeof value.y !== "number" ||
      !Number.isFinite(value.x) ||
      !Number.isFinite(value.y) ||
      value.x < -100 ||
      value.x > 100 ||
      value.y < -100 ||
      value.y > 100
    )
      throw new Error("Place a point on the grid between -100 and 100.");
    value = { x: value.x, y: value.y };
  } else {
    if (
      typeof value !== "string" ||
      !value.trim() ||
      value.trim().length > (question.type === "cloud" ? 30 : 280)
    )
      throw new Error("Enter a response within the character limit.");
    value = value.trim();
  }
  votes.set(token, value);
  room.answeredAt.get(question.id).set(token, now);
}

/** Remembers when a question first started accepting answers; later resumes keep the original time. */
function markOpened(room, now) {
  const question = room.questions[room.active];
  if (room.accepting && !room.openedAt.has(question.id))
    room.openedAt.set(question.id, now);
}

/**
 * 0 for a wrong or missing answer. Regular quiz and true-or-false questions award a flat 1000.
 * Competitive ones award 500 plus up to 500 for answering quickly (linear over 20 seconds).
 */
export function scoreAnswer(room, question, token) {
  if (
    !canCompete(question.type) ||
    room.authors.get(question.id) === token ||
    room.votes.get(question.id).get(token) !== question.correct
  )
    return 0;
  if (!question.competitive) return 1000;
  const opened = room.openedAt.get(question.id);
  const answered = room.answeredAt.get(question.id).get(token);
  const elapsed =
    opened === undefined || answered === undefined
      ? speedWindowMs
      : Math.max(0, answered - opened);
  return (
    baseScore +
    Math.round(speedBonus * Math.max(0, 1 - elapsed / speedWindowMs))
  );
}

export function submitUpvote(room, token, questionId, entrantToken) {
  if (!room.participants.has(token))
    throw new Error("Join the room before responding.");
  const question = room.questions[room.active];
  if (question.type !== "qna")
    throw new Error("This question does not accept upvotes.");
  if (!room.started || room.ended || !room.accepting || question.id !== questionId)
    throw new Error("This question is no longer accepting responses.");
  const votes = room.votes.get(question.id);
  if (!votes.has(entrantToken))
    throw new Error("That question no longer exists.");
  const upvotes = room.upvotes.get(question.id);
  let voters = upvotes.get(entrantToken);
  if (!voters) {
    voters = new Set();
    upvotes.set(entrantToken, voters);
  }
  if (voters.has(token)) {
    voters.delete(token);
    return false;
  }
  voters.add(token);
  return true;
}

/** Reactions a participant can send; the host sees each as a floating emoji. */
export const reactionKinds = ["heart", "clap", "smile", "star", "tada"];

const heartGapMs = 200;

/** Returns true when the heart should be shown to the host; false when throttled or the session is over. */
export function reactRoom(room, token, now = Date.now()) {
  const member = room.participants.get(token);
  if (!member) throw new Error("Join the room before reacting.");
  if (room.ended) return false;
  if (member.lastHeart && now - member.lastHeart < heartGapMs) return false;
  member.lastHeart = now;
  room.hearts = (room.hearts || 0) + 1;
  return true;
}

export function controlRoom(room, token, action, index, now = Date.now()) {
  authorize(room, token);
  if (room.ended)
    throw new Error(
      "This session has ended. Start a new session to play again.",
    );
  if (!room.started && !["start", "end", "collect"].includes(action))
    throw new Error("Start the questions before changing or revealing them.");
  if (action === "collect") {
    if (!room.crowd)
      throw new Error("This session does not use player-made questions.");
    if (room.started) throw new Error("The questions have already started.");
    if (room.crowd.authoring)
      throw new Error("Players are already writing their questions.");
    if (!room.participants.size)
      throw new Error("Wait for players to join first.");
    room.crowd.authoring = true;
  } else if (action === "start") {
    if (room.started) throw new Error("The questions have already started.");
    if (room.crowd) {
      if (!room.crowd.authoring)
        throw new Error("Ask players to write their questions first.");
      if (!room.crowd.pending.size)
        throw new Error("Wait for at least one player to submit a question.");
      buildCrowdQuestions(room);
    }
    room.started = true;
    room.active = 0;
    room.accepting = room.questions[room.active].type !== "slide";
    markOpened(room, now);
  } else if (action === "select") {
    if (!Number.isInteger(index) || index < 0 || index >= room.questions.length)
      throw new Error("Question not found.");
    room.active = index;
    room.accepting = room.questions[room.active].type !== "slide";
    room.revealed = false;
    room.ranking = false;
    room.podium = false;
    markOpened(room, now);
  } else if (action === "toggle") {
    if (room.questions[room.active].type === "slide") throw new Error("This slide does not accept responses.");
    room.accepting = !room.accepting;
    if (room.accepting) {
      room.revealed = false;
      room.ranking = false;
      room.podium = false;
    }
    markOpened(room, now);
  } else if (action === "reveal") {
    if (room.questions[room.active].type === "slide") throw new Error("This slide has no results to reveal.");
    room.revealed = true;
    room.accepting = false;
  } else if (action === "ranking") {
    if (!room.questions.some((question) => canCompete(question.type)))
      throw new Error("This session has no questions with answers to rank.");
    room.revealed = true;
    room.accepting = false;
    room.ranking = true;
    room.podium = false;
  } else if (action === "podium") {
    if (!room.questions.some((question) => canCompete(question.type)))
      throw new Error("This session has no questions with answers to rank.");
    room.revealed = true;
    room.accepting = false;
    room.ranking = false;
    room.podium = true;
  } else if (action === "end") {
    room.ended = true;
    room.accepting = false;
    room.revealed = true;
  } else throw new Error("Unknown room action.");
}

function results(room, question) {
  const values = [...room.votes.get(question.id).values()];
  if (question.type === "poll" || canCompete(question.type))
    return question.options.map((text, index) => ({
      text,
      count: values.filter((value) => value === index).length,
    }));
  if (question.type === "ranking") {
    const points = new Array(question.options.length).fill(0);
    for (const value of values)
      value.forEach((optionIndex, position) => {
        points[optionIndex] += question.options.length - position;
      });
    return question.options
      .map((text, index) => ({ text, count: points[index] }))
      .sort((first, second) => second.count - first.count);
  }
  if (question.type === "points100") {
    const points = new Array(question.options.length).fill(0);
    for (const value of values)
      value.forEach((allocation, index) => {
        points[index] += allocation;
      });
    return question.options
      .map((text, index) => ({ text, count: points[index] }))
      .sort((first, second) => second.count - first.count);
  }
  if (question.type === "slider") {
    const average = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
    const distribution = new Map();
    for (const value of values)
      distribution.set(value, (distribution.get(value) || 0) + 1);
    return [
      { text: `Average: ${Math.round(average * 100) / 100}`, count: values.length },
      ...[...distribution]
        .map(([value, count]) => ({ text: String(value), count }))
        .sort((first, second) => Number(first.text) - Number(second.text)),
    ];
  }
  if (question.type === "qna") {
    const upvotes = room.upvotes.get(question.id);
    return [...room.votes.get(question.id)]
      .map(([entrantToken, text]) => ({
        id: entrantToken,
        text,
        count: upvotes.get(entrantToken)?.size || 0,
      }))
      .sort((first, second) => second.count - first.count);
  }
  if (question.type === "grid2x2") {
    const points = values;
    const averageX = points.length
      ? points.reduce((sum, point) => sum + point.x, 0) / points.length
      : 0;
    const averageY = points.length
      ? points.reduce((sum, point) => sum + point.y, 0) / points.length
      : 0;
    return [
      {
        text: `Average: ${Math.round(averageX * 10) / 10},${Math.round(averageY * 10) / 10}`,
        count: points.length,
      },
      ...points.map((point) => ({ text: `${point.x},${point.y}`, count: 1 })),
    ];
  }
  const counts = new Map();
  for (const value of values) {
    const key = question.type === "cloud" ? value.toLocaleLowerCase() : value;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts]
    .map(([text, count]) => ({ text, count }))
    .sort((first, second) => second.count - first.count);
}

export function snapshot(room, host = false) {
  const visible = host || room.revealed;
  const leaderboard = visible
    ? [...room.participants]
        .map(([token, member]) => ({
          name: member.name,
          score: room.questions.reduce(
            (score, question) => score + scoreAnswer(room, question, token),
            0,
          ),
        }))
        .sort((first, second) => second.score - first.score)
        .slice(0, 10)
    : [];
  return {
    code: room.code,
    title: room.title,
    active: room.active,
    started: room.started,
    accepting: room.accepting,
    revealed: room.revealed,
    ranking: room.ranking,
    podium: room.podium,
    ended: room.ended,
    participants: room.participants.size,
    participantNames: [...room.participants.values()].map((member) => member.name),
    competitive: room.questions.some((question) => question.competitive === true),
    scored: room.questions.some((question) => canCompete(question.type)),
    crowd: room.crowd
      ? {
          kind: room.crowd.kind,
          authoring: room.crowd.authoring,
          submitted: room.started
            ? room.questions.length
            : room.crowd.pending.size,
          waiting: room.started
            ? []
            : [...room.participants]
                .filter(([token]) => !room.crowd.pending.has(token))
                .map(([, member]) => member.name),
        }
      : null,
    leaderboard,
    questions: room.questions.map((question, index) => ({
      ...question,
      correct:
        host || (room.revealed && (index === room.active || room.ended))
          ? question.correct
          : null,
      responses: room.votes.get(question.id).size,
      results:
        host ||
        question.type === "qna" ||
        (question.revealMode === "live" && index === room.active) ||
        (room.revealed && (index === room.active || room.ended))
          ? results(room, question)
          : [],
    })),
  };
}
