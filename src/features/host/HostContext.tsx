import { createContext, useContext } from "react";
import type { HostController } from "./useHostController";

export const HostContext = createContext<HostController | null>(null);

/** Read the host controller (state + actions) provided by `<Host>`. */
export function useHost(): HostController {
  const controller = useContext(HostContext);
  if (!controller) throw new Error("useHost must be used inside <Host>");
  return controller;
}
