import { useEffect, useRef } from "react";

// Typer handlinger -> nederst i popupen som knapper
export type Action = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actions?: Action[];
  children?: React.ReactNode;
  width?: "normal" | "narrow";
  hideCloseIcon?: boolean;
};

// Felles popup komponent for å bruke i alle oppgaver og verktøy
export default function Popup({
  isOpen,
  onClose,
  title,
  actions = [],
  children,
  width,
  hideCloseIcon,
}: Props) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Lukker hvis brukeren trykker "esc"
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
      role="popup"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(e) => {
        // clukker hvis det trykkes utenfor popupen
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal ${width === "narrow" ? "modal--narrow" : ""}`} ref={popupRef}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {!hideCloseIcon && (
            <button className="modal-close" onClick={onClose} aria-label="Lukk">
              ✕
            </button>
          )}
        </div>

        <div className="modal-body">
          <div className="modal-content">{children}</div>
        </div>

        {/* Knapper */}
        <div className="modal-actions">
          {actions.map((a, i) => (
            <button
              key={i}
              className={`btn ${
                a.variant === "primary"
                  ? "btn-primary"
                  : a.variant === "secondary"
                    ? "btn-secondary"
                    : "btn-ghost"
              }`}
              onClick={a.onClick}
              type="button"
              disabled={a.disabled}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
