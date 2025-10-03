import ToolbarButton from "./ToolbarButton";

export default function Navbar() {
  // Foreløpig: bare knapper uten funksjon. Knyttes opp senere.
  return (
    <nav className="toolbar">
      <ToolbarButton icon="⬆️" label="Last opp data" onClick={() => alert("Upload…")} />
      <div className="toolbar-sep" />
      <ToolbarButton icon="🫧" label="Buffer" onClick={() => alert("Buffer…")} />
      <ToolbarButton icon="🔀" label="Intersect" onClick={() => alert("Intersect…")} />
      <ToolbarButton icon="➕" label="Union" onClick={() => alert("Union…")} />
      <ToolbarButton icon="➖" label="Difference" onClick={() => alert("Difference…")} />
      <ToolbarButton icon="✂️" label="Clip" onClick={() => alert("Clip…")} />
      <div className="toolbar-spacer" />
      <span className="toolbar-chip">Gjeldende oppgave: Velkommen</span>
    </nav>
  );
}
