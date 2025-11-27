import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { useLayers } from "../../context/LayersContext";
import Popup, { type Action } from "../popup/Popup";
import { runBuffer } from "../../workers/geoworkerClient";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Lager buffer rundt valgte geometrier (via worker)
export default function Buffer({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [bufferDistance, setBufferDistance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Lukk dropdown ved klikk utenfor
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (isListOpen && listRef.current && !listRef.current.contains(e.target as Node)) {
        setIsListOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isListOpen]);

  // Reset felt når popupen lukkes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLayerId("");
      setBufferDistance("");
      setError(null);
      setIsListOpen(false);
      setBusy(false);
    }
  }, [isOpen]);

  // Funksjon for å håndtere selve bufferingen
  async function handleBuffer() {
    const distance = parseFloat(bufferDistance);
    if (!selectedLayerId || distance <= 0 || busy) return;
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (!layer) {
      setError("Fant ikke valgt lag.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { fc4326 } = await runBuffer(
        layer.geojson4326 as FeatureCollection<Geometry>,
        distance
      );
      if (!fc4326.features.length) {
        throw new Error("Buffer ga tomt resultat.");
      }
      addLayer({
        name: `${layer.name}_BUFFER_${distance}m`,
        geojson4326: fc4326,
        color: layer.color,
        visible: true,
      });
      setBusy(false);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Klarte ikke å lage buffer.");
      setBusy(false);
    }
  }

  if (!isOpen) return null;

  const hasLayers = layers.length > 0;
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;
  const distanceNumber = parseFloat(bufferDistance);

  // Knappene i popupen
  const actions: Action[] = busy
    ? []
    : [
        {
          label: "Lukk",
          variant: "secondary",
          onClick: onClose,
          disabled: busy,
        },
        {
          label: "Lag buffer",
          variant: "primary",
          onClick: handleBuffer,
          disabled: busy || !selectedLayerId || !(distanceNumber > 0),
        },
      ];

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Buffer"
      width="narrow"
      actions={actions}
      hideCloseIcon={busy}
    >
      {busy ? (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">Lager buffer… </div>
        </div>
      ) : !hasLayers ? (
        <div className="warning-message">Du må laste opp data før du kan lage buffer.</div>
      ) : (
        <div className="choose-layer-container">
          {/* Velg lag */}
          <div className="field-group">
            <div className="choose-layer-text">Velg laget du vil lage buffer rundt</div>
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
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: l.color,
                        }}
                      />
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Buffer-avstand */}
          <div className="field-group">
            <label className="choose-layer-text">Buffer-avstand (meter)</label>
            <input
              type="number"
              min={1}
              value={bufferDistance}
              onChange={(e) => setBufferDistance(e.target.value)}
              className="input-number"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </Popup>
  );
}
