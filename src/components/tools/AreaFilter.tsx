import { useEffect, useRef, useState } from "react";
import { useLayers } from "../../context/LayersContext";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";
import { to25832 } from "../../utils/geomaticFunctions";
import Popup, { type Action } from "../popup/Popup";
import { isPoly, unionPolygons, explodeToPolygons } from "../../utils/geomaticFunctions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Finner arealer større enn minAreal fra input i popupen
function findAreas(
  fc4326: FeatureCollection<Geometry>,
  minAreal: number
): { fc4326: FeatureCollection<Geometry>; fc25832: FeatureCollection<Geometry> } {
  const polys: Feature<Polygon | MultiPolygon>[] = [];
  // Samle kun polygon-geometrier
  for (const f of fc4326.features) {
    if (isPoly(f.geometry)) {
      polys.push({
        type: "Feature",
        properties: { ...(f.properties || {}) },
        geometry: f.geometry,
      });
    }
  }
  // Hvis ingen polygoner, returner tomme feature collections
  if (polys.length === 0) {
    return {
      fc4326: { type: "FeatureCollection", features: [] },
      fc25832: { type: "FeatureCollection", features: [] },
    };
  }
  // Unioner alle polygonene til ett stort polygon
  const unionFeat = unionPolygons(polys);
  if (!unionFeat || !unionFeat.geometry) {
    return {
      fc4326: { type: "FeatureCollection", features: [] },
      fc25832: { type: "FeatureCollection", features: [] },
    };
  }
  // Eksploder unionen til enkeltpolygoner
  const singlePolys = explodeToPolygons(unionFeat);

  // Filtrer ut polygoner som er mindre enn minAreal
  const bigPolys: Feature<Geometry>[] = [];
  for (const p of singlePolys) {
    const area = turf.area(p);
    if (area >= minAreal) {
      bigPolys.push(p as Feature<Geometry>);
    }
  }

  // Lag nye feature collections med de store polygonene
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

// Hovedkomponent for AreaFilter-verktøyet
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

  // Hovedfunksjon for å finne og lage nytt lag med store områder
  async function handleRun() {
    const minAreaM2 = parseFloat(minArea);
    if (!selectedLayerId || !Number.isFinite(minAreaM2) || minAreaM2 <= 0 || busy) return;

    setError(null);
    setBusy(true); // Starter busy for å vise spinner

    try {
      const layer = polygonLayers.find((l) => l.id === selectedLayerId);
      if (!layer) throw new Error("Fant ikke valgt lag.");

      // Finn store områder
      const { fc4326, fc25832 } = findAreas(layer.geojson4326, minAreaM2);

      // Hvis ingen områder funnet, sett errormelding
      if (!fc4326.features.length) {
        setError(`Fant ingen sammenhengende områder ≥ ${minAreaM2.toLocaleString("nb-NO")} m².`);
        return;
      }
      // Legg til nytt lag med de store områdene med justert navn
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
      setBusy(false); // Stopp busy/spinner
    }
  }

  if (!isOpen) return null;

  // Input og knapper i popupen
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

  // HTML for popupen
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Store sammenhengende områder"
      width="narrow"
      actions={actions}
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
              step={1}
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
