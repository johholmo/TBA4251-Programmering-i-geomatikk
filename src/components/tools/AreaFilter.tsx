import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { useLayers } from "../../context/LayersContext";
import Popup, { type Action } from "../popup/Popup";
import { isPoly } from "../../utils/geomaticFunctions";
import { runAreaFilter } from "../../workers/geoworkerClient";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Store sammenhengende områder med worker
export default function AreaFilter({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();

  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [minArea, setMinArea] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const polygonLayers = layers.filter((l) =>
    l.geojson4326.features.some((f) => isPoly(f.geometry))
  );
  const hasLayers = polygonLayers.length > 0;
  const selectedLayer = polygonLayers.find((l) => l.id === selectedLayerId) || null;

  // Lukk dropdown ved klikk utenfor
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

  // Reset felt når popup lukkes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLayerId("");
      setMinArea("");
      setBusy(false);
      setError(null);
      setIsListOpen(false);
    }
  }, [isOpen]);

  async function handleRun() {
    const minAreaM2 = parseFloat(minArea);
    if (!selectedLayerId || !Number.isFinite(minAreaM2) || minAreaM2 <= 0 || busy) return;

    const layer = polygonLayers.find((l) => l.id === selectedLayerId);
    if (!layer) {
      setError("Fant ikke valgt lag.");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const { fc4326 } = await runAreaFilter(
        layer.geojson4326 as FeatureCollection<Geometry>,
        minAreaM2
      );

      if (!fc4326.features.length) {
        setError(`Fant ingen sammenhengende områder ≥ ${minAreaM2.toLocaleString("nb-NO")} m².`);
        setBusy(false);
        return;
      }

      const newName = `${layer.name}_AREA_≥${minAreaM2}m2`;

      addLayer({
        name: newName,
        geojson4326: fc4326,
        color: layer.color,
        visible: true,
      });

      setBusy(false);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Klarte ikke å filtrere på areal.");
      setBusy(false);
    }
  }

  const minAreaValue = parseFloat(minArea);
  const actions: Action[] = busy
    ? []
    : [
        { label: "Lukk", variant: "secondary", onClick: onClose, disabled: busy },
        {
          label: "Finn områder",
          variant: "primary",
          onClick: handleRun,
          disabled: busy || !selectedLayerId || !Number.isFinite(minAreaValue) || minAreaValue <= 0,
        },
      ];

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Store sammenhengende områder"
      width="narrow"
      actions={actions}
      hideCloseIcon={busy}
    >
      {busy ? (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">Finner områder...</div>
        </div>
      ) : !hasLayers ? (
        <div className="warning-message">
          Du må ha minst ett lag med polygon-geometrier for å bruke dette verktøyet.
        </div>
      ) : (
        <div className="choose-layer-container">
          <div className="field-group">
            {/* Velg lag*/}
            <div className="choose-layer-text">Velg polygonlag</div>
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
                  {polygonLayers.map((l) => (
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
          {/* Min areal input */}
          <div>
            <label className="choose-layer-text">Minimum areal (m²)</label>
            <input
              type="number"
              min={1}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              className="input-number"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </Popup>
  );
}
