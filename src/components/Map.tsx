import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLayers } from "../context/LayersContext";
import MapDraw from "./MapDraw";

type LayerEntry = {
  gj: L.GeoJSON;
  id: string;
  color: string;
  visible: boolean;
};

export default function Map() {
  const mapRef = useRef<L.Map | null>(null); // leaflet map så vi ikke lager på nytt hver gang
  const groupRef = useRef<L.LayerGroup | null>(null);

  // kobler sammen react lag og leaflet lag
  const cacheRef = useRef<globalThis.Map<string, LayerEntry>>(
    new globalThis.Map<string, LayerEntry>()
  );

  const { layers } = useLayers();

  useEffect(() => {
    // gjør ingenting om kartet allerede er laget
    if (mapRef.current) return;

    const map = L.map("map", {
      center: [63.4305, 10.3951],
      zoom: 12,
      preferCanvas: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Datagruppe så vi slipper å røre bakrgunnskartet og ting går fortere
    const dataGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    groupRef.current = dataGroup;

    return () => {
      cacheRef.current.forEach((e) => e.gj.remove());
      cacheRef.current.clear();
      dataGroup.clearLayers();
      map.remove();
      mapRef.current = null;
      groupRef.current = null;
      (window as any).__leaflet_map = null;
      (window as any).__leaflet_datagroup = null;
    };
  }, []);

  // Hver gang react lagene endrer seg, så synkes leaflet lagene
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const cache = cacheRef.current;

    // Fjern slettede lag fra kartet
    const idsNow = new Set(layers.map((l) => l.id));
    for (const [id, entry] of cache.entries()) {
      if (!idsNow.has(id)) {
        entry.gj.remove();
        cache.delete(id);
      }
    }

    // Legg til lag og oppdater eksisterende (farge og synlighet)
    for (const l of layers) {
      const existing = cache.get(l.id);

      if (!existing) {
        const gj = L.geoJSON(l.geojson4326 as any, {
          style: { color: l.color, weight: 1 },
          pointToLayer: (_f, latlng) => L.circleMarker(latlng, { radius: 4, color: l.color }),
        });

        if (l.visible) gj.addTo(group);
        cache.set(l.id, { gj, id: l.id, color: l.color, visible: !!l.visible });
      } else {
        if (existing.visible !== l.visible) {
          if (l.visible) existing.gj.addTo(group);
          else existing.gj.remove();
          existing.visible = l.visible;
        }

        if (existing.color !== l.color) {
          existing.gj.eachLayer((sub: any) => {
            if (sub.setStyle) sub.setStyle({ color: l.color });
            else if (sub instanceof L.CircleMarker) sub.setStyle({ color: l.color });
          });
          existing.color = l.color;
        }
      }
    }

    // Rekkefølge (øverst i sidebar = øverst i kart)
    for (const l of layers) {
      const entry = cache.get(l.id);
      if (entry && entry.visible) entry.gj.bringToFront();
    }
  }, [layers]);

  return (
    <>
      <div id="map" style={{ width: "100%", height: "100%" }} />
      <MapDraw />
    </>
  );
}
