import { randomInt, randomUUID } from "node:crypto";

export const rooms = new Map();
const kinds = new Set(["cloud", "poll", "quiz", "text"]);

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
    const options = Array.isArray(question.options)
      ? question.options.map((option) => String(option).trim())
      : [];
    if (
      ["poll", "quiz"].includes(question.type) &&
      (options.length < 2 ||
        options.length > 6 ||
        options.some((option) => !option || option.length > 100))
    )
      throw new Error("Add 2 to 6 answer options, up to 100 characters each.");
    if (
      question.type === "quiz" &&
      (!Number.isInteger(question.correct) ||
        question.correct < 0 ||
        question.correct >= options.length)
    )
      throw new Error("Choose the correct quiz answer.");
    return {
      id: randomUUID(),
      type: question.type,
      title: question.title.trim(),
      options,
      correct: question.type === "quiz" ? question.correct : null,
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
    accepting: true,
    revealed: false,
    ended: false,
    participants: new Map(),
    votes: new Map(),
    createdAt: Date.now(),
  };
  room.questions.forEach((question) => room.votes.set(question.id, new Map()));
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
  if (room.ended || !room.accepting || question.id !== questionId)
    throw new Error("This question is no longer accepting responses.");
  const votes = room.votes.get(question.id);
  if (votes.has(token)) throw new Error("Your response is already in.");
  if (["poll", "quiz"].includes(question.type)) {
    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value >= question.options.length
    )
      throw new Error("Choose one of the available options.");
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

export function controlRoom(room, token, action, index) {
  authorize(room, token);
  if (room.ended)
    throw new Error(
      "This session has ended. Start a new session to play again.",
    );
  if (action === "select") {
    if (!Number.isInteger(index) || index < 0 || index >= room.questions.length)
      throw new Error("Question not found.");
    room.active = index;
    room.accepting = true;
    room.revealed = false;
  } else if (action === "toggle") {
    room.accepting = !room.accepting;
    if (room.accepting) room.revealed = false;
  } else if (action === "reveal") {
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
  if (["poll", "quiz"].includes(question.type))
    return question.options.map((text, index) => ({
      text,
      count: values.filter((value) => value === index).length,
    }));
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
              (question.type === "quiz" &&
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
    accepting: room.accepting,
    revealed: room.revealed,
    ended: room.ended,
    participants: room.participants.size,
    leaderboard,
    questions: room.questions.map((question, index) => ({
      ...question,
      correct:
        host || (room.revealed && (index === room.active || room.ended))
          ? question.correct
          : null,
      responses: room.votes.get(question.id).size,
      results:
        host || (room.revealed && (index === room.active || room.ended))
          ? results(room, question)
          : [],
    })),
  };
}
