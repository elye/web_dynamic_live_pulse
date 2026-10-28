import {
  holdsSeveralSubmissions,
  simulateAnswer,
  submissionLimit,
  traitsOf,
} from "../src/questions/index.ts";
import { joinRoom, rooms, submitVote } from "./rooms.mjs";

/**
 * Simulated audiences for rehearsing a session.
 *
 * Everything here is a client of the public room API (`joinRoom`, `submitVote`):
 * simulated players are ordinary participants, flagged with `simulated: true`,
 * and nothing in rooms.mjs or the socket handlers knows about them. Real players
 * can join, answer and be scored alongside them.
 */

export const maxSimulatedPlayers = 300;
export const joinWindowMs = 10_000;
const answerWindowMs = 8_000;
const tickMs = 250;

const firstNames = [
  "Maya",
  "Liam",
  "Aisha",
  "Noah",
  "Sofia",
  "Ethan",
  "Priya",
  "Lucas",
  "Chloe",
  "Omar",
  "Hana",
  "Mateo",
  "Zoe",
  "Arjun",
  "Ivy",
  "Felix",
  "Nina",
  "Kai",
  "Layla",
  "Theo",
  "Elena",
  "Jonas",
  "Mei",
  "Diego",
  "Ruby",
  "Samir",
  "Alma",
  "Finn",
  "Yara",
  "Leo",
];

/** Validates the requested audience size, returning an integer. */
export function parseSimulatedPlayers(value) {
  if (!Number.isInteger(value) || value < 1 || value > maxSimulatedPlayers)
    throw new Error(`Simulate between 1 and ${maxSimulatedPlayers} players.`);
  return value;
}

function shuffled(random, items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

/** Unique "Maya K." style names, so the lobby and leaderboard read naturally. */
function playerNames(random, count) {
  const initials = "ABCDEFGHIJKLMNOPRSTW".split("");
  const combinations = firstNames.flatMap((first) =>
    initials.map((initial) => `${first} ${initial}.`),
  );
  return shuffled(random, combinations).slice(0, count);
}

/** A plausible answer for `question`, or null when it takes no response. */
export function simulatedAnswer(question, random = Math.random) {
  return simulateAnswer(question, random);
}

/**
 * Starts simulated players for one room: they join at random moments within
 * `joinWindowMs`, then answer each question that opens.
 * Returns `{ stop }`; it also stops itself when the room ends or is removed.
 */
export function startSimulation(
  room,
  players,
  {
    onChange = () => {},
    random = Math.random,
    now = Date.now,
    joinWindow = joinWindowMs,
    answerWindow = answerWindowMs,
    interval = tickMs,
  } = {},
) {
  const startedAt = now();
  const names = playerNames(random, players);
  const joins = names
    .map((name) => ({ name, at: startedAt + random() * joinWindow }))
    .sort((first, second) => first.at - second.at);
  const bots = [];
  /** Question id -> bot token -> when it answers and how many answers remain. */
  const plans = new Map();
  let nextJoin = 0;

  function joinDue(time) {
    let changed = false;
    while (nextJoin < joins.length && joins[nextJoin].at <= time) {
      try {
        const token = joinRoom(room, joins[nextJoin].name);
        room.participants.get(token).simulated = true;
        bots.push(token);
        changed = true;
      } catch {
        // The room is full or ended: no more simulated players can join.
        nextJoin = joins.length;
        break;
      }
      nextJoin++;
    }
    return changed;
  }

  function answerDue(time) {
    const question = room.questions[room.active];
    if (
      !question ||
      !traitsOf(question.type).collectsAnswers ||
      !room.started ||
      !room.accepting
    )
      return false;
    const votes = room.votes.get(question.id);
    let plan = plans.get(question.id);
    if (!plan) plans.set(question.id, (plan = new Map()));
    const allowed = submissionLimit(question);
    for (const token of bots) {
      if (plan.has(token)) continue;
      const given = holdsSeveralSubmissions(question)
        ? (votes.get(token)?.length ?? 0)
        : votes.has(token)
          ? 1
          : 0;
      plan.set(token, {
        at: time + 300 + random() * answerWindow,
        left: allowed - given,
      });
    }
    let changed = false;
    for (const [token, entry] of plan) {
      if (entry.left <= 0 || entry.at > time) continue;
      try {
        submitVote(room, token, question.id, simulatedAnswer(question, random));
        changed = true;
        entry.left--;
        entry.at = time + 400 + random() * 1200;
      } catch {
        // Duplicate or invalid answers are dropped; this player is done here.
        entry.left = 0;
      }
    }
    return changed;
  }

  const timer = setInterval(() => {
    if (rooms.get(room.code) !== room || room.ended) return stop();
    const time = now();
    const joined = joinDue(time);
    const answered = answerDue(time);
    if (joined || answered) onChange(room);
  }, interval);
  timer.unref();

  function stop() {
    clearInterval(timer);
  }
  return { stop };
}

/** Tracks running simulations by room code so the server can stop them. */
export function createSimulationManager({ onChange } = {}) {
  const running = new Map();
  const stop = (code) => {
    running.get(code)?.stop();
    running.delete(code);
  };
  return {
    start(room, players, options = {}) {
      stop(room.code);
      running.set(
        room.code,
        startSimulation(room, players, { onChange, ...options }),
      );
    },
    stop,
    stopAll() {
      for (const code of [...running.keys()]) stop(code);
    },
  };
}
