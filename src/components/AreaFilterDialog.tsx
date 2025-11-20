import { useEffect, useRef, useState } from "react";
import { useLayers } from "../context/LayersContext";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";
import { to25832 } from "../utils/reproject";
import Popup, { type Action } from "./popup/Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function isPoly(g: Geometry | null | undefined): g is Polygon | MultiPolygon {
  return !!g && (g.type === "Polygon" || g.type === "MultiPolygon");
}

// samme som i Differnce og clip
function unionPolygons(
  features: Feature<Polygon | MultiPolygon>[]
): Feature<Polygon | MultiPolygon> | null {
  if (features.length === 0) return null;
  if (features.length === 1) return features[0];

  const fn = (turf as any).union;
  const fc: FeatureCollection<Polygon | MultiPolygon> = {
    type: "FeatureCollection",
    features,
  };

  try {
    return fn(fc) as Feature<Polygon | MultiPolygon> | null;
  } catch {
    let acc: Feature<Polygon | MultiPolygon> | null = features[0];
    for (let i = 1; i < features.length; i++) {
      const next = features[i];
      try {
        const u = fn(acc as any, next as any) as Feature<Polygon | MultiPolygon> | null;
        if (u) acc = u;
      } catch {}
    }
    return acc;
  }
}

// splitter MultiPolygon til en Feature per sammenhengende område
function explodeToPolygons(feat: Feature<Polygon | MultiPolygon>): Feature<Polygon>[] {
  const out: Feature<Polygon>[] = [];
  if (!feat.geometry) return out;

  if (feat.geometry.type === "Polygon") {
    out.push(feat as Feature<Polygon>);
  } else if (feat.geometry.type === "MultiPolygon") {
    for (const coords of feat.geometry.coordinates) {
      out.push({
        type: "Feature",
        properties: { ...(feat.properties || {}) },
        geometry: {
          type: "Polygon",
          coordinates: coords,
        },
      });
    }
  }
  return out;
}

// finner arealer større enn minAreal
function findAreas(
  fc4326: FeatureCollection<Geometry>,
  minAreal: number
): { fc4326: FeatureCollection<Geometry>; fc25832: FeatureCollection<Geometry> } {
  const polys: Feature<Polygon | MultiPolygon>[] = [];
  for (const f of fc4326.features) {
    if (isPoly(f.geometry)) {
      polys.push({
        type: "Feature",
        properties: { ...(f.properties || {}) },
        geometry: f.geometry,
      });
    }
  }

  if (polys.length === 0) {
    return {
      fc4326: { type: "FeatureCollection", features: [] },
      fc25832: { type: "FeatureCollection", features: [] },
    };
  }

  const unionFeat = unionPolygons(polys);
  if (!unionFeat || !unionFeat.geometry) {
    return {
      fc4326: { type: "FeatureCollection", features: [] },
      fc25832: { type: "FeatureCollection", features: [] },
    };
  }

  const singlePolys = explodeToPolygons(unionFeat);

  const bigPolys: Feature<Geometry>[] = [];
  for (const p of singlePolys) {
    const area = turf.area(p);
    if (area >= minAreal) {
      bigPolys.push(p as Feature<Geometry>);
    }
  }

  const out4326: FeatureCollection<Geometry> = {
    type: "FeatureCollection",
    features: bigPolys,
  };
  const out25832 = to25832(out4326);

  return {
    fc4326: out4326,
    fc25832: out25832,
  };
}

export default function AreaFilterDialog({ isOpen, onClose }: Props) {
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

  // lukk dropdown ved klikk utenfor
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

  // reset når popup lukkes
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

    setError(null);
    setBusy(true);

    try {
      const layer = polygonLayers.find((l) => l.id === selectedLayerId);
      if (!layer) throw new Error("Fant ikke valgt lag.");

      const { fc4326, fc25832 } = findAreas(layer.geojson4326, minAreaM2);

      if (!fc4326.features.length) {
        setError(`Fant ingen sammenhengende områder ≥ ${minAreaM2.toLocaleString("nb-NO")} m².`);
        return;
      }

      const newName = `${layer.name}_AREA_≥${minAreaM2}m2`;

      addLayer({
        name: newName,
        sourceCrs: "EPSG:25832",
        geojson25832: fc25832,
        geojson4326: fc4326,
        color: layer.color,
        visible: true,
      });

      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Klarte ikke å finne store sammenhengende områder.");
    } finally {
      setBusy(false);
    }
  }

  if (!isOpen) return null;

  const minAreaValue = parseFloat(minArea);
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
    >
      {busy ? (
        <div className="upload-busy" style={{ textAlign: "center", padding: "24px 0" }}>
          <div className="spinner" style={{ width: 48, height: 48, marginBottom: 10 }} />
          <div style={{ fontWeight: 600 }}>Finner områder…</div>
        </div>
      ) : !hasLayers ? (
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
          Du må ha minst ett lag med polygon-geometrier for å bruke dette verktøyet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ fontWeight: 600 }}>Velg polygonlag</div>

          <div>
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
                    maxHeight: 260,
                    overflowY: "auto",
                    zIndex: 9999,
                    scrollbarWidth: "none",
                  }}
                  className="clip-dropdown-scroll"
                >
                  {polygonLayers.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelectedLayerId(l.id);
                        setIsListOpen(false);
                      }}
                      className="dialog-options"
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
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Minimum areal (m²)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
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
              style={{
                color: "#b91c1c",
                borderColor: "#fecaca",
                background: "#fef2f2",
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}
    </Popup>
  );
}
