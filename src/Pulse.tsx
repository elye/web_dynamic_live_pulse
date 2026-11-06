import { lazy, Suspense } from "react";

const Host = lazy(() =>
  import("./features/host/Host").then(({ Host }) => ({ default: Host })),
);
const Participant = lazy(() =>
  import("./features/participant/Participant").then(({ Participant }) => ({
    default: Participant,
  })),
);

export default function Pulse() {
  const page = window.location.pathname.startsWith("/join") ? (
    <Participant />
  ) : (
    <Host />
  );

  return <Suspense fallback={null}>{page}</Suspense>;
}
