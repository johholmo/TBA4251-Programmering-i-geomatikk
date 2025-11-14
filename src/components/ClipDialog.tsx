import { useEffect, useMemo, useRef, useState } from "react";
import { useLayers } from "../context/LayersContext";

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
import intersect from "@turf/intersect";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import booleanIntersects from "@turf/boolean-intersects";
import { to25832 } from "../utils/reproject";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Mye trøbbel med intersect fra @turf, så AI tipset om å lage wrapper som støtter både "intersect(a,b)" og "intersect(FeatureCollection)"
function turfIntersect(
  a: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon,
  b: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon
): Feature<Polygon | MultiPolygon> | null {
  const fn = intersect as any;

  // Prøver først to-argument-varianten
  try {
    return fn(a, b) as Feature<Polygon | MultiPolygon> | null;
  } catch (e: any) {
    if (!e?.message?.includes("Must specify at least 2 geometries")) {
      throw e;
    }
    // Hvis vi får kjent feilmelding som lager trøbbel med polygon-lag
    const featA: Feature<Polygon | MultiPolygon> =
      (a as any).type === "Feature"
        ? (a as any)
        : {
            type: "Feature",
            properties: {},
            geometry: a as Polygon | MultiPolygon,
          };

    const featB: Feature<Polygon | MultiPolygon> =
      (b as any).type === "Feature"
        ? (b as any)
        : {
            type: "Feature",
            properties: {},
            geometry: b as Polygon | MultiPolygon,
          };

    const fc = {
      type: "FeatureCollection" as const,
      features: [featA, featB],
    };

    // Kall intersect på nytt, med én FeatureCollection inn
    return fn(fc) as Feature<Polygon | MultiPolygon> | null;
  }
}

// Sjekker geometri for å finne ut hvordan man skal klippe senere
function isPolygonal(g: Geometry) {
  return g.type === "Polygon" || g.type === "MultiPolygon";
}

// Popupen for klippeverktøyet
export default function ClipDialog({ isOpen, onClose }: Props) {
  // States og referanser
  const { layers, addLayer } = useLayers();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [maskId, setMaskId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isMaskOpen, setIsMaskOpen] = useState(false);
  const sourceWrapperRef = useRef<HTMLDivElement | null>(null);
  const maskWrapperRef = useRef<HTMLDivElement | null>(null);

  // lukker hvis det klikkes utenfor
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (isSourceOpen && sourceWrapperRef.current && !sourceWrapperRef.current.contains(target)) {
        setIsSourceOpen(false);
      }
      if (isMaskOpen && maskWrapperRef.current && !maskWrapperRef.current.contains(target)) {
        setIsMaskOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isSourceOpen, isMaskOpen]);

  const candidateMaskLayers = useMemo(
    () =>
      layers.filter((l) =>
        l.geojson4326.features.some((f) => f.geometry && isPolygonal(f.geometry))
      ),
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
  async function handleClip() {
    if (!maskId || selectedIds.length === 0) return;
    setBusy(true);
    setError(null);

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

      onClose();
      setSelectedIds([]);
      setMaskId("");
      setIsSourceOpen(false);
      setIsMaskOpen(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Klarte ikke å klippe lagene.");
    } finally {
      setBusy(false);
    }
  }

  if (!isOpen) return null;

  // HTML koden
  return (
    <div className="modal-overlay" role="dialog" aria-modal>
      <div className="modal modal--narrow" style={{ maxWidth: 540 }}>
        <header className="modal-header">
          <h3 className="modal-title">Clip</h3>
          <button className="modal-close" onClick={onClose} aria-label="Lukk">
            ×
          </button>
        </header>

        <div className="modal-body">
          {!busy && (
            <div style={{ display: "grid", gap: 16 }}>
              {noLayers && (
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
                  Du må laste opp data før du kan klippe lag.
                </div>
              )}

              {!noLayers && (
                <>
                  <div style={{ fontWeight: 600 }}>Velg lag som skal klippes</div>
                  {selectedIds.length > 0 && (
                    <div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 40 }}>
                        {selectedIds.map((id) => {
                          const layer = layers.find((l) => l.id === id);
                          return (
                            <span
                              key={id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#f3efe6",
                                border: "1px solid rgba(0,0,0,0.02)",
                                borderRadius: 9999,
                                padding: "3px 10px",
                                fontSize: 13,
                              }}
                            >
                              {layer?.name ?? "Ukjent lag"}
                              <button
                                onClick={() => removeFromSelected(id)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                  lineHeight: 1,
                                }}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div style={{ position: "relative" }} ref={sourceWrapperRef}>
                    <button
                      type="button"
                      onClick={() => setIsSourceOpen((x) => !x)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: isSourceOpen ? "8px 8px 0 0" : 8,
                        border: "1px solid var(--border)",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>
                        {selectableSourceLayers.length === 0 ? "Alle lag er valgt" : "Velg lag…"}
                      </span>
                      <span aria-hidden style={{ fontSize: 12 }}>
                        ▾
                      </span>
                    </button>

                    {isSourceOpen && selectableSourceLayers.length > 0 && (
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
                          scrollbarWidth: "none",
                        }}
                        className="clip-dropdown-scroll"
                      >
                        {selectableSourceLayers.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => addToSelected(l.id)}
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

                  <div style={{ position: "relative" }} ref={maskWrapperRef}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Klipp mot (polygon-lag)</div>
                    <button
                      type="button"
                      onClick={() => setIsMaskOpen((x) => !x)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: isMaskOpen ? "8px 8px 0 0" : 8,
                        border: "1px solid var(--border)",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>
                        {maskId
                          ? candidateMaskLayers.find((l) => l.id === maskId)?.name ??
                            "Velg maskelag…"
                          : "Velg maskelag…"}
                      </span>
                      <span aria-hidden style={{ fontSize: 12 }}>
                        ▾
                      </span>
                    </button>

                    {isMaskOpen && candidateMaskLayers.length > 0 && (
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
                          maxHeight: 160,
                          overflowY: "auto",
                          zIndex: 40,
                          scrollbarWidth: "none",
                        }}
                        className="clip-dropdown-scroll"
                      >
                        {candidateMaskLayers.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setMaskId(l.id);
                              setIsMaskOpen(false);
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
                </>
              )}

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

        {!busy && (
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>
              Lukk
            </button>
            <button
              className="btn btn-primary"
              onClick={handleClip}
              disabled={!maskId || selectedIds.length === 0 || noLayers}
            >
              Klipp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
