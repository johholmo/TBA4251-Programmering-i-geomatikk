import ToolbarButton from "./ToolbarButton";

type Props = {
  onUploadClick?: () => void;
  onCurrentTaskClick?: () => void;
};

export default function Navbar({ onCurrentTaskClick, onUploadClick }: Props) {
  return (
    <nav className="toolbar">
      <ToolbarButton id="tool-upload" icon="⬆️" label="Last opp data" onClick={onUploadClick} />
      <div className="toolbar-sep" />
      <ToolbarButton id="tool-buffer" icon="🫧" label="Buffer" onClick={() => alert("Kommer snart")} />
      <ToolbarButton id="tool-intersect" icon="🔀" label="Intersect" onClick={() => alert("Kommer snart")} />
      <ToolbarButton id="tool-union" icon="➕" label="Union" onClick={() => alert("Kommer snart")} />
      <ToolbarButton id="tool-diff" icon="➖" label="Difference" onClick={() => alert("Kommer snart")} />
      <ToolbarButton id="tool-clip" icon="✂️" label="Clip" onClick={() => alert("Kommer snart")} />

      <div className="toolbar-spacer" />

      <ToolbarButton
        id="tool-current-task"
        className="toolbar-chip"
        icon="🧠"
        label="Pågående oppgave"
        onClick={onCurrentTaskClick}
      />
    </nav>
  );
}
