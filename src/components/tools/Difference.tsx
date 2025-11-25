import { useEffect, useRef, useState } from "react";
import { useLayers } from "../../context/LayersContext";
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";
import cleanCoords from "@turf/clean-coords";
import bbox from "@turf/bbox";
import booleanIntersects from "@turf/boolean-intersects";
import Popup, { type Action } from "../popup/Popup";
import { isPoly, turfDifference, to25832 } from "../../utils/geomaticFunctions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Finner forskjellen mellom to polygonlag
export default function Difference({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  // Definerer for lag A og B
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

  // Lukk klikk utenfor
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

  // Håndterer difference
  function handleDifference() {
    // Hvis ikke lag er valgt eller samme lag, returner
    if (!layerAId || !layerBId || layerAId === layerBId || busy) {
      if (!busy && layerAId && layerBId && layerAId === layerBId) {
        setError("Velg to ulike polygon-lag for A og B.");
      }
      return;
    }

    setBusy(true); // Start spinner
    setError(null);

    setTimeout(() => {
      let success = false;

      try {
        // Prøver å finne lag A og B
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

        // Må ha polygoner i begge lag
        if (featsA.length === 0 || featsB.length === 0) {
          throw new Error("Manglende polygon-geometrier i ett eller begge lag.");
        }

        const outFeatures: Feature<Geometry>[] = [];

        // For hvert A-polygon, trekk fra alle B-polygoner ett og ett
        for (const fa of featsA) {
          let currentGeom: Polygon | MultiPolygon | null = fa.geometry || null;
          if (!currentGeom) continue;

          for (const fb of featsB) {
            if (!currentGeom) break; // A er sjekket ferdig

            const geomB = fb.geometry;
            if (!geomB) continue;

            // Sjekker først om bounding boxer overlapper
            const bbA = bbox(currentGeom as any);
            const bbB = bbox(geomB as any);
            const overlapBBox =
              bbA[0] <= bbB[2] && bbA[2] >= bbB[0] && bbA[1] <= bbB[3] && bbA[3] >= bbB[1];
            if (!overlapBBox) {
              // ingen overlapp i det hele tatt
              continue;
            }

            // Sjekker så med mer nøyaktig intersect
            const intersects = booleanIntersects(
              { type: "Feature", properties: {}, geometry: currentGeom } as any,
              { type: "Feature", properties: {}, geometry: geomB } as any
            );
            if (!intersects) {
              // ingen faktisk overlapp
              continue;
            }

            // Prøver difference: currentGeom - geomB
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
              // Hvis trøbbel med turf, prøv å rense geometrier først (tips fra AI)
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
                // Prøver difference igjen med rensede geometrier
                const res = turfDifference(featCleanA, featCleanB);
                if (!res || !res.geometry) {
                  currentGeom = null;
                  break;
                }
                currentGeom = res.geometry;
              } catch (err2) {
                // Hvis det fortsatt feiler: la currentGeom være som den er og gå videre til neste B
                continue;
              }
            }
          }
          // Etter å ha trukket fra alle B, legg til i output hvis noe er igjen
          if (currentGeom) {
            outFeatures.push({
              type: "Feature",
              properties: { ...(fa.properties || {}) },
              geometry: currentGeom as Geometry,
            });
          }
        }

        // Legger til nytt lag med navn, farge og projisering
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
          // Lukk popup og stopp spinner
          onClose();
        }
      }
    }, 0);
  }

  if (!isOpen) return null;

  // Knappene i popupen
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
          label: "Utfør",
          variant: "primary",
          onClick: handleDifference,
          disabled: busy || !layerAId || !layerBId || layerAId === layerBId,
        },
      ];

  // HTML for popupen
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Difference"
      width="narrow"
      actions={actions}
      hideCloseIcon={busy}
    >
      {busy ? (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">Utfører difference…</div>
        </div>
      ) : !hasLayers ? (
        <div className="warning-message">
          Du må ha minst to lag med polygon-geometrier for å bruke difference.
        </div>
      ) : (
        <div className="choose-layer-container">
          <div className="field-group">
            {/* Velg lag A (beholde)*/}
            <div className="choose-layer-text">Velg laget du vil beholde (A)</div>
            <div className="dropdown" ref={listARef}>
              <button
                type="button"
                className="dropdown-toggle"
                style={{
                  borderRadius: isListAOpen ? "8px 8px 0 0" : "8px",
                }}
                onClick={() => setIsListAOpen((x) => !x)}
              >
                <span className="dropdown-text">
                  {layerAId
                    ? (polygonLayers.find((l) => l.id === layerAId)?.name ?? "Velg lag")
                    : "Velg lag"}
                </span>
                <span area-hidden className="dropdown-hidden">
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

          <div className="field-group">
            {/* Velg lag B (trekke fra)*/}
            <div className="choose-layer-text">Velg laget du vil trekke fra (B)</div>
            <div className="dropdown" ref={listBRef}>
              <button
                type="button"
                className="dropdown-toggle"
                style={{
                  borderRadius: isListBOpen ? "8px 8px 0 0" : "8px",
                }}
                onClick={() => setIsListBOpen((x) => !x)}
              >
                <span className="dropdown-text">
                  {layerBId
                    ? (polygonLayers.find((l) => l.id === layerBId)?.name ?? "Velg lag B…")
                    : "Velg lag B…"}
                </span>
                <span area-hidden className="dropdown-hidden">
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
