import { useEffect, useRef, useState } from "react";
import { useLayers } from "../../context/LayersContext";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";
import { to25832 } from "../../utils/reproject";
import Popup, { type Action } from "../popup/Popup";
import { isPoly } from "../../utils/geoTools";
import { toTransparent } from "../../utils/commonFunctions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Union({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // lukk ved klikk utenfor
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

  // reset når popupen lukkes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setIsListOpen(false);
      setBusy(false);
      setError(null);
    }
  }, [isOpen]);

  // Unioner kun lag som har minst en polygon eller multipolygon
  const polygonLayers = layers.filter((l) =>
    l.geojson4326.features.some((f) => isPoly(f.geometry))
  );
  const selectableLayers = polygonLayers.filter((l) => !selectedIds.includes(l.id));
  const hasLayers = polygonLayers.length > 1;

  function addSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeSelected(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  function handleUnion() {
    if (selectedIds.length < 2 || busy) return;

    setBusy(true);
    setError(null);

    setTimeout(() => {
      let success = false;

      try {
        const chosenLayers = layers.filter(
          (l) => selectedIds.includes(l.id) && polygonLayers.some((p) => p.id === l.id)
        );

        if (chosenLayers.length < 2) {
          throw new Error("Velg minst to lag med polygon-geometrier.");
        }

        // Samle alle polygon/multipolygon-features i 4326 format
        const allPolyFeatures: Feature<Polygon | MultiPolygon>[] = [];

        for (const l of chosenLayers) {
          for (const f of l.geojson4326.features) {
            if (isPoly(f.geometry)) {
              const cloned = {
                // unngå mutasjon
                type: "Feature",
                properties: { ...(f.properties || {}) },
                geometry: JSON.parse(JSON.stringify(f.geometry)),
              } as Feature<Polygon | MultiPolygon>;

              allPolyFeatures.push(cloned);
            }
          }
        }

        if (allPolyFeatures.length < 2) {
          throw new Error("Fant ikke nok polygon-geometrier i de valgte lagene til å lage union.");
        }

        // Prøver batch-union med featurecollection
        const fc: FeatureCollection<Polygon | MultiPolygon> = {
          type: "FeatureCollection",
          features: allPolyFeatures,
        };

        let unionFeature: Feature<Polygon | MultiPolygon> | null = null;

        // Try/catch fordi turf tuller seg og dette funker
        try {
          unionFeature = (turf as any).union(fc) as Feature<Polygon | MultiPolygon> | null;
        } catch {
          let acc: Feature<Polygon | MultiPolygon> | null = allPolyFeatures[0];

          for (let i = 1; i < allPolyFeatures.length; i++) {
            const next = allPolyFeatures[i];
            try {
              const u = (turf as any).union(acc as any, next as any) as Feature<
                Polygon | MultiPolygon
              > | null;
              if (u) {
                acc = u;
              } else {
              }
            } catch (e) {}
          }
          unionFeature = acc;
        }

        if (!unionFeature || !unionFeature.geometry) {
          throw new Error("Klarte ikke å lage union av lagene.");
        }

        // tilbake til featurecollection
        const union4326: FeatureCollection<Geometry> = {
          type: "FeatureCollection",
          features: [unionFeature as Feature<Geometry>],
        };

        // projiser
        const union25832 = to25832(union4326);

        // legg til i sidebar
        addLayer({
          name: `UNION_LAYER`,
          sourceCrs: "EPSG:25832",
          geojson25832: union25832,
          geojson4326: union4326,
          color: chosenLayers[0].color,
          visible: true,
        });

        success = true;
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Klarte ikke å lage union.");
      } finally {
        setBusy(false);
        if (success) {
          onClose();
        }
      }
    }, 0);
  }

  if (!isOpen) return null;

  const actions: Action[] = busy
    ? []
    : [
        { label: "Lukk", variant: "secondary", onClick: onClose, disabled: busy },
        {
          label: "Slå sammen",
          variant: "primary",
          onClick: handleUnion,
          disabled: busy || selectedIds.length < 2,
          loading: busy,
        },
      ];

  if (!isOpen) return null;

  return (
    <Popup isOpen={isOpen} onClose={onClose} title="Union" width="narrow" actions={actions}>
      {busy ? (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">Slår sammen...</div>
        </div>
      ) : !hasLayers ? (
        <div className="warning-message">
          Du må ha minst to lag med polygon-geometrier for å lage union.
        </div>
      ) : (
        <div className="choose-layer-container">
          <div className="field-group">
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
                style={{
                  borderRadius: isListOpen ? "8px 8px 0 0" : "8px",
                }}
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
                    <button key={l.id} onClick={() => addSelected(l.id)} className="popup-buttons">
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
  );
}
