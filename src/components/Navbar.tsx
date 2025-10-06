import ToolbarButton from "./ToolbarButton";

type Props = {
    onStartTour?: () => void;
  };

export default function Navbar() {
  // TODO: Legge til funksjon på hver av knappene her
  return (
    <nav className="toolbar">
      <ToolbarButton id="tool-upload" icon="⬆️" label="Last opp data" onClick={() => alert("Her mangler funksjonalitet foreløpig")} />
      <div className="toolbar-sep" />
      <ToolbarButton id="tool-buffer" icon="🫧" label="Buffer" onClick={() => alert("Her mangler funksjonalitet foreløpig")} />
      <ToolbarButton id="tool-intersect" icon="🔀" label="Intersect" onClick={() => alert("Her mangler funksjonalitet foreløpig")} />
      <ToolbarButton id="tool-union" icon="➕" label="Union" onClick={() => alert("Her mangler funksjonalitet foreløpig")} />
      <ToolbarButton id="tool-diff" icon="➖" label="Difference" onClick={() => alert("Her mangler funksjonalitet foreløpig")} />
      <ToolbarButton id="tool-clip" icon="✂️" label="Clip" onClick={() => alert("Her mangler funksjonalitet foreløpig")} />
<div className="toolbar-spacer" />
      <ToolbarButton id="tool-current-task" className="toolbar-chip" icon="🧠" label="Pågående oppgave" onClick={() => alert("Her mangler funksjonalitet foreløpig")} />
    </nav>
  );
}
