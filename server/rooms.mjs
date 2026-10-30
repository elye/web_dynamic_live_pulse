import { randomInt, randomUUID } from "node:crypto";
import {
  aggregateResults,
  authoredQuestion,
  canCompete,
  concealedFields,
  hasRevealMode,
  holdsSeveralSubmissions,
  kinds,
  parseAnswer,
  parseQuestion,
  scoreShare,
  submissionLimit,
  traitsOf,
} from "../src/questions/index.ts";

export { manyOptionLabels, twoTruthsTitle } from "../src/questions/index.ts";

export const rooms = new Map();

/** Question types players can write themselves (everything that collects a response). */
export const crowdKinds = kinds.filter(
  (kind) => traitsOf(kind).playerAuthorable,
);

// Nameless rooms still need stable labels for peer praise, authored questions,
// and the leaderboard. Combining two name-like words gives us many more
// choices than the room's 500-person capacity without exposing a real name.
const generatedFirstNames = [
  "Ava",
  "Mia",
  "Zoe",
  "Emma",
  "Maya",
  "Nora",
  "Lily",
  "Isla",
  "Ruby",
  "Ivy",
  "Ella",
  "Aria",
  "Leah",
  "Lucy",
  "Clara",
  "Alice",
  "Grace",
  "Sophie",
  "Chloe",
  "Elena",
  "Nina",
  "Sadie",
  "Cora",
  "Eva",
  "Anna",
  "Rose",
  "June",
  "Wren",
  "Theo",
  "Leo",
  "Luca",
  "Noah",
  "Eli",
  "Milo",
  "Owen",
  "Liam",
  "Ezra",
  "Finn",
  "Arlo",
  "Jude",
  "Kai",
  "Sam",
  "Max",
  "Cole",
  "Ryan",
  "Evan",
  "Adam",
  "Alex",
  "Ben",
  "Luke",
  "Jack",
  "James",
  "Oscar",
  "Felix",
  "Rowan",
  "Robin",
  "Jamie",
  "Morgan",
  "Taylor",
  "Jordan",
  "Casey",
  "Quinn",
  "Avery",
  "Riley",
  "Hayden",
  "Emery",
];
const generatedLastNames = [
  "Harper",
  "Bennett",
  "Brooks",
  "Carter",
  "Ellis",
  "Foster",
  "Hayes",
  "Hudson",
  "James",
  "Jordan",
  "Lane",
  "Lennox",
  "Morgan",
  "Parker",
  "Reed",
  "Rivers",
  "Sawyer",
  "Spencer",
  "Taylor",
  "West",
  "Blake",
  "Blair",
  "Cameron",
  "Casey",
  "Clarke",
  "Collins",
  "Dawson",
  "Finley",
  "Gray",
  "Green",
  "Hall",
  "Hart",
  "Kennedy",
  "King",
  "Logan",
  "Mason",
  "Miller",
  "North",
  "Palmer",
  "Quinn",
  "Reese",
  "Riley",
  "Rose",
  "Sage",
  "Scott",
  "Sloan",
  "Stone",
  "Sutton",
  "Walker",
  "Wells",
  "Wilder",
  "Wilson",
  "Wright",
  "Young",
  "Bell",
  "Cross",
  "Dean",
  "Ford",
  "Grant",
  "Lake",
  "Perry",
  "Shaw",
  "Avery",
  "Drew",
];

export const baseScore = 500;
export const speedBonus = 500;
export const speedWindowMs = 20000;

export function validateQuestions(input) {
  if (!Array.isArray(input) || !input.length || input.length > 30)
    throw new Error("Add between 1 and 30 questions.");
  return input.map((raw) =>
    parseQuestion(raw, { newId: randomUUID, canonical: true }),
  );
}

function generatedName(room) {
  const used = new Set(
    [...room.participants.values()].map((member) => member.name),
  );
  for (let attempt = 0; attempt < 100; attempt++) {
    const name = `${generatedFirstNames[randomInt(generatedFirstNames.length)]} ${generatedLastNames[randomInt(generatedLastNames.length)]}`;
    if (!used.has(name)) return name;
  }
  throw new Error("Could not create a unique participant name.");
}

function participantName(name) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 24)
    throw new Error("Enter a name with 1 to 24 characters.");
  return name.trim();
}

/**
 * With `crowdKind`, players write the questions: the room starts with none, collects one
 * question of that type from each player, then plays them in random order.
 */
export function createRoom(title, questions, crowdKind, nameless = false) {
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
    nameless: nameless === true,
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
    /** The host has hidden the live responses of an on-the-fly question. */
    hidden: false,
    ranking: false,
    /** The host is holding the room before revealing the final podium. */
    suspense: false,
    podium: false,
    ended: false,
    hearts: 0,
    participants: new Map(),
    peerPraiseTargets: new Map(),
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

function assignPeerPraiseTargets(room, question) {
  const tokens = [...room.participants.keys()];
  const shuffled = [...tokens];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  const offset = tokens.length > 1 ? randomInt(1, tokens.length) : 0;
  room.peerPraiseTargets.set(
    question.id,
    new Map(
      shuffled.map((token, index) => [
        token,
        shuffled[(index + offset) % shuffled.length],
      ]),
    ),
  );
}

function assignNewPeerPraisePlayer(room, token) {
  if (!room.started) return;
  for (const question of room.questions) {
    if (!traitsOf(question.type).assignsTargets) continue;
    const assignments = room.peerPraiseTargets.get(question.id) ?? new Map();
    room.peerPraiseTargets.set(question.id, assignments);
    if (assignments.has(token)) continue;
    const others = [...room.participants.keys()].filter(
      (participant) => participant !== token,
    );
    assignments.set(
      token,
      others.length ? others[randomInt(others.length)] : token,
    );
    for (const other of others) {
      if (
        assignments.get(other) === other &&
        !room.votes.get(question.id).has(other)
      )
        assignments.set(other, token);
    }
  }
}

export function joinRoom(room, name, token) {
  if (token && room.participants.has(token)) {
    const member = room.participants.get(token);
    member.generated ??= room.nameless === true;
    member.nameChanged ??= false;
    assignNewPeerPraisePlayer(room, token);
    return token;
  }
  if (room.ended) throw new Error("This session has ended.");
  if (room.participants.size >= 500) throw new Error("This room is full.");
  const generated = room.nameless === true;
  const assignedName = generated ? generatedName(room) : participantName(name);
  const memberToken = randomUUID();
  room.participants.set(memberToken, {
    name: assignedName,
    generated,
    nameChanged: false,
  });
  assignNewPeerPraisePlayer(room, memberToken);
  return memberToken;
}

export function renameParticipant(room, token, name) {
  const member = room.participants.get(token);
  if (!member) throw new Error("Join the room before changing your name.");
  if (room.ended)
    throw new Error(
      "Your name can only be changed while the session is active.",
    );
  if (member.nameChanged === true)
    throw new Error("Your name can only be changed once.");
  member.name = participantName(name);
  member.generated = false;
  member.nameChanged = true;
  return member;
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
  const [question] = validateQuestions([authoredQuestion(kind, input)]);
  room.crowd.pending.set(token, question);
}

/** The question a player already submitted, in the shape of their form, so a refresh can restore it. */
export function authoredDraft(room, token) {
  const question = room.crowd?.pending.get(token);
  if (!question) return undefined;
  return {
    title: question.title,
    options: question.options ?? [],
    correct: question.correct ?? null,
    multiple: question.multiple,
    corrects: question.corrects,
    sliderMin: question.sliderMin,
    sliderMax: question.sliderMax,
    sliderStep: question.sliderStep,
  };
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
  if (!traitsOf(question.type).collectsAnswers)
    throw new Error("This slide does not accept responses.");
  if (
    !room.started ||
    room.ended ||
    !room.accepting ||
    question.id !== questionId
  )
    throw new Error("This question is no longer accepting responses.");
  const votes = room.votes.get(question.id);
  if (holdsSeveralSubmissions(question)) {
    const entries = votes.get(token) ?? [];
    if (entries.length >= submissionLimit(question))
      throw new Error("Your response is already in.");
    votes.set(token, [...entries, parseAnswer(question, value)]);
  } else {
    if (votes.has(token)) throw new Error("Your response is already in.");
    votes.set(token, parseAnswer(question, value));
  }
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
  if (!canCompete(question.type) || room.authors.get(question.id) === token)
    return 0;
  const answer = room.votes.get(question.id).get(token);
  const share = scoreShare(question, answer);
  if (!share) return 0;
  let points = 1000;
  if (question.competitive) {
    const opened = room.openedAt.get(question.id);
    const answered = room.answeredAt.get(question.id).get(token);
    const elapsed =
      opened === undefined || answered === undefined
        ? speedWindowMs
        : Math.max(0, answered - opened);
    points =
      baseScore +
      Math.round(speedBonus * Math.max(0, 1 - elapsed / speedWindowMs));
  }
  return Math.round(points * share);
}

export function submitUpvote(room, token, questionId, entrantToken) {
  if (!room.participants.has(token))
    throw new Error("Join the room before responding.");
  const question = room.questions[room.active];
  if (!traitsOf(question.type).upvotes)
    throw new Error("This question does not accept upvotes.");
  if (
    !room.started ||
    room.ended ||
    !room.accepting ||
    question.id !== questionId
  )
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
    for (const question of room.questions)
      if (traitsOf(question.type).assignsTargets)
        assignPeerPraiseTargets(room, question);
    room.accepting = traitsOf(room.questions[room.active].type).collectsAnswers;
    markOpened(room, now);
  } else if (action === "select") {
    if (!Number.isInteger(index) || index < 0 || index >= room.questions.length)
      throw new Error("Question not found.");
    room.active = index;
    room.accepting = traitsOf(room.questions[room.active].type).collectsAnswers;
    room.revealed = false;
    room.hidden = false;
    room.ranking = false;
    room.suspense = false;
    room.podium = false;
    markOpened(room, now);
  } else if (action === "toggle") {
    if (!traitsOf(room.questions[room.active].type).collectsAnswers)
      throw new Error("This slide does not accept responses.");
    room.accepting = !room.accepting;
    if (room.accepting) {
      room.revealed = false;
      room.ranking = false;
      room.suspense = false;
      room.podium = false;
    }
    markOpened(room, now);
  } else if (action === "hide" || action === "show") {
    const current = room.questions[room.active];
    if (!hasRevealMode(current.type))
      throw new Error("This question has no responses to hide.");
    room.hidden = action === "hide";
  } else if (action === "reveal") {
    if (!traitsOf(room.questions[room.active].type).collectsAnswers)
      throw new Error("This slide has no results to reveal.");
    room.revealed = true;
    room.hidden = false;
    room.accepting = false;
  } else if (action === "ranking") {
    if (!room.questions.some((question) => canCompete(question.type)))
      throw new Error("This session has no questions with answers to rank.");
    room.revealed = true;
    room.accepting = false;
    room.ranking = true;
    room.suspense = false;
    room.podium = false;
  } else if (action === "suspense") {
    if (!room.questions.some((question) => canCompete(question.type)))
      throw new Error("This session has no questions with answers to rank.");
    room.revealed = true;
    room.accepting = false;
    room.ranking = false;
    room.suspense = true;
    room.podium = false;
  } else if (action === "podium") {
    if (!room.questions.some((question) => canCompete(question.type)))
      throw new Error("This session has no questions with answers to rank.");
    room.revealed = true;
    room.accepting = false;
    room.ranking = false;
    room.suspense = false;
    room.podium = true;
  } else if (action === "end") {
    room.ended = true;
    room.accepting = false;
    room.revealed = true;
  } else throw new Error("Unknown room action.");
}

function results(room, question) {
  const upvotes = room.upvotes.get(question.id);
  const assignments = room.peerPraiseTargets.get(question.id);
  return aggregateResults(question, room.votes.get(question.id), {
    upvotes: (token) => upvotes.get(token)?.size || 0,
    targetName: (token) =>
      room.participants.get(assignments?.get(token))?.name ?? "",
  });
}

export function snapshot(room, host = false, token) {
  const visible = host || room.revealed;
  const standings = visible
    ? [...room.participants]
        .map(([memberToken, member]) => ({
          token: memberToken,
          name: member.name,
          generated: member.generated === true,
          score: room.questions.reduce(
            (score, question) =>
              score + scoreAnswer(room, question, memberToken),
            0,
          ),
        }))
        .sort((first, second) => second.score - first.score)
    : [];
  const leaderboard = standings
    .slice(0, 10)
    .map(({ name, generated, score }) => ({ name, generated, score }));
  // The asking player's own place, so it stays visible beyond the top 10.
  const position =
    !host && token ? standings.findIndex((entry) => entry.token === token) : -1;
  const me =
    position >= 0
      ? {
          rank: position + 1,
          total: standings.length,
          name: standings[position].name,
          generated: standings[position].generated,
          score: standings[position].score,
        }
      : null;
  return {
    code: room.code,
    title: room.title,
    nameless: room.nameless === true,
    active: room.active,
    started: room.started,
    accepting: room.accepting,
    revealed: room.revealed,
    hidden: room.hidden,
    ranking: room.ranking,
    suspense: room.suspense,
    podium: room.podium,
    ended: room.ended,
    participants: room.participants.size,
    participantNames: [...room.participants.values()].map(
      (member) => member.name,
    ),
    competitive: room.questions.some(
      (question) => question.competitive === true,
    ),
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
    me,
    questions: room.questions.map((question, index) => {
      const assignedTo =
        !host &&
        token &&
        index === room.active &&
        traitsOf(question.type).assignsTargets
          ? room.participants.get(
              room.peerPraiseTargets.get(question.id)?.get(token),
            )?.name
          : undefined;
      const unveiled =
        host || (room.revealed && (index === room.active || room.ended));
      return {
        ...question,
        ...(unveiled ? {} : concealedFields(question)),
        ...(assignedTo ? { assignedTo } : {}),
        correct: unveiled ? question.correct : null,
        ...(question.corrects
          ? {
              corrects:
                host || (room.revealed && (index === room.active || room.ended))
                  ? question.corrects
                  : [],
            }
          : {}),
        responses: [...room.votes.get(question.id).values()].reduce(
          (total, stored) =>
            total + (holdsSeveralSubmissions(question) ? stored.length : 1),
          0,
        ),
        results:
          host ||
          traitsOf(question.type).resultsAlwaysVisible ||
          (question.revealMode === "live" &&
            index === room.active &&
            !room.hidden) ||
          (room.revealed && (index === room.active || room.ended))
            ? results(room, question)
            : [],
      };
    }),
  };
}
