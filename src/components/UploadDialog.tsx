import { useRef, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { useLayers } from "../context/LayersContext";
import { toWGS84 } from "../utils/reproject";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Clean name to save in sidebar
function cleanName(fileName: string) {
  const base = fileName.split(/[\\/]/).pop() || fileName;
  return base.replace(/\.(geo)?json$/i, "");
}

export default function UploadDialog({ isOpen, onClose }: Props) {
  const { addLayer } = useLayers();
  const [busy, setBusy] = useState(false); // used for spinner
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const text = await file.text();
        const parsed = JSON.parse(text) as FeatureCollection<Geometry>;
        if (parsed.type !== "FeatureCollection") {
          throw new Error(`${file.name}: Filen må være en GeoJSON FeatureCollection.`);
        }

        const fc4326 = toWGS84(parsed);
        addLayer({
          name: cleanName(file.name),
          sourceCrs: "EPSG:25832", // Assume layers are on correct format, since data should come from GitHub in this case
          geojson25832: parsed,
          geojson4326: fc4326,
        });
      }
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Kunne ikke lese GeoJSON.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // handling drag and drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal>
      <div className="modal modal--narrow">
        <header className="modal-header">
          <h3 className="modal-title">Last opp</h3>
          <button className="modal-close" onClick={onClose} aria-label="Lukk">
            ×
          </button>
        </header>

        <div className="modal-body">
          {!busy ? (
            <div style={{ display: "grid", gap: 14 }}>
              <p style={{ margin: 0, textAlign: "center" }}>
                Last opp data i <b>GeoJSON</b>-format.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,application/geo+json,application/json"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                style={{ display: "none" }}
              />

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--border)",
                  borderRadius: 12,
                  background: "#f8f6f1",
                  padding: 26,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "background .15s ease",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Dra og slipp filer her</div>
                <div style={{ fontSize: 13, color: "var(--ink-200)", marginBottom: 8 }}>
                  eller klikk for å velge
                </div>
              </div>

              {error && (
                <p style={{ margin: 0, color: "#b91c1c", fontSize: 13, textAlign: "center" }}>
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="upload-busy" style={{ textAlign: "center" }}>
              <div className="spinner" style={{ width: 48, height: 48, marginBottom: 10 }}></div>
              <div style={{ fontWeight: 600 }}>Laster opp filer</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
