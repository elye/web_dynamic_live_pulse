import { QRCodeSVG } from "qrcode.react";
import { useJoinUrl } from "../hooks/useJoinUrl";

/** Small join QR pinned to the top right of a live slide. */
export function JoinQr({ code }: { code: string }) {
  const url = useJoinUrl(code);
  return (
    <div
      className="join-qr"
      title={`Join at ${code.slice(0, 3)} ${code.slice(3)}`}
    >
      <QRCodeSVG
        value={url}
        size={96}
        marginSize={1}
        title="Join session QR code"
        fgColor="#183d35"
        level="M"
      />
      <span>Scan to join</span>
      <strong>
        {code.slice(0, 3)} {code.slice(3)}
      </strong>
    </div>
  );
}
