import { Zap } from "lucide-react";

export function Logo() {
  return (
    <a className="logo" href="/" aria-label="Pulse home">
      <span className="logo-symbol">
        <Zap size={24} fill="currentColor" strokeWidth={1.5} />
      </span>
      pulse<span className="logo-period">.</span>
    </a>
  );
}
