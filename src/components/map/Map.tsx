import { useEffect, useRef, useState } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useLayers } from "../../context/LayersContext";
import Naming from "../popup/NamingPopup";
import { randomColor } from "../../utils/commonFunctions";
import type { FeatureCollection, Geometry } from "geojson";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Hovedkomponent for kartet
export default function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { layers, addLayer } = useLayers();
  const [isNamingOpen, setIsNamingOpen] = useState(false);
  const [pendingName, setPendingNaming] = useState<FeatureCollection<Geometry> | null>(null);
  const [drawInstance, setDrawInstance] = useState<MapboxDraw | null>(null);

  // Initialiser mapbox kartet
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [10.3951, 63.4305],
      zoom: 12,
    });
    mapRef.current = map;
    // Eksponer mapbox-gl map på window for zoom til lag
    if (typeof window !== "undefined") {
      (window as any).mapboxglMap = map;
    }

    // Legg til kontroll-knapper i kartet (zoom og draw)
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-left");
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true },
      defaultMode: "simple_select",
      // Styling for tegneverktøyet (AI)
      styles: [
        // Linjen som tegner
        {
          id: "gl-draw-line-active",
          type: "line",
          filter: ["all", ["==", "$type", "LineString"], ["==", "active", "true"]],
          paint: {
            "line-color": "#4a90e2",
            "line-width": 3,
          },
        },
        // Polygonet som dannes av linjene
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
          paint: {
            "line-color": "#4a90e2",
            "line-width": 3,
          },
        },
        // Fyllet i polygonet som dannes av linjene
        {
          id: "gl-draw-polygon-fill-active",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
          paint: {
            "fill-color": "#fff",
            "fill-opacity": 0.15,
          },
        },
        // Vertexene som kan dras på polygonet
        {
          id: "gl-draw-polygon-vertex-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "active", "true"]],
          paint: {
            "circle-radius": 7,
            "circle-color": "#ffffff",
            "circle-stroke-color": "#4a90e2",
            "circle-stroke-width": 3,
          },
        },
        // Nodene når de er inaktive
        {
          id: "gl-draw-polygon-vertex-inactive",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["!=", "active", "true"]],
          paint: {
            "circle-radius": 7,
            "circle-color": "#ffffff",
            "circle-stroke-color": "#4a90e2",
            "circle-stroke-width": 3,
          },
        },
        // Polygonet når inaktiv
        {
          id: "gl-draw-polygon-stroke-inactive",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "false"]],
          paint: {
            "line-color": "#000",
            "line-width": 2,
          },
        },
        // Fyllet i polygonet når inaktiv
        {
          id: "gl-draw-polygon-fill-inactive",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "false"]],
          paint: {
            "fill-color": "#fff",
            "fill-opacity": 0.1,
          },
        },
        // Linje når inaktiv
        {
          id: "gl-draw-line-inactive",
          type: "line",
          filter: ["all", ["==", "$type", "LineString"], ["==", "active", "false"]],
          paint: {
            "line-color": "#000",
            "line-width": 2,
          },
        },
      ],
    });
    map.addControl(draw, "top-left");
    setDrawInstance(draw);
    const onDrawCreate = () => {
      const features = draw.getAll();
      if (features && features.features && features.features.length > 0) {
        setPendingNaming(features as FeatureCollection<Geometry>);
        setIsNamingOpen(true);
      }
    };
    map.on("draw.create", onDrawCreate);
    map.on("draw.update", onDrawCreate);

    return () => {
      map.off("draw.create", onDrawCreate);
      map.off("draw.update", onDrawCreate);
      map.remove();
      mapRef.current = null;
      if (typeof window !== "undefined" && (window as any).mapboxglMap === map) {
        (window as any).mapboxglMap = undefined;
      }
    };
  }, []);

  // Håndter lagring av navn
  const handleNaming = (name: string) => {
    if (!pendingName) return;
    // Legg til nytt lag i laglisten
    addLayer({
      name,
      geojson4326: pendingName,
      color: randomColor(),
      visible: true,
    });
    if (drawInstance) drawInstance.deleteAll();
    setPendingNaming(null);
    setIsNamingOpen(false); // Lukk navngivings-popup
  };

  // Synkroniser lag i sidebaren med Mapbox-kartet
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Funksjon for å synkronisere lag
    function syncLayers() {
      const m = map!;
      const existingSources = Object.keys(m.getStyle().sources); // Eksisterende lag i kartet
      // Fjern alle eksisterende lag og kilder
      for (const src of existingSources) {
        if (src.startsWith("layer-")) {
          if (m.getLayer(src + "-fill")) m.removeLayer(src + "-fill");
          if (m.getLayer(src + "-line")) m.removeLayer(src + "-line");
          if (m.getLayer(src + "-circle")) m.removeLayer(src + "-circle");
          m.removeSource(src);
        }
      }
      // Legg til alle lag fra laglisten
      for (const l of layers) {
        if (!l.visible) continue;
        const srcId = `layer-${l.id}`;
        m.addSource(srcId, {
          type: "geojson",
          data: l.geojson4326,
        });
        // Polygoner
        if (
          l.geojson4326.features.some(
            (f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
          )
        ) {
          // Legg til fylte polygoner
          m.addLayer({
            id: srcId + "-fill",
            type: "fill",
            source: srcId,
            paint: {
              "fill-color": l.color,
              "fill-opacity": 0.4,
            },
          });
          // Legg til polygonkanter
          m.addLayer({
            id: srcId + "-line",
            type: "line",
            source: srcId,
            paint: {
              "line-color": l.color,
              "line-width": 2,
            },
          });
        }
        // Linjer
        if (
          l.geojson4326.features.some(
            (f) => f.geometry.type === "LineString" || f.geometry.type === "MultiLineString"
          )
        ) {
          // Legg til
          m.addLayer({
            id: srcId + "-line",
            type: "line",
            source: srcId,
            paint: {
              "line-color": l.color,
              "line-width": 2,
            },
          });
        }
        // Punkter
        if (
          l.geojson4326.features.some(
            (f) => f.geometry.type === "Point" || f.geometry.type === "MultiPoint"
          )
        ) {
          // Legg til
          m.addLayer({
            id: srcId + "-circle",
            type: "circle",
            source: srcId,
            paint: {
              "circle-color": l.color,
              "circle-radius": 6,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#222",
            },
          });
        }
      }
    }
    // Når kartet er lastet, så synkroniseres lag
    if (map.isStyleLoaded()) {
      syncLayers();
    } else {
      map.once("load", syncLayers);
    }

    return () => {
      map.off("load", syncLayers);
    };
  }, [layers]);

  return (
    <>
      <div ref={mapContainer} id="map" style={{ width: "100%", height: "100%" }} />
      <Naming
        isOpen={isNamingOpen}
        onClose={() => {
          setIsNamingOpen(false);
          setPendingNaming(null);
        }}
        onConfirm={handleNaming}
        title="Navngi lag"
        label="Skriv inn navn på polygonet du tegnet:"
      />
    </>
  );
}
