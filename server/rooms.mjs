import { randomInt, randomUUID } from "node:crypto";

export const rooms = new Map();
const kinds = new Set(["slide", "cloud", "poll", "quiz", "truefalse", "ranking", "slider", "qna", "text"]);

export function validateQuestions(input) {
  if (!Array.isArray(input) || !input.length || input.length > 30)
    throw new Error("Add between 1 and 30 questions.");
  return input.map((question) => {
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
      ["poll", "quiz", "ranking"].includes(question.type) &&
      (options.length < 2 ||
        options.length > 6 ||
        options.some((option) => !option || option.length > 100))
    )
      throw new Error("Add 2 to 6 answer options, up to 100 characters each.");
    if (
      ["quiz", "truefalse"].includes(question.type) &&
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
    return {
      id: randomUUID(),
      type: question.type,
      title: question.title.trim(),
      ...(question.type === "slide" ? { description: question.description.trim() } : {}),
      ...(question.type === "slider"
        ? { sliderMin: question.sliderMin, sliderMax: question.sliderMax, sliderStep: question.sliderStep }
        : {}),
      options,
      correct: ["quiz", "truefalse"].includes(question.type) ? question.correct : null,
    };
  });
}

export function createRoom(title, questions) {
  if (rooms.size >= 1000)
    throw new Error("The server is full. Please try again later.");
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
    questions: validateQuestions(questions),
    active: 0,
    started: false,
    accepting: false,
    revealed: false,
    ended: false,
    participants: new Map(),
    votes: new Map(),
    upvotes: new Map(),
    createdAt: Date.now(),
  };
  room.questions.forEach((question) => {
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

export function submitVote(room, token, questionId, value) {
  if (!room.participants.has(token))
    throw new Error("Join the room before responding.");
  const question = room.questions[room.active];
  if (question.type === "slide") throw new Error("This slide does not accept responses.");
  if (!room.started || room.ended || !room.accepting || question.id !== questionId)
    throw new Error("This question is no longer accepting responses.");
  const votes = room.votes.get(question.id);
  if (votes.has(token)) throw new Error("Your response is already in.");
  if (["poll", "quiz", "truefalse"].includes(question.type)) {
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

export function controlRoom(room, token, action, index) {
  authorize(room, token);
  if (room.ended)
    throw new Error(
      "This session has ended. Start a new session to play again.",
    );
  if (!room.started && !["start", "end"].includes(action))
    throw new Error("Start the questions before changing or revealing them.");
  if (action === "start") {
    if (room.started) throw new Error("The questions have already started.");
    room.started = true;
    room.active = 0;
    room.accepting = room.questions[room.active].type !== "slide";
  } else if (action === "select") {
    if (!Number.isInteger(index) || index < 0 || index >= room.questions.length)
      throw new Error("Question not found.");
    room.active = index;
    room.accepting = room.questions[room.active].type !== "slide";
    room.revealed = false;
  } else if (action === "toggle") {
    if (room.questions[room.active].type === "slide") throw new Error("This slide does not accept responses.");
    room.accepting = !room.accepting;
    if (room.accepting) room.revealed = false;
  } else if (action === "reveal") {
    if (room.questions[room.active].type === "slide") throw new Error("This slide has no results to reveal.");
    room.revealed = true;
    room.accepting = false;
  } else if (action === "end") {
    room.ended = true;
    room.accepting = false;
    room.revealed = true;
  } else throw new Error("Unknown room action.");
}

function results(room, question) {
  const values = [...room.votes.get(question.id).values()];
  if (["poll", "quiz", "truefalse"].includes(question.type))
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
            (score, question) =>
              score +
              (["quiz", "truefalse"].includes(question.type) &&
              room.votes.get(question.id).get(token) === question.correct
                ? 1000
                : 0),
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
    ended: room.ended,
    participants: room.participants.size,
    participantNames: [...room.participants.values()].map((member) => member.name),
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
        (room.revealed && (index === room.active || room.ended))
          ? results(room, question)
          : [],
    })),
  };
}
