import { type LucideIcon } from "lucide-react";

export function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={18} />
    </button>
  );
}
