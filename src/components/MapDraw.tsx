import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet-draw";
import { useLayers } from "../context/LayersContext";
import { to25832 } from "../utils/reproject";
import Naming from "./popup/Naming";

declare module "leaflet" {
  interface Map {
    _drawControlAdded?: boolean;
  }
}

export default function MapDraw() {
  const { addLayer } = useLayers();
  const [isNamingOpen, setIsNamingOpen] = useState(false);
  const [newLayer, setNewLayer] = useState<any>(null);

  useEffect(() => {
    const checkMapReady = () => {
      const map = (window as any).__leaflet_map as L.Map | undefined;
      if (!map) {
        setTimeout(checkMapReady, 500); // Retry after 500ms
        return;
      }

      // had some issues, so we make sure leaflet draw is only added once
      if (map._drawControlAdded) return;
      map._drawControlAdded = true;

      // AI: Patch the readableArea function to fix the type reference error
      (L as any).GeometryUtil.readableArea = function (area: number, isMetric: boolean) {
        const units = isMetric ? "m²" : "ft²";
        return `${area.toFixed(2)} ${units}`;
      };

      // adding leaflet drawing control to draw polygon in map
      const drawControl = new (L as any).Control.Draw({
        position: "topleft",
        draw: {
          marker: false,
          circle: false,
          circlemarker: false,
          rectangle: false,
          polyline: false,
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: { color: "#5d866c", weight: 2 },
          },
        },
        edit: false,
      });

      map.addControl(drawControl);

      map.on("draw:created", (e: any) => {
        const layer = e.layer;

        setNewLayer(layer);
        setIsNamingOpen(true);
      });
    };

    checkMapReady();
  }, [addLayer]);

  const handleNameConfirm = (layerName: string) => {
    if (newLayer) {
      const geojson = newLayer.toGeoJSON();
      addLayer({
        name: layerName,
        sourceCrs: "EPSG:4326",
        geojson25832: to25832({
          type: "FeatureCollection",
          features: [geojson],
        }),
        geojson4326: {
          type: "FeatureCollection",
          features: [geojson],
        },
      });
      setNewLayer(null);
    }
    setIsNamingOpen(false);
  };

  return (
    <Naming
      isOpen={isNamingOpen}
      onClose={() => setIsNamingOpen(false)}
      onConfirm={handleNameConfirm}
    />
  );
}
