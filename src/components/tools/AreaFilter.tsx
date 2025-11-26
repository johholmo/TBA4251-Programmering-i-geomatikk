import { useEffect, useRef, useState } from "react";
import { useLayers } from "../../context/LayersContext";
import type { FeatureCollection, Geometry } from "geojson";
import Popup, { type Action } from "../popup/Popup";
import { isPoly } from "../../utils/geomaticFunctions";
import GeoWorker from "../../workers/geoworkers?worker";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type WorkerMessage =
  | {
      id: string;
      ok: true;
      type: "areaFilter";
      result: {
        fc4326: FeatureCollection<Geometry>;
        fc25832: FeatureCollection<Geometry>;
      };
    }
  | {
      id: string;
      ok: false;
      type: "areaFilter";
      error: string;
    };

// Hovedkomponent for AreaFilter-verktøyet
export default function AreaFilter({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();

  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [minArea, setMinArea] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const currentJobIdRef = useRef<string | null>(null);
  const currentMinAreaRef = useRef<number | null>(null);

  const polygonLayers = layers.filter((l) =>
    l.geojson4326.features.some((f) => isPoly(f.geometry))
  );
  const hasLayers = polygonLayers.length > 0;
  const selectedLayer = polygonLayers.find((l) => l.id === selectedLayerId) || null;

  // Lukk dropdown ved klikk utenfor
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

  // Init / cleanup worker
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new GeoWorker();
    }
    const worker = workerRef.current;

    const handleMessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type !== "areaFilter") return;
      if (!currentJobIdRef.current || msg.id !== currentJobIdRef.current) return;

      if (!msg.ok) {
        setError(msg.error || "Klarte ikke å finne store områder (worker-feil).");
        setBusy(false);
        currentJobIdRef.current = null;
        currentMinAreaRef.current = null;
        return;
      }

      try {
        const { fc4326, fc25832 } = msg.result;
        const minAreaM2 = currentMinAreaRef.current ?? 0;

        if (!fc4326.features.length) {
          setError(`Fant ingen sammenhengende områder ≥ ${minAreaM2.toLocaleString("nb-NO")} m².`);
          setBusy(false);
          currentJobIdRef.current = null;
          currentMinAreaRef.current = null;
          return;
        }

        const layer = polygonLayers.find((l) => l.id === selectedLayerId);
        if (!layer) {
          throw new Error("Fant ikke valgt lag for område-resultat.");
        }

        const newName = `${layer.name}_AREA_≥${minAreaM2}m2`;
        addLayer({
          name: newName,
          sourceCrs: "EPSG:25832",
          geojson25832: fc25832,
          geojson4326: fc4326,
          color: layer.color,
          visible: true,
        });

        setBusy(false);
        currentJobIdRef.current = null;
        currentMinAreaRef.current = null;
        onClose();
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Klarte ikke å legge til områdelag.");
        setBusy(false);
        currentJobIdRef.current = null;
        currentMinAreaRef.current = null;
      }
    };

    worker.addEventListener("message", handleMessage);
    return () => {
      worker.removeEventListener("message", handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygonLayers, selectedLayerId, addLayer, onClose]);

  // Reset felt når popup lukkes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLayerId("");
      setMinArea("");
      setBusy(false);
      setError(null);
      setIsListOpen(false);
      currentJobIdRef.current = null;
      currentMinAreaRef.current = null;
    }
  }, [isOpen]);

  // Hovedfunksjon for å finne og lage nytt lag med store områder via worker
  function handleRun() {
    const minAreaM2 = parseFloat(minArea);
    if (!selectedLayerId || !Number.isFinite(minAreaM2) || minAreaM2 <= 0 || busy) return;

    const worker = workerRef.current;
    if (!worker) {
      setError("Worker ikke initialisert.");
      return;
    }

    const layer = polygonLayers.find((l) => l.id === selectedLayerId);
    if (!layer) {
      setError("Fant ikke valgt lag.");
      return;
    }

    setError(null);
    setBusy(true);

    const jobId = crypto.randomUUID();
    currentJobIdRef.current = jobId;
    currentMinAreaRef.current = minAreaM2;

    const job = {
      id: jobId,
      type: "areaFilter" as const,
      layer: layer.geojson4326 as FeatureCollection<Geometry>,
      minArea: minAreaM2,
    };

    worker.postMessage(job);
  }

  if (!isOpen) return null;

  const minAreaValue = parseFloat(minArea);
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
          label: "Finn områder",
          variant: "primary",
          onClick: handleRun,
          disabled: busy || !selectedLayerId || !Number.isFinite(minAreaValue) || minAreaValue <= 0,
        },
      ];

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Store sammenhengende områder"
      width="narrow"
      actions={actions}
      hideCloseIcon={busy}
    >
      {busy ? (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">Finner områder...</div>
        </div>
      ) : !hasLayers ? (
        <div className="warning-message">
          Du må ha minst ett lag med polygon-geometrier for å bruke dette verktøyet.
        </div>
      ) : (
        <div className="choose-layer-container">
          <div className="field-group">
            {/* Velg lag*/}
            <div className="choose-layer-text">Velg polygonlag</div>
            <div className="dropdown" ref={listRef}>
              <button
                type="button"
                className="dropdown-toggle"
                style={{ borderRadius: isListOpen ? "8px 8px 0 0" : "8px" }}
                onClick={() => setIsListOpen((x) => !x)}
              >
                <span className="dropdown-text">
                  {selectedLayer ? selectedLayer.name : "Velg lag…"}
                </span>
                <span aria-hidden className="dropdown-hidden">
                  ▾
                </span>
              </button>

              {isListOpen && (
                <div className="clip-dropdown-scroll">
                  {polygonLayers.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelectedLayerId(l.id);
                        setIsListOpen(false);
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

          {/* Min areal input */}
          <div>
            <label className="choose-layer-text">Minimum areal (m²)</label>
            <input
              type="number"
              min={1}
              step={1}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              className="input-number"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </Popup>
  );
}
