import { createContext, useContext } from "react";
import type { ParticipantController } from "./useParticipantController";

export const ParticipantContext = createContext<ParticipantController | null>(
  null,
);

/** Read the participant controller (state + actions) provided by `<Participant>`. */
export function useParticipant(): ParticipantController {
  const controller = useContext(ParticipantContext);
  if (!controller)
    throw new Error("useParticipant must be used inside <Participant>");
  return controller;
}
