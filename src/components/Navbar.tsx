import ToolbarButton from "./ToolbarButton";

type Props = {
  onUploadClick?: () => void;
  onCurrentTaskClick?: () => void;
  onOpenClipTool?: () => void;
  onOpenBufferTool?: () => void;
  onOpenIntersectTool?: () => void;
  onOpenUnionTool?: () => void;
  onOpenDiffTool?: () => void;
  onOpenAreaFilterTool?: () => void;
};

export default function Navbar({
  onCurrentTaskClick,
  onUploadClick,
  onOpenClipTool,
  onOpenBufferTool,
  onOpenDiffTool,
  onOpenIntersectTool,
  onOpenUnionTool,
  onOpenAreaFilterTool,
}: Props) {
  return (
    <nav className="toolbar">
      <ToolbarButton id="tool-upload" icon="⬆️" label="Last opp data" onClick={onUploadClick} />
      <div className="toolbar-sep" />
      <ToolbarButton id="tool-buffer" icon="🫧" label="Buffer" onClick={onOpenBufferTool} />
      <ToolbarButton
        id="tool-intersect"
        icon="🔀"
        label="Intersect"
        onClick={onOpenIntersectTool}
      />
      <ToolbarButton id="tool-union" icon="➕" label="Union" onClick={onOpenUnionTool} />
      <ToolbarButton id="tool-diff" icon="➖" label="Difference" onClick={onOpenDiffTool} />
      <ToolbarButton id="tool-clip" icon="✂️" label="Clip" onClick={onOpenClipTool} />
      <ToolbarButton id="tool-area" icon="📐" label="Area Filter" onClick={onOpenAreaFilterTool} />

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
