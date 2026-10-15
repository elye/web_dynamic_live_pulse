import { Check, WifiOff, X } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { useHost } from "../HostContext";

export function StatusBanners() {
  const { notice, connected, error, setError } = useHost();
  return (
    <>
      {!connected && (
        <div className="connection-banner">
          <WifiOff size={16} />
          Connecting to the live server. Your draft is saved on this device.
        </div>
      )}
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
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
    </>
  );
}
