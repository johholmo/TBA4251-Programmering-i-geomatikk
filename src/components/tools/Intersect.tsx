import { useEffect, useRef, useState } from "react";
import { useLayers } from "../../context/LayersContext";
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";
import cleanCoords from "@turf/clean-coords";
import bbox from "@turf/bbox";
import booleanIntersects from "@turf/boolean-intersects";
import { to25832 } from "../../utils/geomaticFunctions";
import Popup, { type Action } from "../popup/Popup";
import { isPoly, turfIntersect } from "../../utils/geomaticFunctions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Finner overlapp mellom to polygonlag
export default function Intersect({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  // Definerer eget for lag A og B
  const [layerAId, setLayerAId] = useState<string>("");
  const [layerBId, setLayerBId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListAOpen, setIsListAOpen] = useState(false);
  const [isListBOpen, setIsListBOpen] = useState(false);
  const listARef = useRef<HTMLDivElement | null>(null);
  const listBRef = useRef<HTMLDivElement | null>(null);

  // Finner polygonlagene som kan velges
  const polygonLayers = layers.filter((l) =>
    l.geojson4326.features.some((f) => isPoly(f.geometry))
  );
  const hasLayers = polygonLayers.length >= 2;

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

  // Håndterer selve intersecten
  function handleIntersect() {
    if (!layerAId || !layerBId || layerAId === layerBId || busy) return;

    setBusy(true); // Starter spinner
    setError(null);

    setTimeout(() => {
      let success = false;

      try {
        // Finner lagene
        const layerA = polygonLayers.find((l) => l.id === layerAId);
        const layerB = polygonLayers.find((l) => l.id === layerBId);

        if (!layerA || !layerB) {
          throw new Error("Fant ikke begge lagene som skulle intersectes.");
        }

        // Finner polygonene
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

        const outFeatures: Feature<Geometry>[] = [];
        const seenGeoms = new Set<string>();

        // Gå gjennom alle kombinasjoner av features i A og B
        for (const fa of featsA) {
          for (const fb of featsB) {
            const geomA = fa.geometry;
            const geomB = fb.geometry;

            if (!geomA || !geomB) continue;

            // Se om bounding boxes overlapper
            const bbA = bbox(geomA as any);
            const bbB = bbox(geomB as any);
            const overlap =
              bbA[0] <= bbB[2] && bbA[2] >= bbB[0] && bbA[1] <= bbB[3] && bbA[3] >= bbB[1];

            // Hvis ingen overlapp, fortsett
            if (!overlap) continue;

            // Sjekk om de faktisk intersecter
            const inters = booleanIntersects(
              { type: "Feature", properties: {}, geometry: geomA } as any,
              { type: "Feature", properties: {}, geometry: geomB } as any
            );

            // Hvis ikke intersect, fortsett
            if (!inters) continue;

            // Prøver å finne intersect
            let clipped: Feature<Polygon | MultiPolygon> | null = null;

            try {
              clipped = turfIntersect(fa as any, fb as any);
            } catch (err1) {
              // Hvis trøbbel med turf, prøv å rense geometrier først (tips fra AI)
              const cleanedA = cleanCoords(geomA as any) as Polygon | MultiPolygon;
              const cleanedB = cleanCoords(geomB as any) as Polygon | MultiPolygon;

              const featCleanA: Feature<Polygon | MultiPolygon> = {
                type: "Feature",
                properties: fa.properties || {},
                geometry: cleanedA,
              };
              const featCleanB: Feature<Polygon | MultiPolygon> = {
                type: "Feature",
                properties: fb.properties || {},
                geometry: cleanedB,
              };

              // Prøver på nytt med renset geometri
              try {
                clipped = turfIntersect(featCleanA as any, featCleanB as any);
              } catch {
                continue;
              }
            }

            // Hvis intersect mislykkes, fortsett
            if (!clipped || !clipped.geometry) continue;

            // Unngå duplikater ved å sjekke geometri
            const geomKey = JSON.stringify(clipped.geometry);
            if (seenGeoms.has(geomKey)) continue;
            seenGeoms.add(geomKey);

            const mergedProps = {
              ...(fa.properties || {}),
              ...(fb.properties || {}),
            };
            // Legger til merget i output
            outFeatures.push({
              type: "Feature",
              properties: mergedProps,
              geometry: clipped.geometry as Geometry,
            });
          }
        }

        // Legger til som nytt lag med navn, farge og projisering
        const intersect4326: FeatureCollection<Geometry> = {
          type: "FeatureCollection",
          features: outFeatures,
        };
        const intersect25832 = to25832(intersect4326);
        const nameA = layerA.name || "LagA";
        const nameB = layerB.name || "LagB";
        const newName = `${nameA} ∩ ${nameB}`;

        addLayer({
          name: newName,
          sourceCrs: "EPSG:25832",
          geojson25832: intersect25832,
          geojson4326: intersect4326,
          color: layerA.color,
          visible: true,
        });

        success = true;
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Klarte ikke å utføre intersect.");
      } finally {
        setBusy(false); // Stopper spinner og lukker popup
        if (success) {
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
        { label: "Lukk", variant: "secondary", onClick: onClose, disabled: busy },
        {
          label: "Utfør",
          variant: "primary",
          onClick: handleIntersect,
          disabled: busy || !layerAId || !layerBId || layerAId === layerBId,
        },
      ];

  // HTML for popupen
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
          <div className="busy-text">Beregner overlapp…</div>
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
                style={{
                  borderRadius: isListAOpen ? "8px 8px 0 0" : "8px",
                }}
                onClick={() => setIsListAOpen((x) => !x)}
              >
                <span className="dropdown-text">
                  {layerAId
                    ? (polygonLayers.find((l) => l.id === layerAId)?.name ?? "Velg lag A…")
                    : "Velg lag A…"}
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

          <div>
            {/* Lag B */}
            <div className="choose-layer-text">Lag B</div>
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
