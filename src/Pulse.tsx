import { Host } from "./features/host/Host";
import { Participant } from "./features/participant/Participant";

export default function Pulse() {
  return window.location.pathname.startsWith("/join") ? (
    <Participant />
  ) : (
    <Host />
  );
}
