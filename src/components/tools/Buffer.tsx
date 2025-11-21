import { useEffect, useRef, useState } from "react";
import { useLayers } from "../../context/LayersContext";
import * as turf from "@turf/turf";
import { featureCollection } from "@turf/helpers";
import type { Feature, Geometry, FeatureCollection as FC } from "geojson";
import { to25832 } from "../../utils/reproject";
import Popup, { type Action } from "../popup/Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Buffer({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [bufferDistance, setBufferDistance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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

  // reset når popupen lukkes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLayerId("");
      setBufferDistance("");
      setError(null);
      setIsListOpen(false);
      setBusy(false);
    }
  }, [isOpen]);

  function handleBuffer() {
    const distance = parseFloat(bufferDistance); // Parse bufferDistance som tall
    if (!selectedLayerId || distance <= 0 || busy) return;

    setError(null);
    setBusy(true);

    setTimeout(() => {
      let success = false;

      try {
        const layer = layers.find((l) => l.id === selectedLayerId);
        if (!layer) {
          throw new Error("Fant ikke valgt lag.");
        }

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

        success = true;
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Klarte ikke å lage buffer.");
      } finally {
        setBusy(false);
        if (success) {
          onClose();
        }
      }
    }, 0);
  }

  if (!isOpen) return null;

  const hasLayers = layers.length > 0;
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

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
          disabled: busy || !selectedLayerId || parseFloat(bufferDistance) <= 0,
        },
      ];

  return (
    <Popup isOpen={isOpen} onClose={onClose} title="Buffer" width="narrow" actions={actions}>
      {busy ? (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">Lager buffer…</div>
        </div>
      ) : !hasLayers ? (
        <div className="warning-message">Du må laste opp data før du kan lage buffer.</div>
      ) : (
        <div className="choose-layer-container">
          {/* velg lag */}
          <div className="field-group">
            <div className="choose-layer-text">Velg laget du vil lage buffer rundt</div>
            <div className="dropdown" ref={listRef}>
              <button
                type="button"
                className="dropdown-toggle"
                style={{
                  borderRadius: isListOpen ? "8px 8px 0 0" : "8px",
                }}
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

          {/* buffer-avstand */}
          <div>
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
