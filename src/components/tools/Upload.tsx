import { useRef, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { useLayers } from "../../context/LayersContext";
import { toWGS84 } from "../../utils/geomaticFunctions";
import Popup from "../popup/Popup";
import { isEPSG25832 } from "../../utils/geomaticFunctions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Funksjon for å rydde filnavnet til å lagre i sidebaren uten .geojson
function cleanName(fileName: string) {
  const base = fileName.split(/[\\/]/).pop() || fileName;
  return base.replace(/\.(geo)?json$/i, "");
}

// Funksjon for å sjekke om geojson er i CRS84 eller WGS84
function isCRS84orWGS(fc: FeatureCollection<Geometry>): boolean {
  const crsName = (fc as any).crs?.properties?.name as string | undefined;
  if (crsName && (crsName.includes("4326") || crsName.includes("CRS84"))) {
    return true;
  }

  // Se på tallene hvis det ikke finnes crs-felt i geojson filen
  const first = fc.features.find((f) => f.geometry && "coordinates" in f.geometry);
  if (!first || !first.geometry) return false;

  const g: any = first.geometry;
  let x: number | undefined;
  let y: number | undefined;

  // Sjekk geometri type for å hente ut koordinater
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Håndtere opplasting av filer
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setBusy(true); // Sett busy for å få opp spinner når filer lastes opp
    setError(null);

    try {
      // Leser og prosesserer hver fil
      for (const file of Array.from(files)) {
        const text = await file.text();
        const parsed = JSON.parse(text) as FeatureCollection<Geometry>;
        // Sjekk at filen er en FeatureCollection
        if (parsed.type !== "FeatureCollection") {
          throw new Error(`${file.name}: Filen må være en GeoJSON FeatureCollection.`);
        }

        let geojson4326: FeatureCollection<Geometry>;
        if (isEPSG25832(parsed)) {
          // Konverter fra EPSG:25832 til EPSG:4326
          geojson4326 = toWGS84(parsed);
        } else if (isCRS84orWGS(parsed)) {
          // Filen er allerede i EPSG:4326 eller CRS84
          geojson4326 = parsed;
        } else {
          // Anta at filen er i en annen projeksjon og konverter til EPSG:4326
          geojson4326 = toWGS84(parsed);
        }
        // Legg til laget i sidebar
        addLayer({
          name: cleanName(file.name),
          geojson4326,
        });
      }
      onClose(); // Lukk popupen etter opplasting
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Kunne ikke lese GeoJSON.");
    } finally {
      setBusy(false); // Fjern busy status etter opplasting
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Håndtere drag and drop for opplastning
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
