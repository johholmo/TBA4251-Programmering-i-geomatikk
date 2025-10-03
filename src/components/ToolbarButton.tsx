type Props = {
    icon?: string;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
  };
  
  export default function ToolbarButton({ icon, label, onClick, disabled }: Props) {
    return (
      <button
        className="btn"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        type="button"
      >
        {icon ? <span className="btn-icon" aria-hidden>{icon}</span> : null}
        <span className="btn-label">{label}</span>
      </button>
    );
  }
  