import { useState, type FormEvent } from "react";
import { request, useLive } from "../../live";
import { readStored, store } from "../../model";
import { type Authored } from "../crowd/authoring";

export function useParticipantController() {
  const initialCode =
    new URLSearchParams(window.location.search).get("code") || "";
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<
    string | number | number[] | { x: number; y: number }
  >("");
  const [answerQuestion, setAnswerQuestion] = useState("");
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [upvotedQuestion, setUpvotedQuestion] = useState("");
  const [reactionTap, setReactionTap] = useState({ kind: "", count: 0 });
  const live = useLive("audience", initialCode);
  const { room, connected, error, setError, submitted, answers } = live;
  const question = room?.questions[room.active];
  const currentUpvoted =
    upvotedQuestion === question?.id ? upvoted : new Set<string>();
  const currentAnswer = answerQuestion === question?.id ? answer : "";
  const rankingOrder =
    question?.type === "ranking"
      ? Array.isArray(currentAnswer)
        ? currentAnswer
        : question.options.map((_, index) => index)
      : [];
  const sliderValue =
    question?.type === "slider"
      ? typeof currentAnswer === "number"
        ? currentAnswer
        : Math.round(
            ((question.sliderMin ?? 0) + (question.sliderMax ?? 10)) / 2,
          )
      : 0;
  const pointsAllocation =
    question?.type === "points100"
      ? Array.isArray(currentAnswer) &&
        currentAnswer.length === question.options.length
        ? currentAnswer
        : question.options.map(() => 0)
      : [];
  const pointsAllocated = pointsAllocation.reduce(
    (sum, points) => sum + points,
    0,
  );
  const gridPoint =
    question?.type === "grid2x2"
      ? currentAnswer &&
        typeof currentAnswer === "object" &&
        !Array.isArray(currentAnswer)
        ? currentAnswer
        : null
      : null;
  const submissionCount = question
    ? submitted.filter((id) => id === question.id).length
    : 0;
  const maxSubmissions = question?.type === "cloud" ? question.maxSubmissions ?? 1 : 1;
  const hasSubmitted = submissionCount > 0;
  const isFullySubmitted = !!question && submissionCount >= maxSubmissions;
  const isMultiple =
    (question?.type === "poll" || question?.type === "quiz") &&
    question.multiple === true;
  const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : [];

  async function join(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = readStored<{ token?: string }>(
        `pulse:participant:${code}`,
        {},
      );
      const reply = await request("room:join", {
        code,
        name,
        token: saved.token,
      });
      store(`pulse:participant:${code}`, { code, name, token: reply.token });
      window.location.assign(`/join?code=${code}`);
    } catch (failure) {
      setError((failure as Error).message);
      setBusy(false);
    }
  }
  async function vote(event: FormEvent) {
    event.preventDefault();
    if (!question || !room) return;
    setBusy(true);
    setError("");
    try {
      const value =
        question.type === "ranking"
          ? rankingOrder
          : isMultiple
            ? selectedOptions
            : question.type === "slider"
              ? sliderValue
              : question.type === "points100"
                ? pointsAllocation
                : question.type === "grid2x2"
                  ? gridPoint
                  : currentAnswer;
      await request("room:vote", {
        ...live.credentials(),
        questionId: question.id,
        value,
      });
      live.setAnswers((items) => ({
        ...items,
        [question.id]:
          question.type === "cloud"
            ? [
                ...(Array.isArray(items[question.id])
                  ? (items[question.id] as string[])
                  : items[question.id]
                    ? [String(items[question.id])]
                    : []),
                String(value).trim(),
              ]
            : value,
      }));
      live.setSubmitted((items) => [...items, question.id]);
      if (question.type === "cloud") {
        setAnswer("");
        setAnswerQuestion(question.id);
      }
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function moveRankItem(from: number, to: number) {
    if (!question) return;
    const next = [...rankingOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setAnswer(next);
    setAnswerQuestion(question.id);
  }
  function setPointsFor(index: number, points: number) {
    if (!question) return;
    // The other options keep their points, so this one can only use what is left of 100.
    const remaining = 100 - (pointsAllocated - (pointsAllocation[index] ?? 0));
    const capped = Math.max(0, Math.min(remaining, Math.round(points) || 0));
    const next = pointsAllocation.map((value, position) =>
      position === index ? capped : value,
    );
    setAnswer(next);
    setAnswerQuestion(question.id);
  }
  function setGridPoint(x: number, y: number) {
    if (!question) return;
    setAnswer({
      x: Math.max(-100, Math.min(100, Math.round(x))),
      y: Math.max(-100, Math.min(100, Math.round(y))),
    });
    setAnswerQuestion(question.id);
  }
  async function sendAuthored(authored: Authored) {
    setBusy(true);
    setError("");
    try {
      await request("room:author", {
        ...live.credentials(),
        question: authored,
      });
      // The server now holds this question, so the saved draft is no longer needed.
      store(`pulse:author-draft:${live.credentials()?.code}`, null);
      live.setSubmitted((items) =>
        items.includes("crowd-authored") ? items : [...items, "crowd-authored"],
      );
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function sendHeart(kind = "heart") {
    setReactionTap((current) => ({ kind, count: current.count + 1 }));
    try {
      await request("room:react", { ...(live.credentials() ?? {}), kind });
    } catch {
      // A dropped heart is harmless; the next tap tries again.
    }
  }
  async function upvote(entrantId: string) {
    if (!question) return;
    const toggle = (current: Set<string>) => {
      const next = new Set(current);
      if (next.has(entrantId)) next.delete(entrantId);
      else next.add(entrantId);
      return next;
    };
    setUpvotedQuestion(question.id);
    setUpvoted(toggle(currentUpvoted));
    try {
      await request("room:upvote", {
        ...live.credentials(),
        questionId: question.id,
        entrantToken: entrantId,
      });
    } catch (failure) {
      setUpvotedQuestion(question.id);
      setUpvoted((current) => toggle(current));
      setError((failure as Error).message);
    }
  }
  return {
    initialCode,
    code,
    setCode,
    name,
    setName,
    busy,
    setBusy,
    answer,
    setAnswer,
    answerQuestion,
    setAnswerQuestion,
    upvoted,
    setUpvoted,
    upvotedQuestion,
    setUpvotedQuestion,
    reactionTap,
    setReactionTap,
    live,
    room,
    connected,
    error,
    setError,
    submitted,
    answers,
    question,
    currentUpvoted,
    currentAnswer,
    rankingOrder,
    sliderValue,
    pointsAllocation,
    pointsAllocated,
    gridPoint,
    submissionCount,
    maxSubmissions,
    hasSubmitted,
    isFullySubmitted,
    isMultiple,
    selectedOptions,
    join,
    vote,
    moveRankItem,
    setPointsFor,
    setGridPoint,
    sendAuthored,
    sendHeart,
    upvote,
  };
}

export type ParticipantController = ReturnType<typeof useParticipantController>;
