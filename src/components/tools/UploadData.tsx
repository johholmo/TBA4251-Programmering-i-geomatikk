import { useCallback, useState } from "react";
import Popup from "../popup/Popup";
import type { FeatureCollection } from "geojson";
import { useLayers } from "../../stores/layers";
import { toWgs84 } from "../../utils/reprojectGeoJSON";

export default function UploadData({
  isOpen,
  onClose,
  onUploaded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const addLayers = useLayers((s) => s.addLayers);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setBusy(true);
      const newErrors: string[] = [];
      const layers: { name: string; data: FeatureCollection }[] = [];

      for (const file of Array.from(files)) {
        const name = file.name.replace(/\.(geo)?json$/i, "");
        const ext = file.name.toLowerCase().split(".").pop() || "";
        if (!["json", "geojson"].includes(ext)) {
          newErrors.push(`Ikke-støttet filtype: ${file.name} (bruk .geojson/.json)`);
          continue;
        }
        try {
          const text = await file.text();
          const json = JSON.parse(text);

          if (json?.type === "FeatureCollection") {
            // 👇 Legg inn loggene her:
            console.log("Before reprojection:", json.features[0]?.geometry?.coordinates);

            // Importér toWgs84 øverst:
            // import { toWgs84 } from "../../utils/reprojectGeoJSON";
            const repro = toWgs84(json, "EPSG:25832");
            console.log("After reprojection:", repro.features[0]?.geometry?.coordinates);

            // legg til laget som vanlig
            layers.push({ name, data: json as FeatureCollection });
          } else {
            newErrors.push(`Ikke FeatureCollection: ${file.name}`);
          }
        } catch (e) {
          newErrors.push(`Feil ved lesing: ${file.name} – ${(e as Error).message}`);
        }
      }

      if (layers.length > 0) {
        addLayers(layers);
        onClose();
        onUploaded?.();
      }
      setErrors(newErrors);
      setBusy(false);
    },
    [addLayers, onClose]
  );

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Last opp data (GeoJSON)"
      highlightColor="var(--brand)"
      actions={[{ label: "Lukk", variant: "secondary", onClick: onClose }]}
    >
      <div
        className="upload-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <p>
          <b>Dra & slipp</b> GeoJSON-filer her
        </p>
        <p style={{ color: "var(--ink-200)" }}>eller</p>
        <label className="btn btn-secondary" role="button">
          Velg filer
          <input
            type="file"
            accept=".geojson,.json,application/geo+json,application/json"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {busy && <p>Laster filer…</p>}
      {errors.length > 0 && (
        <div className="hint-box" style={{ marginTop: 12 }}>
          <b>Noen filer ble hoppet over:</b>
          <ul>
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </Popup>
  );
}
