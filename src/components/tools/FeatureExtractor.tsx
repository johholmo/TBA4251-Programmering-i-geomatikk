import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import { useLayers } from "../../context/LayersContext";
import Popup, { type Action } from "../popup/Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Typer av operasjoner for regler
type Operation = "=" | "≠" | "<" | ">";

type Rule = {
  property: string;
  op: Operation | "";
  value: string;
};

// Filtrerer et lag basert på attributtverdier
export default function FeatureExtractor({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();

  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [rules, setRules] = useState<Rule[]>([{ property: "", op: "", value: "" }]);
  const [uniqueProperties, setUniqueProperties] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const operations: Operation[] = ["=", "≠", "<", ">"];

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  // Lukk dropdown når man klikker utenfor
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (isListOpen && listRef.current && !listRef.current.contains(target)) {
        setIsListOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isListOpen]);

  // Reset når det lukkes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLayerId("");
      setRules([{ property: "", op: "", value: "" }]);
      setUniqueProperties([]);
      setBusy(false);
      setError(null);
      setIsListOpen(false);
    }
  }, [isOpen]);

  // Finn attributtnavn
  useEffect(() => {
    if (!selectedLayer) {
      setUniqueProperties([]);
      return;
    }
    const propsSet = new Set<string>();
    for (const f of selectedLayer.geojson4326.features) {
      const props = f.properties || {};
      Object.keys(props).forEach((key) => propsSet.add(key));
    }
    setUniqueProperties(Array.from(propsSet).sort());
  }, [selectedLayer]);

  function updateRule(index: number, patch: Partial<Rule>) {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRule() {
    setRules((prev) => [...prev, { property: "", op: "", value: "" }]);
  }

  function removeRule(idx: number) {
    if (rules.length === 1) return;
    setRules((prev) => prev.filter((_, i) => i !== idx));
  }

  // Lik-logikk
  function matchesRule(f: Feature<Geometry>, rule: Rule): boolean {
    if (!rule.property || !rule.op || rule.value.trim() === "") return true;
    const props = (f.properties || {}) as Record<string, unknown>;
    const raw = props[rule.property];

    if (raw === undefined || raw === null) return false;

    const strVal = rule.value.trim();
    const targetNum = Number(strVal);
    const isNumTarget = !Number.isNaN(targetNum);

    if (rule.op === "=" || rule.op === "≠") {
      const rawNum = typeof raw === "number" ? raw : Number(raw);
      const rawIsNum = typeof raw === "number" || !Number.isNaN(rawNum);

      const equal = isNumTarget && rawIsNum ? rawNum === targetNum : String(raw) === strVal;

      return rule.op === "=" ? equal : !equal;
    }

    // < eller > logikk
    if (!isNumTarget) return false;
    const rawNum = typeof raw === "number" ? raw : Number(raw as unknown as string);
    if (Number.isNaN(rawNum)) return false;

    if (rule.op === "<") return rawNum < targetNum;
    if (rule.op === ">") return rawNum > targetNum;
    return false;
  }

  function matchesAll(f: Feature<Geometry>): boolean {
    return rules.every((r) => matchesRule(f, r));
  }

  function handleExtract() {
    if (!selectedLayer) {
      setError("Velg et lag først.");
      return;
    }

    const validRules = rules.filter((r) => r.property && r.op && r.value.trim() !== "");
    if (!validRules.length) {
      setError("Legg til minst én regel.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const fc = selectedLayer.geojson4326 as FeatureCollection<Geometry>;
      const filtered = fc.features.filter((f) => matchesAll(f));

      if (!filtered.length) {
        setError("Ingen objekter matcher reglene.");
        setBusy(false);
        return;
      }

      addLayer({
        name: `${selectedLayer.name}_filter`,
        geojson4326: { type: "FeatureCollection", features: filtered },
        color: selectedLayer.color,
        visible: true,
      });

      setBusy(false);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError("Kunne ikke filtrere.");
      setBusy(false);
    }
  }

  const hasLayers = layers.length > 0;

  // Knapper i popup
  const actions: Action[] = busy
    ? []
    : [
        { label: "Lukk", variant: "secondary", onClick: onClose },
        {
          label: "Filtrer",
          variant: "primary",
          onClick: handleExtract,
          disabled: !selectedLayerId,
        },
      ];

  if (!isOpen) return null;

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Feature extractor"
      width="normal"
      actions={actions}
      hideCloseIcon={busy}
    >
      {busy ? (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">Filtrerer attributter…</div>
        </div>
      ) : !hasLayers ? (
        <div className="warning-message">Du må ha minst ett lag for å bruke verktøyet.</div>
      ) : (
        <div className="choose-layer-container">
          {/* Lagvalg */}
          <div className="field-group">
            <div className="choose-layer-text">Velg lag</div>
            <div className="dropdown" ref={listRef}>
              <button
                type="button"
                className="dropdown-toggle"
                style={{ borderRadius: isListOpen ? "8px 8px 0 0" : "8px" }}
                onClick={() => setIsListOpen((x) => !x)}
              >
                <span className="dropdown-text">
                  {selectedLayer ? selectedLayer.name : "Velg lag…"}
                </span>
                <span aria-hidden className="dropdown-hidden">
                  ▾
                </span>
              </button>

              {isListOpen && (
                <div className="clip-dropdown-scroll">
                  {layers.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelectedLayerId(l.id);
                        setIsListOpen(false);
                      }}
                      className="popup-buttons"
                    >
                      <span className="layer-color-dot" style={{ backgroundColor: l.color }} />
                      <span className="layer-name-text">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Regler */}
          {selectedLayer && uniqueProperties.length > 0 && (
            <>
              <div className="fe-rules-header">
                <div className="choose-layer-text">Regler</div>
                <span className="fe-rules-hint">
                  Legger du til flere regler så vil alle gjelde.{" "}
                </span>
              </div>

              <div className="fe-rules">
                {rules.map((rule, idx) => (
                  <div key={idx} className="fe-rule-row">
                    {/* Property */}
                    <select
                      className="popup-input"
                      value={rule.property}
                      onChange={(e) => updateRule(idx, { property: e.target.value })}
                    >
                      <option value="">Attributt…</option>
                      {uniqueProperties.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      className="popup-input"
                      value={rule.op}
                      onChange={(e) => updateRule(idx, { op: e.target.value as Operation })}
                    >
                      <option value="">Op.</option>
                      {operations.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>

                    {/* Value */}
                    <input
                      type="text"
                      className="popup-input"
                      placeholder="Verdi"
                      value={rule.value}
                      onChange={(e) => updateRule(idx, { value: e.target.value })}
                    />

                    {/* Fjern-regel */}
                    <button
                      type="button"
                      className="selected-layer-remove"
                      onClick={() => removeRule(idx)}
                      disabled={rules.length === 1}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="fe-add-rule-btn" onClick={addRule}>
                <span className="fe-add-rule-btn-icon">+</span>
                <span>Legg til regel</span>
              </button>
            </>
          )}

          {selectedLayer && uniqueProperties.length === 0 && (
            <div className="warning-message">Dette laget inneholder ingen attributter.</div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </Popup>
  );
}
