import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import { useMemo, useRef, useEffect, useState } from "react";
import L from "leaflet";
import { useLayers } from "../stores/layers";
import { toWgs84 } from "../utils/reprojectGeoJSON";

export default function Map() {
  const layers = useLayers((s) => s.layers);
  const mapRef = useRef<L.Map | null>(null);
  const [hasZoomed, setHasZoomed] = useState(false);

  // Reprojiser synlige lag til WGS84 kun når de endrer seg
  const visibleLayers = useMemo(
    () =>
      layers
        .filter((l) => l.visible)
        .map((l) => ({
          id: l.id,
          name: l.name,
          color: l.color,
          dataWgs: toSafeWgs(l.data),
        })),
    [layers]
  );

  // Zoom til første “boundary” hvis finnes, ellers til samlede lag
  useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  if (hasZoomed || visibleLayers.length === 0) return;

  if (visibleLayers.length === 0) return;

  const group = L.featureGroup(
    visibleLayers.map((v) => L.geoJSON(v.dataWgs as any))
  );
  const b = group.getBounds();
  if (b.isValid()) {
      map.fitBounds(b.pad(0.05));
      setHasZoomed(true);
    }
}, [visibleLayers]);


  return (
    <MapContainer
  center={[63.43, 10.4]} // Trondheim
  zoom={11}
  style={{ height: "100%", width: "100%" }}
  ref={mapRef}
>
  <TileLayer
    attribution='&copy; OpenStreetMap'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

  {visibleLayers.map((v) => (
    <GeoJSON
      key={v.id}
      data={v.dataWgs as FeatureCollection}
      style={() => styleFor(v.color)}
      pointToLayer={(_, latlng) =>
        L.circleMarker(latlng, pointStyleFor(v.color))
      }
    />
  ))}
</MapContainer>

  );
}

function toSafeWgs(fc: FeatureCollection): FeatureCollection {
  const maybeCrs = (fc as any).crs?.properties?.name || (fc as any).crs?.name;
  const isWgs =
    typeof maybeCrs === "string" &&
    (maybeCrs.includes("4326") || maybeCrs.toUpperCase().includes("WGS84"));

  return isWgs ? fc : (toWgs84(fc, "EPSG:25832") as FeatureCollection);
}


function styleFor(color: string): L.PathOptions {
  return {
    color,
    weight: 2,
    opacity: 0.9,
    fillColor: color,
    fillOpacity: 0.25,
  };
}

function pointStyleFor(color: string): L.CircleMarkerOptions {
  return {
    radius: 500,
    color,
    weight: 1.5,
    fillColor: color,
    fillOpacity: 0.7,
  };
}
