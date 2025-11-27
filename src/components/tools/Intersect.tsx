import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { useLayers } from "../../context/LayersContext";
import Popup, { type Action } from "../popup/Popup";
import { isPoly } from "../../utils/geomaticFunctions";
import { runIntersect } from "../../workers/geoworkerClient";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Finner overlapp mellom to polygonlag med worker
export default function Intersect({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  const [layerAId, setLayerAId] = useState<string>("");
  const [layerBId, setLayerBId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListAOpen, setIsListAOpen] = useState(false);
  const [isListBOpen, setIsListBOpen] = useState(false);
  const listARef = useRef<HTMLDivElement | null>(null);
  const listBRef = useRef<HTMLDivElement | null>(null);

  // Polygon-lag
  const polygonLayers = layers.filter((l) =>
    l.geojson4326.features.some((f) => isPoly(f.geometry))
  );
  const hasLayers = polygonLayers.length >= 2;

  // Reset felt når popupen lukkes
  useEffect(() => {
    if (!isOpen) {
      setLayerAId("");
      setLayerBId("");
      setBusy(false);
      setError(null);
      setIsListAOpen(false);
      setIsListBOpen(false);
    }
  }, [isOpen]);

  // Lukk ved klikk utenfor
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (isListAOpen && listARef.current && !listARef.current.contains(target)) {
        setIsListAOpen(false);
      }
      if (isListBOpen && listBRef.current && !listBRef.current.contains(target)) {
        setIsListBOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isListAOpen, isListBOpen]);

  async function handleIntersect() {
    if (!layerAId || !layerBId || layerAId === layerBId || busy) return;

    const layerA = polygonLayers.find((l) => l.id === layerAId);
    const layerB = polygonLayers.find((l) => l.id === layerBId);
    if (!layerA || !layerB) {
      setError("Fant ikke begge lagene som skulle intersectes.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { fc4326 } = await runIntersect(
        layerA.geojson4326 as FeatureCollection<Geometry>,
        layerB.geojson4326 as FeatureCollection<Geometry>
      );

      if (!fc4326.features.length) {
        setError("Intersect ga ingen overlapp.");
        setBusy(false);
        return;
      }

      const nameA = layerA.name || "LagA";
      const nameB = layerB.name || "LagB";
      const newName = `${nameA} ∩ ${nameB}`;
      const color = layerA.color ?? "#ff0000";

      addLayer({
        name: newName,
        geojson4326: fc4326,
        color,
        visible: true,
      });

      setBusy(false);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Klarte ikke å utføre intersect.");
      setBusy(false);
    }
  }

  if (!isOpen) return null;

  // Knappene i popupen
  const actions: Action[] = busy
    ? []
    : [
        { label: "Lukk", variant: "secondary", onClick: onClose, disabled: busy },
        {
          label: "Utfør",
          variant: "primary",
          onClick: handleIntersect,
          disabled: busy || !layerAId || !layerBId || layerAId === layerBId,
        },
      ];

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Intersect"
      width="narrow"
      actions={actions}
      hideCloseIcon={busy}
    >
      {busy ? (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">Beregner overlapp… </div>
        </div>
      ) : !hasLayers ? (
        <div className="warning-message">
          Du må ha minst to lag med polygon-geometrier for å bruke intersect.
        </div>
      ) : (
        <div className="choose-layer-container">
          <div className="field-group">
            {/* Velg lag */}
            <div className="choose-layer-text">Velg to polygon-lag</div>
            {/* Lag A */}
            <div className="choose-layer-text">Lag A</div>
            <div className="dropdown" ref={listARef}>
              <button
                type="button"
                className="dropdown-toggle"
                style={{ borderRadius: isListAOpen ? "8px 8px 0 0" : "8px" }}
                onClick={() => setIsListAOpen((x) => !x)}
              >
                <span className="dropdown-text">
                  {layerAId
                    ? (polygonLayers.find((l) => l.id === layerAId)?.name ?? "Velg lag A…")
                    : "Velg lag A…"}
                </span>
                <span aria-hidden className="dropdown-hidden">
                  ▾
                </span>
              </button>

              {isListAOpen && (
                <div className="clip-dropdown-scroll">
                  {polygonLayers.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setLayerAId(l.id);
                        if (layerBId === l.id) setLayerBId("");
                        setIsListAOpen(false);
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

          <div>
            {/* Lag B */}
            <div className="choose-layer-text">Lag B</div>
            <div className="dropdown" ref={listBRef}>
              <button
                type="button"
                className="dropdown-toggle"
                style={{ borderRadius: isListBOpen ? "8px 8px 0 0" : "8px" }}
                onClick={() => setIsListBOpen((x) => !x)}
              >
                <span className="dropdown-text">
                  {layerBId
                    ? (polygonLayers.find((l) => l.id === layerBId)?.name ?? "Velg lag B…")
                    : "Velg lag B…"}
                </span>
                <span aria-hidden className="dropdown-hidden">
                  ▾
                </span>
              </button>

              {isListBOpen && (
                <div className="clip-dropdown-scroll">
                  {polygonLayers
                    .filter((l) => l.id !== layerAId)
                    .map((l) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          setLayerBId(l.id);
                          setIsListBOpen(false);
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

          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </Popup>
  );
}
