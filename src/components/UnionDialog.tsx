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

export default function UnionDialog({ isOpen, onClose }: Props) {
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

  // reset når dialogen lukkes
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
        <div className="upload-busy" style={{ textAlign: "center", padding: "24px 0" }}>
          <div className="spinner" style={{ width: 48, height: 48, marginBottom: 10 }} />
          <div style={{ fontWeight: 600 }}>Slår sammen...</div>
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
          Du må ha minst to lag med polygon-geometrier for å lage union.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ fontWeight: 600 }}>Velg lag som skal slås sammen</div>

          {selectedIds.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                minHeight: 36,
              }}
            >
              {selectedIds.map((id) => {
                const l = layers.find((x) => x.id === id);
                const bgColor = l?.color ?? "#f3efe6";
                return (
                  <span
                    key={id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: bgColor,
                      borderRadius: 9999,
                      border: "1px solid rgba(0,0,0,0.03)",
                      padding: "3px 10px",
                      fontSize: 13,
                    }}
                  >
                    {l?.name ?? "Ukjent lag"}
                    <button
                      onClick={() => removeSelected(id)}
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
          )}

          {/* dropdown */}
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
                {selectableLayers.length === 0
                  ? "Alle polygon-lag er valgt"
                  : "Legg til lag i union…"}
              </span>
              <span aria-hidden style={{ fontSize: 12 }}>
                ▾
              </span>
            </button>

            {isListOpen && selectableLayers.length > 0 && (
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
                  zIndex: 40,
                }}
                className="clip-dropdown-scroll"
              >
                {selectableLayers.map((l) => (
                  <button key={l.id} onClick={() => addSelected(l.id)} className="dialog-options">
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
