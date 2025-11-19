import { useEffect, useRef } from "react";

type Action = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
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
};

export default function Popup({ isOpen, onClose, title, actions = [], children, width }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

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
      <div className={`modal ${width === "narrow" ? "modal--narrow" : ""}`} ref={dialogRef}>
        <div className="modal-header" style={{ background: "var(--brand)" }}>
          <h2 className="modal-title">{title}</h2>

          <button className="modal-close" onClick={onClose} aria-label="Lukk">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-content">{children}</div>
        </div>

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
              disabled={a.disabled || a.loading}
              aria-busy={a.loading ? true : undefined}
            >
              {a.loading ? <span className="btn-spinner" aria-hidden="true" /> : a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
