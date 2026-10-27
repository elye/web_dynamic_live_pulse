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
const cloudWords = [
  "Teamwork",
  "Growth",
  "Coffee",
  "Focus",
  "Trust",
  "Ideas",
  "Energy",
  "Clarity",
  "Fun",
  "Learning",
  "Support",
  "Balance",
  "Momentum",
  "Curious",
  "Ownership",
  "Creativity",
  "Feedback",
  "Listening",
  "Goals",
  "Pace",
];
const sentences = [
  "More time to explore ideas together.",
  "The energy we bring as a team is fantastic.",
  "I would like to hear more customer stories.",
  "A clearer view of what comes next would help.",
  "Shorter meetings and more focused discussion.",
  "Great session, thank you for organising it.",
  "Could we share the slides afterwards?",
  "What is the plan for the next quarter?",
  "I appreciate how open everyone has been.",
  "More hands-on practice would be useful.",
];

/** Validates the requested audience size, returning an integer. */
export function parseSimulatedPlayers(value) {
  if (!Number.isInteger(value) || value < 1 || value > maxSimulatedPlayers)
    throw new Error(`Simulate between 1 and ${maxSimulatedPlayers} players.`);
  return value;
}

const pick = (random, items) => items[Math.floor(random() * items.length)];

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

/** Splits 100 points across `parts` options with a few favourites. */
function splitHundred(random, parts) {
  const weights = Array.from({ length: parts }, () => random() ** 2 + 0.05);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const points = weights.map((weight) => Math.floor((weight / total) * 100));
  points[points.indexOf(Math.max(...points))] +=
    100 - points.reduce((a, b) => a + b, 0);
  return points;
}

/** A plausible answer for `question`, or null when it takes no response. */
export function simulatedAnswer(question, random = Math.random) {
  const options = question.options?.length ?? 0;
  switch (question.type) {
    case "poll":
    case "quiz":
    case "truefalse":
    case "twotruths": {
      if (question.multiple) {
        const count = 1 + Math.floor(random() * Math.min(options, 3));
        return shuffled(random, [...Array(options).keys()])
          .slice(0, count)
          .sort((first, second) => first - second);
      }
      const known = question.correct;
      // Answered questions lean towards the right answer so scores spread out.
      if (Number.isInteger(known) && random() < 0.55) return known;
      // Otherwise earlier options are slightly more popular.
      return Math.min(options - 1, Math.floor(random() ** 1.4 * options));
    }
    case "ranking":
      return shuffled(random, [...Array(options).keys()]);
    case "points100":
      return splitHundred(random, options);
    case "slider": {
      const { sliderMin: min, sliderMax: max, sliderStep: step } = question;
      const steps = Math.max(0, Math.floor((max - min) / step));
      const position = Math.round(((random() + random()) / 2) * steps);
      return Number((min + position * step).toFixed(8));
    }
    case "grid2x2":
      return {
        x: Math.round(((random() + random()) / 2) * 200 - 100),
        y: Math.round(((random() + random()) / 2) * 200 - 100),
      };
    case "cloud":
      // Earlier words are picked more often, giving a realistic frequency curve.
      return cloudWords[Math.floor(random() ** 2 * cloudWords.length)];
    case "peerpraise":
    case "qna":
    case "text":
      return pick(random, sentences);
    default:
      return null;
  }
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
      question.type === "slide" ||
      !room.started ||
      !room.accepting
    )
      return false;
    const votes = room.votes.get(question.id);
    let plan = plans.get(question.id);
    if (!plan) plans.set(question.id, (plan = new Map()));
    const allowed =
      question.type === "cloud" ? (question.maxSubmissions ?? 1) : 1;
    for (const token of bots) {
      if (plan.has(token)) continue;
      const given =
        question.type === "cloud"
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
