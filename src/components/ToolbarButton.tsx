type Props = {
  id?: string;
  icon?: string;
  label: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

export default function ToolbarButton({ id, icon, label, onClick, className, disabled }: Props) {
  return (
    <button
      id={id}
      className={`btn ${className ?? ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      type="button"
    >
      {icon ? (
        <span className="btn-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="btn-label">{label}</span>
    </button>
  );
}
