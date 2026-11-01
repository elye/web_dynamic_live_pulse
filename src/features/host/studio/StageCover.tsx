import { ArrowRight } from "lucide-react";
import { useState } from "react";

/**
 * The host's unwashed background image, laid over the stage. It fades in and
 * out, so the screen beneath is revealed (opening) or covered (closing).
 */
export function StageCover({
  kind,
  onNext,
}: {
  /** Which cover is wanted now; null fades the cover out. */
  kind: "opening" | "closing" | null;
  onNext: () => void;
}) {
  // Remember the last kind so the cover keeps its content while it fades out.
  const [shown, setShown] = useState(kind ?? "opening");
  if (kind && kind !== shown) setShown(kind);
  return (
    <section
      className="stage-cover"
      data-visible={kind ? "" : undefined}
      aria-label={shown === "opening" ? "Opening image" : "Closing image"}
    >
      {shown === "opening" && (
        <button type="button" className="cover-next" onClick={onNext}>
          Next
          <ArrowRight size={15} />
        </button>
      )}
    </section>
  );
}
