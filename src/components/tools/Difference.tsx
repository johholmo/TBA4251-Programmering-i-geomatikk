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
      type: "difference";
      result: {
        fc4326: FeatureCollection<Geometry>;
        fc25832: FeatureCollection<Geometry>;
      };
    }
  | {
      id: string;
      ok: false;
      type: "difference";
      error: string;
    };

// Finner forskjellen mellom to polygonlag
export default function Difference({ isOpen, onClose }: Props) {
  const { layers, addLayer } = useLayers();
  const [layerAId, setLayerAId] = useState<string>("");
  const [layerBId, setLayerBId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListAOpen, setIsListAOpen] = useState(false);
  const [isListBOpen, setIsListBOpen] = useState(false);
  const listARef = useRef<HTMLDivElement | null>(null);
  const listBRef = useRef<HTMLDivElement | null>(null);

  // Worker-ref (deles mellom kjøringer)
  const currentJobIdRef = useRef<string | null>(null);

  // Polygon-lag
  const polygonLayers = layers.filter((l) =>
    l.geojson4326.features.some((f) => isPoly(f.geometry))
  );
  const hasLayers = polygonLayers.length >= 2;

  // Init / clean up worker
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new GeoWorker();
    }
    const worker = workerRef.current;

    const handleMessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      // Vi forventer bare difference-jobber her
      if (msg.type !== "difference") return;
      if (!currentJobIdRef.current || msg.id !== currentJobIdRef.current) return;

      if (!msg.ok) {
        setError(msg.error || "Klarte ikke å utføre difference (worker-feil).");
        setBusy(false);
        currentJobIdRef.current = null;
        return;
      }

      // Suksess: legg til nytt lag
      try {
        const { fc4326, fc25832 } = msg.result;

        const layerA = polygonLayers.find((l) => l.id === layerAId);
        const layerB = polygonLayers.find((l) => l.id === layerBId);

        const nameA = layerA?.name || "LagA";
        const nameB = layerB?.name || "LagB";
        const newName = `${nameA} - ${nameB}`;
        const color = layerA?.color ?? "#ff0000";

        addLayer({
          name: newName,
          sourceCrs: "EPSG:25832",
          geojson25832: fc25832,
          geojson4326: fc4326,
          color,
          visible: true,
        });

        setBusy(false);
        currentJobIdRef.current = null;
        onClose();
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Klarte ikke å legge til difference-resultat.");
        setBusy(false);
        currentJobIdRef.current = null;
      }
    };

    worker.addEventListener("message", handleMessage);
    return () => {
      worker.removeEventListener("message", handleMessage);
      // Ikke terminate her hvis du vil gjenbruke mellom mounts;
      // men for sikkerhet kan du:
      // worker.terminate();
      // workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygonLayers, layerAId, layerBId, addLayer, onClose]);

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
      currentJobIdRef.current = null;
    }
  }, [isOpen]);

  // Håndterer difference (nå via worker)
  function handleDifference() {
    if (!layerAId || !layerBId || layerAId === layerBId || busy) {
      if (!busy && layerAId && layerBId && layerAId === layerBId) {
        setError("Velg to ulike polygon-lag for A og B.");
      }
      return;
    }

    const worker = workerRef.current;
    if (!worker) {
      setError("Worker ikke initialisert.");
      return;
    }

    const layerA = polygonLayers.find((l) => l.id === layerAId);
    const layerB = polygonLayers.find((l) => l.id === layerBId);
    if (!layerA || !layerB) {
      setError("Fant ikke begge lagene for difference.");
      return;
    }

    setBusy(true);
    setError(null);

    const jobId = crypto.randomUUID();
    currentJobIdRef.current = jobId;

    const job = {
      id: jobId,
      type: "difference" as const,
      layerA: layerA.geojson4326 as FeatureCollection<Geometry>,
      layerB: layerB.geojson4326 as FeatureCollection<Geometry>,
    };

    worker.postMessage(job);
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
          <div className="busy-text">Utfører difference… </div>
        </div>
      ) : !hasLayers ? (
        <div className="warning-message">
          Du må ha minst to lag med polygon-geometrier for å bruke difference.
        </div>
      ) : (
        <div className="choose-layer-container">
          <div className="field-group">
            {/* Velg lag A (beholde)*/}
            <div className="choose-layer-text">Velg laget du vil beholde</div>
            <div className="dropdown" ref={listARef}>
              <button
                type="button"
                className="dropdown-toggle"
                style={{ borderRadius: isListAOpen ? "8px 8px 0 0" : "8px" }}
                onClick={() => setIsListAOpen((x) => !x)}
              >
                <span className="dropdown-text">
                  {layerAId
                    ? (polygonLayers.find((l) => l.id === layerAId)?.name ?? "Velg lag")
                    : "Velg lag"}
                </span>
                <span aria-hidden className="dropdown-hidden">
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
            <div className="choose-layer-text">Velg laget du vil trekke fra</div>
            <div className="dropdown" ref={listBRef}>
              <button
                type="button"
                className="dropdown-toggle"
                style={{ borderRadius: isListBOpen ? "8px 8px 0 0" : "8px" }}
                onClick={() => setIsListBOpen((x) => !x)}
              >
                <span className="dropdown-text">
                  {layerBId
                    ? (polygonLayers.find((l) => l.id === layerBId)?.name ?? "Velg lag…")
                    : "Velg lag…"}
                </span>
                <span aria-hidden className="dropdown-hidden">
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
