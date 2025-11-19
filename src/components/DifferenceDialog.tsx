import { useEffect, useRef, useState } from "react";
import { useLayers } from "../context/LayersContext";
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";
import cleanCoords from "@turf/clean-coords";
import bbox from "@turf/bbox";
import booleanIntersects from "@turf/boolean-intersects";
import difference from "@turf/difference";
import Popup from "./popup/Popup";

import { to25832 } from "../utils/reproject";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function isPoly(g: Geometry | null | undefined): g is Polygon | MultiPolygon {
  return !!g && (g.type === "Polygon" || g.type === "MultiPolygon");
}

// Wrapper med samme logikk som i ClipDialog
function turfDifference(
  a: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon,
  b: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon
): Feature<Polygon | MultiPolygon> | null {
  const fn = difference as any;

  try {
    // Prøv først vanlig difference(a, b)
    return fn(a, b) as Feature<Polygon | MultiPolygon> | null;
  } catch (e: any) {
    const msg = e?.message || "";

    // Typiske feil pga turf, så eliminerer dem
    if (
      !msg.includes("Must have at least two features") &&
      !msg.includes("Must specify at least 2 geometries")
    ) {
      throw e;
    }

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

    const fc: FeatureCollection<Polygon | MultiPolygon> = {
      type: "FeatureCollection",
      features: [featA, featB],
    };

    // Kaller difference på nytt, men med FeatureCollection
    return fn(fc) as Feature<Polygon | MultiPolygon> | null;
  }
}

export default function DifferenceDialog({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();

  const [layerAId, setLayerAId] = useState<string>("");
  const [layerBId, setLayerBId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListAOpen, setIsListAOpen] = useState(false);
  const [isListBOpen, setIsListBOpen] = useState(false);
  const listARef = useRef<HTMLDivElement | null>(null);
  const listBRef = useRef<HTMLDivElement | null>(null);

  // polygon-lag
  const polygonLayers = layers.filter((l) =>
    l.geojson4326.features.some((f) => isPoly(f.geometry))
  );

  const hasLayers = polygonLayers.length >= 2;

  // lukk dropdown ved klikk utenfor
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

  // reset når dialogen lukkes
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

  function handleDifference() {
    if (!layerAId || !layerBId || layerAId === layerBId || busy) {
      if (!busy && layerAId && layerBId && layerAId === layerBId) {
        setError("Velg to ulike polygon-lag for A og B.");
      }
      return;
    }

    setBusy(true);
    setError(null);

    setTimeout(() => {
      let success = false;

      try {
        const layerA = polygonLayers.find((l) => l.id === layerAId);
        const layerB = polygonLayers.find((l) => l.id === layerBId);

        if (!layerA || !layerB) {
          throw new Error("Fant ikke begge lagene for difference.");
        }

        // Samle polygoner i A og B
        const featsA: Feature<Polygon | MultiPolygon>[] = [];
        const featsB: Feature<Polygon | MultiPolygon>[] = [];

        for (const f of layerA.geojson4326.features) {
          if (isPoly(f.geometry)) {
            featsA.push({
              type: "Feature",
              properties: { ...(f.properties || {}) },
              geometry: JSON.parse(JSON.stringify(f.geometry)),
            });
          }
        }

        for (const f of layerB.geojson4326.features) {
          if (isPoly(f.geometry)) {
            featsB.push({
              type: "Feature",
              properties: { ...(f.properties || {}) },
              geometry: JSON.parse(JSON.stringify(f.geometry)),
            });
          }
        }

        if (featsA.length === 0 || featsB.length === 0) {
          throw new Error("Manglende polygon-geometrier i ett eller begge lag.");
        }

        const outFeatures: Feature<Geometry>[] = [];

        // for hvert A-polygon, trekk fra alle B-polygoner ett og ett
        for (const fa of featsA) {
          let currentGeom: Polygon | MultiPolygon | null = fa.geometry || null;
          if (!currentGeom) continue;

          for (const fb of featsB) {
            if (!currentGeom) break; // A er sjekket ferdig

            const geomB = fb.geometry;
            if (!geomB) continue;

            const bbA = bbox(currentGeom as any);
            const bbB = bbox(geomB as any);

            const overlapBBox =
              bbA[0] <= bbB[2] && bbA[2] >= bbB[0] && bbA[1] <= bbB[3] && bbA[3] >= bbB[1];

            if (!overlapBBox) {
              // ingen overlapp i det hele tatt
              continue;
            }

            const intersects = booleanIntersects(
              { type: "Feature", properties: {}, geometry: currentGeom } as any,
              { type: "Feature", properties: {}, geometry: geomB } as any
            );

            if (!intersects) {
              // ingen faktisk overlapp
              continue;
            }

            // Prøv difference: currentGeom - geomB
            try {
              const res = turfDifference(
                {
                  type: "Feature",
                  properties: {},
                  geometry: currentGeom,
                } as Feature<Polygon | MultiPolygon>,
                fb as Feature<Polygon | MultiPolygon>
              );

              if (!res || !res.geometry) {
                // Hele currentGeom inni B, så vi har ingenting igjen
                currentGeom = null;
                break;
              }

              currentGeom = res.geometry;
            } catch (err1) {
              console.warn("Difference feilet for ett A/B-par, prøver med rens:", err1);

              const cleanedA = cleanCoords(currentGeom as any) as Polygon | MultiPolygon;
              const cleanedB = cleanCoords(geomB as any) as Polygon | MultiPolygon;

              const featCleanA: Feature<Polygon | MultiPolygon> = {
                type: "Feature",
                properties: {},
                geometry: cleanedA,
              };
              const featCleanB: Feature<Polygon | MultiPolygon> = {
                type: "Feature",
                properties: {},
                geometry: cleanedB,
              };

              try {
                const res = turfDifference(featCleanA, featCleanB);
                if (!res || !res.geometry) {
                  currentGeom = null;
                  break;
                }
                currentGeom = res.geometry;
              } catch (err2) {
                console.warn("Difference feilet selv etter rensing, hopper over dette B:", err2);
                // Hvis det fortsatt feiler: la currentGeom være som den er og gå videre til neste B
                continue;
              }
            }
          }

          if (currentGeom) {
            outFeatures.push({
              type: "Feature",
              properties: { ...(fa.properties || {}) },
              geometry: currentGeom as Geometry,
            });
          }
        }

        if (outFeatures.length === 0) {
          console.warn("Difference-resultatet ble tomt – alle A-polygoner ble fjernet.");
        }

        const diff4326: FeatureCollection<Geometry> = {
          type: "FeatureCollection",
          features: outFeatures,
        };

        const diff25832 = to25832(diff4326);
        const nameA = layerA.name || "LagA";
        const nameB = layerB.name || "LagB";
        const newName = `${nameA} - ${nameB}`;

        addLayer({
          name: newName,
          sourceCrs: "EPSG:25832",
          geojson25832: diff25832,
          geojson4326: diff4326,
          color: layerA.color,
          visible: true,
        });

        success = true;
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Klarte ikke å utføre difference.");
      } finally {
        setBusy(false);
        if (success) {
          onClose();
        }
      }
    }, 0);
  }

  if (!isOpen) return null;

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Difference"
      width="narrow"
      actions={[
        { label: "Lukk", variant: "secondary", onClick: onClose, disabled: busy },
        {
          label: "Utfør",
          variant: "primary",
          onClick: handleDifference,
          disabled: busy || !layerAId || !layerBId || layerAId === layerBId,
          loading: busy,
        },
      ]}
    >
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
          Du må ha minst to lag med polygon-geometrier for å bruke difference.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ fontWeight: 600 }}>Velg laget du vil beholde (A)</div>

          <div>
            <div style={{ position: "relative" }} ref={listARef}>
              <button
                type="button"
                onClick={() => setIsListAOpen((x) => !x)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: isListAOpen ? "8px 8px 0 0" : 8,
                  border: "1px solid var(--border)",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 14 }}>
                  {layerAId
                    ? polygonLayers.find((l) => l.id === layerAId)?.name ?? "Velg lag"
                    : "Velg lag"}
                </span>
                <span aria-hidden style={{ fontSize: 12 }}>
                  ▾
                </span>
              </button>

              {isListAOpen && (
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
                        setLayerAId(l.id);
                        if (layerBId === l.id) setLayerBId("");
                        setIsListAOpen(false);
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

          <div style={{ fontWeight: 600 }}>Velg laget du vil trekke fra (B)</div>

          <div>
            <div style={{ position: "relative" }} ref={listBRef}>
              <button
                type="button"
                onClick={() => setIsListBOpen((x) => !x)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: isListBOpen ? "8px 8px 0 0" : 8,
                  border: "1px solid var(--border)",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 14 }}>
                  {layerBId
                    ? polygonLayers.find((l) => l.id === layerBId)?.name ?? "Velg lag B…"
                    : "Velg lag B…"}
                </span>
                <span aria-hidden style={{ fontSize: 12 }}>
                  ▾
                </span>
              </button>

              {isListBOpen && (
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
                  {polygonLayers
                    .filter((l) => l.id !== layerAId)
                    .map((l) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          setLayerBId(l.id);
                          setIsListBOpen(false);
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
