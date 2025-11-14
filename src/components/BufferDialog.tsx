import { useEffect, useRef, useState } from "react";
import { useLayers } from "../context/LayersContext";
import * as turf from "@turf/turf";
import { featureCollection } from "@turf/helpers";
import type { Feature, Geometry, FeatureCollection as FC } from "geojson";
import { to25832 } from "../utils/reproject";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function BufferDialog({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [bufferDistance, setBufferDistance] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // lukk dropdown ved klikk utenfor
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (isListOpen && listRef.current && !listRef.current.contains(e.target as Node)) {
        setIsListOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isListOpen]);

  // reset når dialogen lukkes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLayerId("");
      setBufferDistance("");
      setError(null);
      setIsListOpen(false);
    }
  }, [isOpen]);

  async function handleBuffer() {
    const distance = parseFloat(bufferDistance); // Parse bufferDistance som tall
    if (!selectedLayerId || distance <= 0) return;
    setError(null);

    try {
      const layer = layers.find((l) => l.id === selectedLayerId);
      if (!layer) throw new Error("Fant ikke valgt lag.");

      const bufferedFeatures: Feature<Geometry>[] = [];

      for (const f of layer.geojson4326.features) {
        if (!f.geometry) continue;
        const buffered = turf.buffer(f as Feature<Geometry>, distance, {
          units: "meters",
        });
        if (buffered) {
          bufferedFeatures.push(buffered as Feature<Geometry>);
        }
      }

      if (bufferedFeatures.length === 0) {
        throw new Error("Fikk ikke laget buffer av dette laget.");
      }

      const buffered4326: FC<Geometry> = featureCollection(bufferedFeatures);

      const buffered25832 = to25832(buffered4326);

      // lagrer som nytt lag
      addLayer({
        name: `${layer.name}_BUFFER_${distance}m`,
        sourceCrs: "EPSG:25832",
        geojson25832: buffered25832,
        geojson4326: buffered4326,
        color: layer.color,
        visible: true,
      });

      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Klarte ikke å lage buffer.");
    }
  }

  if (!isOpen) return null;

  const hasLayers = layers.length > 0;
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal>
      <div className="modal modal--narrow" style={{ maxWidth: 540 }}>
        <header className="modal-header">
          <h3 className="modal-title">Buffer</h3>
          <button className="modal-close" onClick={onClose} aria-label="Lukk">
            ×
          </button>
        </header>

        <div className="modal-body">
          {!hasLayers ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                color: "#b91c1c",
                padding: "10px 12px",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              Du må laste opp data før du kan lage buffer.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {/* velg lag */}
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Velg lag</div>
                <div style={{ position: "relative" }} ref={listRef}>
                  <button
                    type="button"
                    onClick={() => setIsListOpen((x) => !x)}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: isListOpen ? "8px 8px 0 0" : 8,
                      border: "1px solid var(--border)",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>
                      {selectedLayer ? selectedLayer.name : "Velg lag…"}
                    </span>
                    <span aria-hidden style={{ fontSize: 12 }}>
                      ▾
                    </span>
                  </button>

                  {isListOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid var(--border)",
                        borderTop: "none",
                        borderRadius: "0 0 8px 8px",
                        boxShadow: "0 14px 30px rgba(0,0,0,0.06)",
                        maxHeight: 180,
                        overflowY: "auto",
                        zIndex: 40,
                      }}
                      className="clip-dropdown-scroll"
                    >
                      {layers.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => {
                            setSelectedLayerId(l.id);
                            setIsListOpen(false);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "8px 12px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
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

              {/* buffer-avstand */}
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                  Buffer-avstand (meter)
                </label>
                <input
                  type="number"
                  min={1}
                  value={bufferDistance}
                  onChange={(e) => setBufferDistance(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              {error && (
                <div
                  className="hint-box"
                  style={{ color: "#b91c1c", borderColor: "#fecaca", background: "#fef2f2" }}
                >
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Lukk
          </button>
          <button
            className="btn btn-primary"
            onClick={handleBuffer}
            disabled={!selectedLayerId || parseFloat(bufferDistance) <= 0}
          >
            Lag buffer
          </button>
        </div>
      </div>
    </div>
  );
}
