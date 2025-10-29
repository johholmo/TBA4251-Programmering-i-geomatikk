import { useEffect, useRef, useState } from "react";

type Action = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  step?: number;
  totalSteps?: number;
  highlightColor?: string; // farge på headerstripe
  hintContent?: React.ReactNode; // vises når bruker trykker "Trenger hint?"
  actions?: Action[];
  children?: React.ReactNode;
};

export default function Popup({
  isOpen,
  onClose,
  title,
  step,
  totalSteps,
  highlightColor = "var(--ink-200)",
  hintContent,
  actions = [],
  children,
}: Props) {
  const [showHint, setShowHint] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasSteps = typeof step === "number" && typeof totalSteps === "number";

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(e) => {
        // close when clicking outside content
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" ref={dialogRef}>
        <div className="modal-header" style={{ background: highlightColor }}>
          {hasSteps && (
            <div className="modal-step">
              <span>
                Steg {step} av {totalSteps}
              </span>
            </div>
          )}

          <h2 className="modal-title">{title}</h2>

          <button className="modal-close" onClick={onClose} aria-label="Lukk">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-content">{children}</div>

          {hintContent && (
            <div className="modal-hint">
              <button className="link-btn" onClick={() => setShowHint((s) => !s)}>
                {showHint ? "Skjul hint" : "Trenger hint?"}
              </button>
              {showHint && <div className="hint-box">{hintContent}</div>}
            </div>
          )}
        </div>

        <div className="modal-actions">
          {actions.map((a, i) => (
            <button
              key={i}
              className={`btn ${a.variant === "primary" ? "btn-primary" : a.variant === "secondary" ? "btn-secondary" : "btn-ghost"}`}
              onClick={a.onClick}
              type="button"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
