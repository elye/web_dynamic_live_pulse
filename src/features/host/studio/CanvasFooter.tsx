import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Music,
  Users,
  X,
} from "lucide-react";
import { useRef } from "react";
import { IconButton } from "../../../components/IconButton";
import { useHost } from "../HostContext";
import { DEFAULT_WASH } from "./background";
import { MusicVolume } from "./MusicVolume";

export function CanvasFooter() {
  const {
    busy,
    room,
    session,
    currentIndex,
    questionList,
    updateSession,
    move,
    backgrounds,
    setBackground,
    washes,
    setWash,
    music,
  } = useHost();
  const fileInput = useRef<HTMLInputElement>(null);
  const musicInput = useRef<HTMLInputElement>(null);
  const hasBackground = !!backgrounds[session.id];
  const isLive = !!room && !room.ended;
  const inLobby = isLive && !room.started;
  return (
    <div className="canvas-footer" hidden={inLobby}>
      {isLive ? (
        <span className="audience-count">
          <Users size={17} />
          <strong>{room.participants}</strong> joined{" "}
          <span className="separator">·</span>
          <span className={room.accepting ? "live-indicator" : ""}>
            {inLobby
              ? "Welcome lobby"
              : room.accepting
                ? "Accepting responses"
                : "Responses paused"}
          </span>
        </span>
      ) : (
        <div className="theme-picker">
          <span>Slide mood</span>
          {["mint", "peach", "lilac", "sky"].map((theme) => (
            <button
              aria-label={`${theme} theme`}
              aria-pressed={session.theme === theme}
              title={`${theme} theme`}
              className={`theme-swatch theme-${theme} ${session.theme === theme ? "chosen" : ""}`}
              onClick={() => updateSession({ theme })}
              key={theme}
            >
              {session.theme === theme && <Check size={13} />}
            </button>
          ))}
          <button
            type="button"
            className="bg-image-button"
            title="Choose a background image (kept until you reload)"
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus size={13} />
            {hasBackground ? "Change image" : "Image"}
          </button>
          {hasBackground && (
            <button
              type="button"
              className="bg-image-button"
              aria-label="Remove background image"
              title="Remove background image"
              onClick={() => setBackground(null)}
            >
              <X size={13} />
            </button>
          )}
          {hasBackground && (
            <label className="bg-wash">
              Wash
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={washes[session.id] ?? DEFAULT_WASH}
                aria-label="Background wash opacity"
                onChange={(event) => setWash(Number(event.target.value))}
              />
            </label>
          )}
          <button
            type="button"
            className="bg-image-button"
            title="Choose music to play during the session (kept until you reload)"
            onClick={() => musicInput.current?.click()}
          >
            <Music size={13} />
            {music.track ? "Change music" : "Music"}
          </button>
          {music.track && (
            <>
              <span className="music-name" title={music.track.name}>
                {music.track.name}
              </span>
              <button
                type="button"
                className="bg-image-button"
                aria-label="Remove music"
                title="Remove music"
                onClick={() => music.setTrack(null)}
              >
                <X size={13} />
              </button>
              <MusicVolume />
            </>
          )}
          <input
            ref={musicInput}
            type="file"
            accept="audio/*"
            hidden
            aria-label="Session music"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) music.setTrack(file);
              event.target.value = "";
            }}
          />
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            aria-label="Background image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setBackground(file);
              event.target.value = "";
            }}
          />
        </div>
      )}
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
    </div>
  );
}
