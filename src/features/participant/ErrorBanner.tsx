import { X } from "lucide-react";
import { IconButton } from "../../components/IconButton";
import { useParticipant } from "./ParticipantContext";

export function ErrorBanner() {
  const { error, setError } = useParticipant();
  return (
    <>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <IconButton
            icon={X}
            label="Dismiss error"
            onClick={() => setError("")}
          />
        </div>
      )}
    </>
  );
}
