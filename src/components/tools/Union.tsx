import { useEffect, useRef, useState } from "react";
import { useLayers } from "../../context/LayersContext";
import type { FeatureCollection, Geometry } from "geojson";
import Popup, { type Action } from "../popup/Popup";
import { isPoly } from "../../utils/geomaticFunctions";
import { toTransparent } from "../../utils/commonFunctions";
import GeoWorker from "../../workers/geoworkers?worker";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type WorkerMessage =
  | {
      id: string;
      ok: true;
      type: "union";
      result: {
        fc4326: FeatureCollection<Geometry>;
        fc25832: FeatureCollection<Geometry>;
      };
    }
  | {
      id: string;
      ok: false;
      type: "union";
      error: string;
    };

// Slår sammen flere polygonlag til ett lag
export default function Union({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

  // Unioner kun lag som har minst en polygon eller multipolygon
  const polygonLayers = layers.filter((l) =>
    l.geojson4326.features.some((f) => isPoly(f.geometry))
  );
  const selectableLayers = polygonLayers.filter((l) => !selectedIds.includes(l.id));
  const hasLayers = polygonLayers.length > 1;

  // Init / cleanup worker
  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new GeoWorker();
    }
    const worker = workerRef.current;

    const handleMessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type !== "union") return;
      if (!currentJobIdRef.current || msg.id !== currentJobIdRef.current) return;

      if (!msg.ok) {
        setError(msg.error || "Klarte ikke å lage union (worker-feil).");
        setBusy(false);
        currentJobIdRef.current = null;
        return;
      }

      try {
        const { fc4326, fc25832 } = msg.result;

        const chosenLayers = layers.filter((l) => selectedIds.includes(l.id));
        if (!chosenLayers.length) {
          throw new Error("Fant ikke lagene for union-resultat.");
        }

        addLayer({
          name: "UNION_LAYER",
          sourceCrs: "EPSG:25832",
          geojson25832: fc25832,
          geojson4326: fc4326,
          color: chosenLayers[0].color,
          visible: true,
        });

        setBusy(false);
        currentJobIdRef.current = null;
        onClose();
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Klarte ikke å legge til union-resultat.");
        setBusy(false);
        currentJobIdRef.current = null;
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Feil i geo-worker:", event.message);
      setError("Feil ved lasting av geo-worker. Operasjonen ble avbrutt.");
      setBusy(false);
      currentJobIdRef.current = null;
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    return () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, selectedIds, addLayer, onClose]);

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
      currentJobIdRef.current = null;
    }
  }, [isOpen]);

  // Legg til valgte lag
  function addSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  // Fjern valgte lag
  function removeSelected(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  // Håndterer selve union-operasjonen via worker
  function handleUnion() {
    if (selectedIds.length < 2 || busy) return;

    const worker = workerRef.current;
    if (!worker) {
      setError("Worker ikke initialisert.");
      return;
    }

    const chosenLayers = layers.filter((l) => selectedIds.includes(l.id));
    if (chosenLayers.length < 2) {
      setError("Velg minst to lag med polygon-geometrier.");
      return;
    }

    const layerFcs: FeatureCollection<Geometry>[] = chosenLayers.map(
      (l) => l.geojson4326 as FeatureCollection<Geometry>
    );

    setBusy(true);
    setError(null);

    const jobId = crypto.randomUUID();
    currentJobIdRef.current = jobId;

    worker.postMessage({
      id: jobId,
      type: "union",
      layers: layerFcs,
    });
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
          <div className="busy-text">Slår sammen... </div>
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
                style={{ borderRadius: isListOpen ? "8px 8px 0 0" : "8px" }}
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
