import { useRef, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { useLayers } from "../../context/LayersContext";
import { toWGS84, to25832 } from "../../utils/reproject";
import Popup from "../popup/Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Clean name to save in sidebar
function cleanName(fileName: string) {
  const base = fileName.split(/[\\/]/).pop() || fileName;
  return base.replace(/\.(geo)?json$/i, "");
}

function isEPSG25832(fc: FeatureCollection<Geometry>): boolean {
  const crsName = (fc as any).crs?.properties?.name as string | undefined;
  if (!crsName) return false;
  return crsName.includes("25832");
}

function isCRS84orWGS(fc: FeatureCollection<Geometry>): boolean {
  const crsName = (fc as any).crs?.properties?.name as string | undefined;
  if (crsName && (crsName.includes("4326") || crsName.includes("CRS84"))) {
    return true;
  }

  // Fallback: se på tallene hvis det ikke finnes crs-felt i geojson filen
  const first = fc.features.find((f) => f.geometry && "coordinates" in f.geometry);
  if (!first || !first.geometry) return false;

  const g: any = first.geometry;
  let x: number | undefined;
  let y: number | undefined;

  if (g.type === "Point") {
    [x, y] = g.coordinates;
  } else if (g.type === "LineString" || g.type === "MultiPoint") {
    [x, y] = g.coordinates[0] || [];
  } else if (g.type === "Polygon" || g.type === "MultiLineString") {
    [x, y] = g.coordinates[0]?.[0] || [];
  } else if (g.type === "MultiPolygon") {
    [x, y] = g.coordinates[0]?.[0]?.[0] || [];
  }

  if (typeof x !== "number" || typeof y !== "number") return false;

  // Typiske lon/lat grenser
  return Math.abs(x) <= 180 && Math.abs(y) <= 90;
}

export default function Upload({ isOpen, onClose }: Props) {
  const { addLayer } = useLayers();
  const [busy, setBusy] = useState(false); // used for spinner
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

        let geojson4326: FeatureCollection<Geometry>;
        let geojson25832: FeatureCollection<Geometry>;
        let sourceCrs: string;

        if (isEPSG25832(parsed)) {
          // hvis i EPSG:25832, reprojiser til WGS84
          geojson25832 = parsed;
          geojson4326 = toWGS84(parsed);
          sourceCrs = "EPSG:25832";
        } else if (isCRS84orWGS(parsed)) {
          // hvis i CRS84/WGS84, bruk som 4326
          geojson4326 = parsed;
          geojson25832 = to25832(parsed);
          sourceCrs = "EPSG:4326";
        } else {
          // Hvis vi ikke kan tolke fra filen, anta EPSG:25832
          geojson25832 = parsed;
          geojson4326 = toWGS84(parsed);
          sourceCrs = "EPSG:25832";
        }

        addLayer({
          name: cleanName(file.name),
          sourceCrs,
          geojson25832,
          geojson4326,
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
    <Popup isOpen={isOpen} onClose={onClose} title="Last opp data" width="narrow">
      {!busy ? (
        <div style={{ display: "grid", gap: 14 }}>
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
            className="upload-container"
          >
            <div className="upload-text">Dra og slipp GeoJSON-filer her</div>
            <div className="upload-text-second">eller trykk for å velge fra filer</div>
          </div>

          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <div className="busy-container">
          <div className="spinner" />
          <div className="busy-text">Laster opp filer…</div>
        </div>
      )}
    </Popup>
  );
}
