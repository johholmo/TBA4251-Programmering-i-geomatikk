import { useLayers } from "../stores/layers";

export default function Sidebar() {
  const layers = useLayers((s) => s.layers);
  const toggleVisible = useLayers((s) => s.toggleVisible);
  const setColor = useLayers((s) => s.setColor);
  const removeLayer = useLayers((s) => s.removeLayer);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 style={{ margin: 0 }}>Lag</h3>
      </div>

      {layers.length === 0 ? (
        <div className="sidebar-empty">Ingen lag lastet enda. Bruk “Last opp data”.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {layers.map((l) => (
            <li key={l.id} className="layer-row">
              <button
                className={`eye ${l.visible ? "on" : "off"}`}
                title={l.visible ? "Skjul lag" : "Vis lag"}
                onClick={() => toggleVisible(l.id)}
              >
                {l.visible ? "👁️" : "🚫"}
              </button>

              <input
                type="color"
                className="color"
                value={toHex(l.color)}
                onChange={(e) => setColor(l.id, e.target.value)}
                title="Endre farge"
              />

              <div className="name" title={l.name}>{l.name}</div>

              <button className="row-remove" title="Fjern lag" onClick={() => removeLayer(l.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Sikrer at farge alltid er hex (#rrggbb)
function toHex(c: string) {
  if (c.startsWith("#")) return c;
  // fallback – bare returner original hvis ikke hex
  return c;
}
