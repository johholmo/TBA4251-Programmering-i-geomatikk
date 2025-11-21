import { useEffect, useMemo, useRef, useState } from "react";
import { useLayers } from "../../context/LayersContext";

import type {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  MultiPolygon,
  LineString,
  MultiLineString,
} from "geojson";

import cleanCoords from "@turf/clean-coords";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import booleanIntersects from "@turf/boolean-intersects";
import { to25832 } from "../../utils/reproject";
import Popup, { type Action } from "../popup/Popup";
import { isPoly, turfIntersect } from "../../utils/geoTools";
import { toTransparent } from "../../utils/commonFunctions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Clip({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [maskId, setMaskId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListOpen, setIsListOpen] = useState(false);
  const [isMaskOpen, setIsMaskOpen] = useState(false);
  const sourceWrapperRef = useRef<HTMLDivElement | null>(null);
  const maskWrapperRef = useRef<HTMLDivElement | null>(null);

  // lukker hvis det klikkes utenfor
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (isListOpen && sourceWrapperRef.current && !sourceWrapperRef.current.contains(target)) {
        setIsListOpen(false);
      }
      if (isMaskOpen && maskWrapperRef.current && !maskWrapperRef.current.contains(target)) {
        setIsMaskOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isListOpen, isMaskOpen]);

  // reset når popupen lukkes
  useEffect(() => {
    if (!isOpen) {
      setBusy(false);
      setError(null);
      setIsListOpen(false);
      setSelectedIds([]);
      setMaskId("");
    }
  }, [isOpen]);

  const candidateMaskLayers = useMemo(
    () =>
      layers.filter((l) => l.geojson4326.features.some((f) => f.geometry && isPoly(f.geometry))),
    [layers]
  );
  const selectableSourceLayers = layers.filter((l) => !selectedIds.includes(l.id));
  const noLayers = layers.length === 0;

  const addToSelected = (id: string) => {
    if (!id) return;
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  const removeFromSelected = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  // AI til hjelp for å håndtere klipping
  function handleClip() {
    if (!maskId || selectedIds.length === 0 || busy) return;

    setBusy(true);
    setError(null);

    setTimeout(() => {
      let success = false;

      try {
        const maskLayer = layers.find((l) => l.id === maskId);
        if (!maskLayer) throw new Error("Fant ikke maskelaget.");

        // Get alle polygon features fra maskelag
        const maskFeatures = maskLayer.geojson4326.features.filter(
          (f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
        ) as Feature<Polygon | MultiPolygon>[];

        if (maskFeatures.length === 0) {
          throw new Error("Maskelaget må inneholde polygon-geometri.");
        }

        // For alle lag som skal bli klippet
        for (const srcId of selectedIds) {
          const src = layers.find((l) => l.id === srcId);
          if (!src) continue;

          const outFeatures4326: Feature<Geometry>[] = [];

          for (const feature of src.geojson4326.features) {
            if (!feature.geometry) continue;

            const geomType = feature.geometry.type;

            // Test intersection
            for (const maskFeature of maskFeatures) {
              try {
                // Polygon klipping
                if (geomType === "Polygon" || geomType === "MultiPolygon") {
                  const maskGeom = maskFeature.geometry as Polygon | MultiPolygon;
                  const srcGeom = feature.geometry as Polygon | MultiPolygon;

                  const maskFeat = {
                    type: "Feature" as const,
                    properties: {},
                    geometry: maskGeom,
                  };
                  const srcFeat = {
                    type: "Feature" as const,
                    properties: feature.properties || {},
                    geometry: srcGeom,
                  };

                  // Sjekker etter noe som helst overlapp
                  const hasIntersection = booleanIntersects(maskFeat as any, srcFeat as any);
                  if (!hasIntersection) {
                    continue;
                  }

                  let clipped: Feature<Polygon | MultiPolygon> | null = null;

                  try {
                    clipped = turfIntersect(maskFeat as any, srcFeat as any);
                  } catch (err1) {
                    const cleanedMask = cleanCoords(maskGeom as any) as Polygon | MultiPolygon;
                    const cleanedSrc = cleanCoords(srcGeom as any) as Polygon | MultiPolygon;

                    const cleanedMaskFeat = {
                      type: "Feature" as const,
                      properties: {},
                      geometry: cleanedMask,
                    };
                    const cleanedSrcFeat = {
                      type: "Feature" as const,
                      properties: feature.properties || {},
                      geometry: cleanedSrc,
                    };

                    try {
                      clipped = turfIntersect(cleanedMaskFeat as any, cleanedSrcFeat as any);
                    } catch (err2) {
                      continue;
                    }
                  }

                  if (clipped && clipped.geometry) {
                    // Unngå duplikater
                    const alreadyAdded = outFeatures4326.some(
                      (f) => JSON.stringify(f.geometry) === JSON.stringify(clipped!.geometry)
                    );

                    if (!alreadyAdded) {
                      outFeatures4326.push({
                        type: "Feature",
                        properties: feature.properties || {},
                        geometry: clipped.geometry as Geometry,
                      } as Feature<Geometry>);
                    }
                  }

                  // Linje klipping
                } else if (geomType === "LineString" || geomType === "MultiLineString") {
                  const maskFeat = {
                    type: "Feature" as const,
                    properties: {},
                    geometry: maskFeature.geometry,
                  };

                  const lineFeat = {
                    type: "Feature" as const,
                    properties: feature.properties || {},
                    geometry: feature.geometry as LineString | MultiLineString,
                  };

                  const intersects = booleanIntersects(maskFeat as any, lineFeat as any);

                  if (intersects) {
                    const alreadyAdded = outFeatures4326.some(
                      (f) => JSON.stringify(f.geometry) === JSON.stringify(feature.geometry)
                    );

                    if (!alreadyAdded) {
                      outFeatures4326.push(lineFeat as Feature<Geometry>);
                    }
                    break;
                  }

                  // Punkt klipping
                } else if (geomType === "Point") {
                  const isInside = booleanPointInPolygon(
                    feature.geometry as any,
                    maskFeature.geometry as any
                  );

                  if (isInside) {
                    const alreadyAdded = outFeatures4326.some(
                      (f) => JSON.stringify(f.geometry) === JSON.stringify(feature.geometry)
                    );

                    if (!alreadyAdded) {
                      outFeatures4326.push(feature as Feature<Geometry>);
                    }
                    break;
                  }
                }
              } catch (err) {
                console.warn(`Error processing ${geomType} feature:`, err);
              }
            }
          }

          if (outFeatures4326.length === 0) {
            console.log(`No overlap found for layer: ${src.name}`);
            continue;
          }

          const outFC4326: FeatureCollection<Geometry> = {
            type: "FeatureCollection",
            features: outFeatures4326,
          };

          const outFC25832 = to25832(outFC4326);

          addLayer({
            name: `${src.name}_CLIP`,
            sourceCrs: "EPSG:25832",
            geojson25832: outFC25832,
            geojson4326: outFC4326,
            color: src.color,
            visible: true,
          });
        }

        success = true;
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Klarte ikke å klippe lagene.");
      } finally {
        setBusy(false);
        if (success) {
          setSelectedIds([]);
          setMaskId("");
          setIsListOpen(false);
          setIsMaskOpen(false);
          onClose();
        }
      }
    }, 0);
  }

  if (!isOpen) return null;

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
          label: "Klipp",
          variant: "primary",
          onClick: handleClip,
          disabled: busy || !maskId || selectedIds.length === 0 || noLayers,
        },
      ];

  return (
    <Popup isOpen={isOpen} onClose={onClose} title="Clip" width="narrow" actions={actions}>
      {busy ? (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">Klipper...</div>
        </div>
      ) : (
        <div className="choose-layer-container">
          {noLayers && (
            <div className="warning-message">Du må laste opp data før du kan klippe lag.</div>
          )}

          {!noLayers && (
            <>
              <div className="field-group">
                <div className="choose-layer-text">Velg hvilke lag som skal klippes</div>

                {selectedIds.length > 0 && (
                  <div className="selected-layers">
                    {selectedIds.map((id) => {
                      const layer = layers.find((l) => l.id === id);
                      const bgColor = layer?.color ?? "#f3efe6";

                      return (
                        <span
                          key={id}
                          className="selected-layer-chip"
                          style={{ background: toTransparent(bgColor, 0.8) }}
                        >
                          {layer?.name ?? "Ukjent lag"}
                          <button
                            onClick={() => removeFromSelected(id)}
                            className="selected-layer-remove"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="dropdown" ref={sourceWrapperRef}>
                  <button
                    type="button"
                    className="dropdown-toggle"
                    style={{
                      borderRadius: isListOpen ? "8px 8px 0 0" : "8px",
                    }}
                    onClick={() => setIsListOpen((x) => !x)}
                  >
                    <span className="dropdown-text">
                      {selectableSourceLayers.length === 0 ? "Alle lag er valgt" : "Velg lag…"}
                    </span>
                    <span aria-hidden className="dropdown-hidden">
                      ▾
                    </span>
                  </button>

                  {isListOpen && selectableSourceLayers.length > 0 && (
                    <div className="clip-dropdown-scroll">
                      {selectableSourceLayers.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => addToSelected(l.id)}
                          className="popup-buttons"
                        >
                          <span className="layer-color-dot" style={{ background: l.color }} />
                          <span className="layer-name-text">{l.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="field-group">
                <div className="dropdown" ref={maskWrapperRef}>
                  <div className="choose-layer-text">Velg laget det skal klippes mot</div>

                  <button
                    type="button"
                    className="dropdown-toggle"
                    onClick={() => setIsMaskOpen((x) => !x)}
                  >
                    <span className="dropdown-text">
                      {maskId
                        ? (candidateMaskLayers.find((l) => l.id === maskId)?.name ??
                          "Velg maskelag…")
                        : "Velg maskelag…"}
                    </span>
                    <span aria-hidden className="dropdown-hidden">
                      ▾
                    </span>
                  </button>

                  {isMaskOpen && candidateMaskLayers.length > 0 && (
                    <div className="clip-dropdown-scroll">
                      {candidateMaskLayers
                        .filter((l) => !selectedIds.includes(l.id))
                        .map((l) => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setMaskId(l.id);
                              setIsMaskOpen(false);
                            }}
                            className="popup-buttons"
                          >
                            <span className="layer-color-dot" style={{ background: l.color }} />
                            <span className="layer-name-text">{l.name}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
            </>
          )}
        </div>
      )}
    </Popup>
  );
}
