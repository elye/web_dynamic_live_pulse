import { useEffect, useState, type FormEvent } from "react";
import { request, useLive } from "../../live";
import { readStored, store } from "../../model";
import { type Authored } from "../crowd/authoring";

type ParticipantCredentials = {
  token?: string;
  name?: string;
  generated?: boolean;
  nameChangeUsed?: boolean;
};

export function useParticipantController() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCode = searchParams.get("code") || "";
  const hintedNameless = searchParams.get("nameless") === "1";
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const storedParticipant = readStored<ParticipantCredentials | null>(
    `pulse:participant:${initialCode}`,
    null,
  );
  const [participantName, setParticipantName] = useState(
    storedParticipant?.name || "",
  );
  const [participantNameGenerated, setParticipantNameGenerated] = useState(
    storedParticipant?.generated === true ||
      (storedParticipant?.generated === undefined &&
        hintedNameless &&
        storedParticipant?.nameChangeUsed !== true),
  );
  const [nameChangeUsed, setNameChangeUsed] = useState(
    storedParticipant?.nameChangeUsed === true,
  );
  const [nameless, setNameless] = useState<boolean | null>(
    hintedNameless ? true : null,
  );
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
  const detectedNameless = room?.nameless ?? nameless;
  const participantNameIsGenerated =
    participantNameGenerated || (room?.nameless === true && !nameChangeUsed);
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
  const maxSubmissions =
    question?.type === "cloud" ? (question.maxSubmissions ?? 1) : 1;
  const hasSubmitted = submissionCount > 0;
  const isFullySubmitted = !!question && submissionCount >= maxSubmissions;
  const isMultiple =
    (question?.type === "poll" || question?.type === "quiz") &&
    question.multiple === true;
  const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : [];

  function setParticipantCode(nextCode: string) {
    setCode(nextCode);
    if (!(nextCode === initialCode && hintedNameless)) setNameless(null);
  }

  useEffect(() => {
    if (code.length !== 6) return;
    let active = true;
    if (!connected)
      return () => {
        active = false;
      };
    void request("room:info", { code })
      .then((reply) => {
        if (active) setNameless(reply.nameless === true);
      })
      .catch(() => {
        if (active) setNameless(null);
      });
    return () => {
      active = false;
    };
  }, [code, connected]);

  async function join(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = readStored<{ token?: string }>(
        `pulse:participant:${code}`,
        {},
      );
      let roomIsNameless = detectedNameless;
      if (roomIsNameless === null) {
        const info = await request("room:info", { code });
        roomIsNameless = info.nameless === true;
        setNameless(roomIsNameless);
      }
      const reply = await request("room:join", {
        code,
        name: roomIsNameless ? undefined : name,
        token: saved.token,
      });
      const assignedName = reply.name || name;
      const generated = reply.generated === true;
      const nameChangeUsed = reply.nameChangeUsed === true;
      store(`pulse:participant:${code}`, {
        code,
        name: assignedName,
        generated,
        nameChangeUsed,
        token: reply.token,
      });
      setParticipantName(assignedName);
      setParticipantNameGenerated(generated);
      setNameChangeUsed(nameChangeUsed);
      window.location.assign(
        `/join?code=${code}${reply.state?.nameless ? "&nameless=1" : ""}`,
      );
    } catch (failure) {
      setError((failure as Error).message);
      setBusy(false);
    }
  }
  async function renameParticipant(nextName: string) {
    const credentials = live.credentials();
    if (!credentials) {
      setError("Join the room before changing your name.");
      return false;
    }
    setBusy(true);
    setError("");
    try {
      const reply = await request("room:rename", {
        ...credentials,
        name: nextName,
      });
      const updatedName = reply.name || nextName.trim();
      const generated = reply.generated === true;
      const nameChangeUsed = reply.nameChangeUsed === true;
      store(`pulse:participant:${credentials.code}`, {
        ...credentials,
        name: updatedName,
        generated,
        nameChangeUsed,
      });
      setParticipantName(updatedName);
      setParticipantNameGenerated(generated);
      setNameChangeUsed(nameChangeUsed);
      return true;
    } catch (failure) {
      setError((failure as Error).message);
      return false;
    } finally {
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
    setCode: setParticipantCode,
    name,
    setName,
    participantName,
    participantNameGenerated: participantNameIsGenerated,
    nameChangeUsed,
    renameParticipant,
    nameless: detectedNameless,
    setNameless,
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
