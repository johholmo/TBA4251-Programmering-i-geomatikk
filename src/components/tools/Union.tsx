import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { useLayers } from "../../context/LayersContext";
import Popup, { type Action } from "../popup/Popup";
import NamingPopup from "../popup/NamingPopup";
import { isPoly } from "../../utils/geomaticFunctions";
import { toTransparent } from "../../utils/commonFunctions";
import { runUnion } from "../../workers/geoworkerClient";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Slå sammen flere polygonlag til ett lag, med worker
export default function Union({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [showNaming, setShowNaming] = useState(false);
  const [pendingUnion, setPendingUnion] = useState<FeatureCollection<Geometry> | null>(null);
  const [pendingColor, setPendingColor] = useState<string | undefined>(undefined);

  // Kun polygonlag
  const polygonLayers = layers.filter((l) =>
    l.geojson4326.features.some((f) => isPoly(f.geometry))
  );
  const selectableLayers = polygonLayers.filter((l) => !selectedIds.includes(l.id));
  const hasLayers = polygonLayers.length > 1;

  // Lukk ved klikk utenfor
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

  // Reset felt når popupen lukkes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setIsListOpen(false);
      setBusy(false);
      setError(null);
      setShowNaming(false);
      setPendingUnion(null);
      setPendingColor(undefined);
    }
  }, [isOpen]);

  // Legg til valgte lag
  function addSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  // Fjern valgte lag
  function removeSelected(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  // Håndterer selve union-operasjonen via worker
  async function handleUnion() {
    if (selectedIds.length < 2 || busy) return;

    const chosenLayers = layers.filter((l) => selectedIds.includes(l.id));
    if (chosenLayers.length < 2) {
      setError("Velg minst to lag med polygon-geometrier.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const layerFcs: FeatureCollection<Geometry>[] = chosenLayers.map(
        (l) => l.geojson4326 as FeatureCollection<Geometry>
      );

      const { fc4326 } = await runUnion(layerFcs);

      if (!fc4326.features.length) {
        throw new Error("Union ga tomt resultat.");
      }

      setPendingUnion(fc4326);
      setPendingColor(chosenLayers[0].color);
      setShowNaming(true);
      setBusy(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Klarte ikke å lage union.");
      setBusy(false);
    }
  }

  function handleNameConfirm(name: string) {
    if (pendingUnion) {
      addLayer({
        name,
        geojson4326: pendingUnion,
        color: pendingColor,
        visible: true,
      });
      setPendingUnion(null);
      setPendingColor(undefined);
      setShowNaming(false);
      onClose();
    }
  }

  if (!isOpen && !showNaming) return null;

  // Knappene i popupen
  const actions: Action[] = busy
    ? []
    : [
        { label: "Lukk", variant: "secondary", onClick: onClose, disabled: busy },
        {
          label: "Slå sammen",
          variant: "primary",
          onClick: handleUnion,
          disabled: busy || selectedIds.length < 2,
        },
      ];

  return (
    <>
      <Popup
        isOpen={isOpen}
        onClose={onClose}
        title="Union"
        width="narrow"
        actions={actions}
        hideCloseIcon={busy}
      >
        {busy ? (
          <div className="busy-container">
            <div className="spinner" />
            <div className="busy-text">Slår sammen... </div>
          </div>
        ) : !hasLayers ? (
          <div className="warning-message">
            Du må ha minst to lag med polygon-geometrier for å lage union.
          </div>
        ) : (
          <div className="choose-layer-container">
            <div className="field-group">
              {/* Velg lag */}
              <div className="choose-layer-text">Velg lag som skal slås sammen</div>

              {selectedIds.length > 0 && (
                <div className="selected-layers">
                  {selectedIds.map((id) => {
                    const l = layers.find((x) => x.id === id);
                    const bgColor = l?.color ?? "#f3efe6";

                    return (
                      <span
                        key={id}
                        className="selected-layer-chip"
                        style={{ backgroundColor: toTransparent(bgColor, 0.8) }}
                      >
                        {l?.name ?? "Ukjent lag"}
                        <button
                          type="button"
                          className="selected-layer-remove"
                          onClick={() => removeSelected(id)}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Dropdown for å legge til flere lag */}
              <div className="dropdown" ref={listRef}>
                <button
                  type="button"
                  className="dropdown-toggle"
                  style={{ borderRadius: isListOpen ? "8px 8px 0 0" : "8px" }}
                  onClick={() => setIsListOpen((x) => !x)}
                >
                  <span className="dropdown-text">
                    {selectableLayers.length === 0 ? "Alle lag er valgt" : "Legg til lag i union…"}
                  </span>
                  <span aria-hidden className="dropdown-hidden">
                    ▾
                  </span>
                </button>

                {isListOpen && selectableLayers.length > 0 && (
                  <div className="clip-dropdown-scroll">
                    {selectableLayers.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => addSelected(l.id)}
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

            {error && <div className="error-message">{error}</div>}
          </div>
        )}
      </Popup>

      <NamingPopup
        isOpen={showNaming}
        onClose={() => setShowNaming(false)}
        onConfirm={handleNameConfirm}
        defaultValue=""
        title="Navngi union-lag"
        label="Skriv inn navn på det nye union-laget:"
      />
    </>
  );
}
