import { canCompete, hasRevealMode } from "../../../model";
import { useHost } from "../HostContext";

export type AdvanceStep = "results" | "ranking" | "podium" | "next" | "finish";

/**
 * The host's "forward" action. Each call does one step: show results, then the
 * top 10 ranking (answered questions, not the last one), then the next
 * question. After the last question a session with answered questions ends on
 * the podium before it is finished. Questions already showing results on the
 * fly skip the first step, except answered ones, whose correct answer still
 * needs a reveal.
 */
export function useAdvance() {
  const {
    setModal,
    busy,
    room,
    currentIndex,
    question,
    questionList,
    control,
    move,
  } = useHost();
  const last = currentIndex === questionList.length - 1;
  const live = !!room && !room.ended;
  let step: AdvanceStep = last ? "finish" : "next";
  if (live && room.started) {
    const showFirst =
      hasRevealMode(question.type) &&
      (question.revealMode !== "live" || canCompete(question.type)) &&
      !room.revealed;
    const showRanking =
      !showFirst &&
      !last &&
      canCompete(question.type) &&
      question.showRanking !== false &&
      !room.ranking;
    const showPodium =
      !showFirst && last && room.scored && !room.podium && !room.suspense;
    step = showFirst
      ? "results"
      : showRanking
        ? "ranking"
        : showPodium
          ? "podium"
          : step;
  }
  const blocked = busy || (!!room && room.suspense && !room.podium);

  function advance() {
    if (blocked) return;
    if (step === "results") void control("reveal");
    else if (step === "ranking") void control("ranking");
    else if (step === "podium") void control("suspense");
    else if (step === "finish") {
      if (live) setModal("end");
    } else move(1);
  }

  return { step, last, blocked, advance };
}
