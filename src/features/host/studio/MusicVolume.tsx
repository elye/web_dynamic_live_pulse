import { Volume1, Volume2, VolumeX } from "lucide-react";
import { useHost } from "../HostContext";

/** Mute button and volume slider for the session music; renders nothing when no music is chosen. */
export function MusicVolume() {
  const { music } = useHost();
  if (!music.track) return null;
  const silent = music.muted || music.volume === 0;
  const Icon = silent ? VolumeX : music.volume < 50 ? Volume1 : Volume2;
  return (
    <div className="music-volume" role="group" aria-label="Music volume">
      <button
        type="button"
        className="icon-button"
        aria-label={silent ? "Unmute music" : "Mute music"}
        title={silent ? "Unmute music" : "Mute music"}
        onClick={() => {
          if (music.volume === 0) music.setVolume(70);
          else music.setMuted(!music.muted);
        }}
      >
        <Icon size={18} />
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={music.muted ? 0 : music.volume}
        aria-label="Music volume"
        onChange={(event) => music.setVolume(Number(event.target.value))}
      />
    </div>
  );
}
