import { Check, Copy, ExternalLink, Link } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { IconButton } from "../../components/IconButton";
import { useJoinUrl } from "../../hooks/useJoinUrl";

export function ShareDetails({
  code,
  nameless = false,
  inline = false,
}: {
  code: string;
  nameless?: boolean;
  inline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const linkInput = useRef<HTMLInputElement>(null);
  const url = useJoinUrl(code, nameless);
  const participantPath = `/join?code=${code}${nameless ? "&nameless=1" : ""}`;
  async function copy() {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
      linkInput.current?.focus();
      linkInput.current?.select();
      setCopyError("Copy the link from the field below.");
    }
  }
  return (
    <div className={`share-content ${inline ? "lobby-share" : ""}`}>
      {!inline && <p className="muted">Your session is ready for company.</p>}
      <div className="qr-frame">
        <QRCodeSVG
          value={url}
          size={inline ? 208 : 180}
          marginSize={4}
          title="Join session QR code"
          fgColor="#183d35"
          level="M"
        />
      </div>
      <span className="eyebrow">ROOM CODE</span>
      <strong className="share-code">
        {code.slice(0, 3)} {code.slice(3)}
      </strong>
      <label className="share-link">
        <Link size={17} />
        <input
          ref={linkInput}
          aria-label="Participant link"
          value={url}
          readOnly
          onFocus={(event) => event.target.select()}
        />
        <IconButton
          icon={copied ? Check : Copy}
          label="Copy participant link"
          onClick={copy}
        />
      </label>
      <p className="copy-feedback" role="status">
        {copyError || (copied ? "Link copied" : "")}
      </p>
      <p className="muted small">
        On a local server, participants need the same Wi-Fi.
      </p>
      <a
        className={inline ? "lobby-open-link" : "button primary full"}
        href={participantPath}
        target="_blank"
        rel="noreferrer"
      >
        Open participant view
        <ExternalLink size={16} />
      </a>
    </div>
  );
}
