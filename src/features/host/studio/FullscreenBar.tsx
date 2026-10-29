import { ChevronLeft, ChevronRight, Minimize } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "../../../components/IconButton";
import { useHost } from "../HostContext";
import { LiveControls } from "./LiveControls";
import { useAdvance } from "./useAdvance";

const IDLE_MS = 2500;

/** Host controls for full screen mode; shown only while the pointer moves, so they never cover the slide. */
export function FullscreenBar() {
  const { busy, room, currentIndex, questionList, move, fullscreen, modal } =
    useHost();
  const { advance } = useAdvance();
  const [visible, setVisible] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const isLive = !!room && !room.ended;
  const inLobby = isLive && !room.started;

  // Mouse movement only; live updates re-render often and must not reset the timer.
  useEffect(() => {
    let timer = 0;
    const wake = () => {
      setVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const active = document.activeElement;
        // Keep the bar while a keyboard user is focused inside it.
        if (!(
          bar.current?.contains(active) && active?.matches(":focus-visible")
        ))
          setVisible(false);
      }, IDLE_MS);
    };
    window.addEventListener("pointermove", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
    };
  }, []);

  // Always call the latest handler without re-subscribing on each render.
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keys.current = (event) => {
      const target = event.target as HTMLElement | null;
      if (
        modal ||
        inLobby ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        target?.closest("input, textarea, select, [contenteditable]")
      )
        return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        advance();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        if (currentIndex > 0 && !busy) move(-1);
      }
    };
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={bar}
      className={`fullscreen-bar ${visible ? "visible" : ""}`}
      role="toolbar"
      aria-label="Presentation controls"
    >
      {!inLobby && (
        <div className="slide-pagination">
          <IconButton
            icon={ChevronLeft}
            label="Previous question"
            disabled={currentIndex === 0 || busy}
            onClick={() => move(-1)}
          />
          <span>
            {currentIndex + 1}{" "}
            <span className="muted">/ {questionList.length}</span>
          </span>
          <IconButton
            icon={ChevronRight}
            label="Next question"
            disabled={currentIndex === questionList.length - 1 || busy}
            onClick={() => move(1)}
          />
        </div>
      )}
      {isLive && !inLobby && <LiveControls />}
      <IconButton
        icon={Minimize}
        label="Exit full screen (Esc)"
        onClick={() => void fullscreen.exit()}
      />
    </div>
  );
}
