import { useEffect, useRef, useState } from "react";
import { useLayers } from "../../context/LayersContext";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";
import { to25832 } from "../../utils/geomaticFunctions";
import Popup, { type Action } from "../popup/Popup";
import { isPoly } from "../../utils/geomaticFunctions";
import { toTransparent } from "../../utils/commonFunctions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Slår sammen flere polygonlag til ett lag
export default function Union({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Lukk ved klikk utenfor
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

  // Reset felt når popupen lukkes
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

  // Legg til valgte lag
  function addSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  // Fjern valgte lag
  function removeSelected(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  // Håndterer selve union-operasjonen
  function handleUnion() {
    if (selectedIds.length < 2 || busy) return;

    setBusy(true); // Start spinner
    setError(null);

    setTimeout(() => {
      let success = false;

      try {
        // Valgte lag
        const chosenLayers = layers.filter(
          (l) => selectedIds.includes(l.id) && polygonLayers.some((p) => p.id === l.id)
        );

        // Må ha minst to lag å slå sammen
        if (chosenLayers.length < 2) {
          throw new Error("Velg minst to lag med polygon-geometrier.");
        }

        // Samle alle polygon/multipolygon-features i 4326 format
        const allPolyFeatures: Feature<Polygon | MultiPolygon>[] = [];
        for (const l of chosenLayers) {
          for (const f of l.geojson4326.features) {
            if (isPoly(f.geometry)) {
              const cloned = {
                type: "Feature",
                properties: { ...(f.properties || {}) },
                geometry: JSON.parse(JSON.stringify(f.geometry)),
              } as Feature<Polygon | MultiPolygon>;
              allPolyFeatures.push(cloned);
            }
          }
        }

        // Trenger minst to polygon-geometrier for å lage union
        if (allPolyFeatures.length < 2) {
          throw new Error("Fant ikke nok polygon-geometrier i de valgte lagene til å lage union.");
        }

        // Lag union
        const fc: FeatureCollection<Polygon | MultiPolygon> = {
          type: "FeatureCollection",
          features: allPolyFeatures,
        };

        let unionFeature: Feature<Polygon | MultiPolygon> | null = null;

        // Try/catch fordi masse trøbbel med turf, men dette funker
        try {
          // Prøver først med hele featurecollectionen
          unionFeature = (turf as any).union(fc) as Feature<Polygon | MultiPolygon> | null;
        } catch {
          let acc: Feature<Polygon | MultiPolygon> | null = allPolyFeatures[0];
          // Hvis det feiler, gjør det iterativt
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

        // Tilbake til featurecollection
        const union4326: FeatureCollection<Geometry> = {
          type: "FeatureCollection",
          features: [unionFeature as Feature<Geometry>],
        };

        // Projiser til 25832
        const union25832 = to25832(union4326);

        // Legg til i sidebar med fast navn og farge fra første valgte lag
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
        // Stopp spinner og lukk popup
        setBusy(false);
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
          label: "Slå sammen",
          variant: "primary",
          onClick: handleUnion,
          disabled: busy || selectedIds.length < 2,
        },
      ];

  // HTML for popupen
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Union"
      width="narrow"
      actions={actions}
      hideCloseIcon={busy}
    >
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
            {/* Velg lag */}
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
