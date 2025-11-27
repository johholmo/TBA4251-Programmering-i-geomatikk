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
import Popup, { type Action } from "../popup/Popup";
import { isPoly, turfIntersect, unionPolygons } from "../../utils/geomaticFunctions";
import { toTransparent } from "../../utils/commonFunctions";
import { useNoOverlapToast } from "../../utils/toasts";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Klipper valgte lag mot et maskelag
// Maskelag er laget som ble tegnet som polygon i kartet
export default function Clip({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  const showNoOverlapToast = useNoOverlapToast();
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [maskId, setMaskId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isMaskOpen, setIsMaskOpen] = useState(false);
  const sourceWrapperRef = useRef<HTMLDivElement | null>(null);
  const maskWrapperRef = useRef<HTMLDivElement | null>(null);

  // Lukker hvis det klikkes utenfor
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

  // Reset når popupen lukkes
  useEffect(() => {
    if (!isOpen) {
      setBusy(false);
      setError(null);
      setIsListOpen(false);
      setSelectedIds([]);
      setMaskId("");
      setProgress(null);
    }
  }, [isOpen]);

  // Lagene som kan brukes som maskelag (polygon/multipolygon)
  const optionsMaskLayers = useMemo(
    () =>
      layers.filter((l) => l.geojson4326.features.some((f) => f.geometry && isPoly(f.geometry))),
    [layers]
  );
  const selectableSourceLayers = layers.filter((l) => !selectedIds.includes(l.id));
  const noLayers = layers.length === 0;

  // Funksjon for å legge til valgte lag
  const addToSelected = (id: string) => {
    if (!id) return;
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  // Funksjon for å fjerne valgte lag
  const removeFromSelected = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  // Håndterer selve klippe-operasjonen (hjelp fra AI til å gjøre det sekvensielt)
  function handleClip() {
    if (!maskId || selectedIds.length === 0 || busy) return;

    // Finner maskelaget
    const maskLayer = layers.find((l) => l.id === maskId);
    if (!maskLayer) {
      setError("Fant ikke maskelaget.");
      return;
    }

    // Hent alle polygon/multipolygon-masker
    const maskFeatures = maskLayer.geojson4326.features.filter(
      (f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
    ) as Feature<Polygon | MultiPolygon>[];

    if (maskFeatures.length === 0) {
      setError("Maskelaget må inneholde polygon-geometri.");
      return;
    }

    // Tips fra AI: Lag en samlet union-maske (mye raskere enn å loope over alle maskefeatures for hver source-feature)
    const maskUnion = unionPolygons(maskFeatures);
    if (!maskUnion || !maskUnion.geometry) {
      setError("Klarte ikke å lage en samlet maske.");
      return;
    }

    const maskFeat: Feature<Polygon | MultiPolygon> = {
      type: "Feature",
      properties: {},
      geometry: maskUnion.geometry,
    };

    const sourceIds = [...selectedIds];
    const total = sourceIds.length;

    setBusy(true); // Starter spinner
    setError(null);
    setProgress({ current: 1, total });

    // Samle lag uten overlapp til å vise i toast etterpå
    const noOverlapLayers: string[] = [];

    // Prosesser ett lag av gangen med setTimeout slik at det ikke ser fryst ut for brukeren
    const processLayer = (index: number) => {
      if (index >= total) {
        // Ferdig med alle lag
        setBusy(false);
        setProgress(null);
        setSelectedIds([]);
        setMaskId("");
        setIsListOpen(false);
        setIsMaskOpen(false);
        // Vis toast hvis noen lag ikke hadde overlapp
        if (noOverlapLayers.length > 0) {
          showNoOverlapToast(noOverlapLayers);
        }
        onClose();
        return;
      }

      const srcId = sourceIds[index];
      const src = layers.find((l) => l.id === srcId);
      if (!src) {
        setProgress({ current: index + 1, total });
        setTimeout(() => processLayer(index + 1), 0);
        return;
      }

      // Begynn klipping
      try {
        const outFeatures4326: Feature<Geometry>[] = [];

        for (const feature of src.geojson4326.features) {
          if (!feature.geometry) continue;

          const geomType = feature.geometry.type;

          try {
            // Polygon klipping
            if (geomType === "Polygon" || geomType === "MultiPolygon") {
              const srcFeat: Feature<Polygon | MultiPolygon> = {
                type: "Feature",
                properties: feature.properties || {},
                geometry: feature.geometry as Polygon | MultiPolygon,
              };

              // Sjekk om de faktisk intersecter før klipping
              const hasIntersection = booleanIntersects(maskFeat as any, srcFeat as any);
              if (!hasIntersection) continue;

              let clipped: Feature<Polygon | MultiPolygon> | null = null;

              try {
                clipped = turfIntersect(maskFeat as any, srcFeat as any);
              } catch {
                // Prøver å rense koordinatene hvis turf feiler
                const cleanedMask = cleanCoords(maskFeat.geometry as any) as Polygon | MultiPolygon;
                const cleanedSrc = cleanCoords(srcFeat.geometry as any) as Polygon | MultiPolygon;

                const cleanedMaskFeat: Feature<Polygon | MultiPolygon> = {
                  type: "Feature",
                  properties: {},
                  geometry: cleanedMask,
                };
                const cleanedSrcFeat: Feature<Polygon | MultiPolygon> = {
                  type: "Feature",
                  properties: feature.properties || {},
                  geometry: cleanedSrc,
                };

                try {
                  clipped = turfIntersect(cleanedMaskFeat as any, cleanedSrcFeat as any);
                } catch {
                  clipped = null;
                }
              }

              // Legg til i output hvis det ble noe klippet ut
              if (clipped && clipped.geometry) {
                outFeatures4326.push({
                  type: "Feature",
                  properties: feature.properties || {},
                  geometry: clipped.geometry as Geometry,
                });
              }

              continue;
            }

            // Linje klipping
            if (geomType === "LineString" || geomType === "MultiLineString") {
              const lineFeat: Feature<LineString | MultiLineString> = {
                type: "Feature",
                properties: feature.properties || {},
                geometry: feature.geometry as LineString | MultiLineString,
              };

              const intersects = booleanIntersects(maskFeat as any, lineFeat as any);
              if (intersects) {
                outFeatures4326.push(lineFeat as Feature<Geometry>);
              }

              continue;
            }

            // Punkt klipping
            if (geomType === "Point") {
              const isInside = booleanPointInPolygon(
                feature.geometry as any,
                maskFeat.geometry as any
              );
              if (isInside) {
                outFeatures4326.push(feature as Feature<Geometry>);
              }
            }
          } catch (err) {
            console.warn(`Det skjedde en feil når ${geomType} ble forsøkt klippet:`, err);
          }
        }

        // Legg til nytt lag med navn, projisering og farge hvis det ble noen features etter klipping
        if (outFeatures4326.length > 0) {
          const outFC4326: FeatureCollection<Geometry> = {
            type: "FeatureCollection",
            features: outFeatures4326,
          };
          addLayer({
            name: `${src.name}_CLIP`,
            geojson4326: outFC4326,
            color: src.color,
            visible: true,
          });
        } else {
          // Vis toast
          noOverlapLayers.push(src.name);
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Klarte ikke å klippe lagene.");
      } finally {
        // oppdater progresjon og gå videre til neste lag
        setProgress({ current: index + 1, total });
        setTimeout(() => processLayer(index + 1), 0);
      }
    };

    // start første lag
    setTimeout(() => processLayer(0), 0);
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
          label: "Klipp",
          variant: "primary",
          onClick: handleClip,
          disabled: busy || !maskId || selectedIds.length === 0 || noLayers,
        },
      ];

  // HTML for popupen
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Clip"
      width="narrow"
      actions={actions}
      hideCloseIcon={busy}
    >
      {busy ? (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">
            Klipper...
            {progress && (
              <div style={{ fontSize: 14, marginTop: 6, textAlign: "center" }}>
                Lag {progress.current} av {progress.total}
              </div>
            )}
          </div>
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
                {/* Valgte lag */}
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

                {/* Dropdown */}
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
                        ? (optionsMaskLayers.find((l) => l.id === maskId)?.name ?? "Velg maskelag…")
                        : "Velg maskelag…"}
                    </span>
                    <span aria-hidden className="dropdown-hidden">
                      ▾
                    </span>
                  </button>

                  {isMaskOpen && optionsMaskLayers.length > 0 && (
                    <div className="clip-dropdown-scroll">
                      {optionsMaskLayers
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
