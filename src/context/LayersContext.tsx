import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { randomColor } from "../utils/commonFunctions";

// Håndterer kartlag ved react

// Et kartlag
export type LayerRecord = {
  id: string;
  name: string;
  geojson4326: FeatureCollection<Geometry>;
  visible: boolean;
  color: string;
  sourceCrs?: string;
  geojson25832?: FeatureCollection<Geometry>;
};

// Lag typen for hele apiet som lages
type LayersContextType = {
  layers: LayerRecord[];
  addLayer: (
    layer: Omit<LayerRecord, "id" | "color" | "visible"> &
      Partial<Pick<LayerRecord, "color" | "visible">>
  ) => string;
  removeLayer: (id: string) => void;
  setVisibility: (id: string, visible: boolean) => void;
  setColor: (id: string, color: string) => void;
  setName: (id: string, name: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  clearAll: () => void;
};

// Lager contexten
const LayersContext = createContext<LayersContextType | null>(null);

// Funksjon for å bruke contexten
export function useLayers() {
  const ctx = useContext(LayersContext);
  if (!ctx) throw new Error("useLayers must be used within LayersProvider");
  return ctx;
}

// AI ble brukt til å foreslå en struktur for å håndtere lag i en React-kontekst, inkludert funksjoner for å legge til, fjerne og oppdatere lag.
export function LayersProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<LayerRecord[]>([]);

  // Bygge apiet
  const api = useMemo<LayersContextType>(
    () => ({
      layers,
      // Legg til lag
      addLayer: (layer) => {
        const id = crypto.randomUUID();
        const color = layer.color ?? randomColor();
        const visible = layer.visible ?? true;
        // Krever kun geojson4326
        setLayers((prev) => [
          ...prev,
          {
            id,
            name: layer.name,
            geojson4326: layer.geojson4326,
            color,
            visible,
            ...(layer.sourceCrs ? { sourceCrs: layer.sourceCrs } : {}),
            ...(layer.geojson25832 ? { geojson25832: layer.geojson25832 } : {}),
          } as LayerRecord,
        ]);
        return id;
      },
      // Fjern lag
      removeLayer: (id) => setLayers((prev) => prev.filter((l) => l.id !== id)),
      // Gjør synlig/usynlig
      setVisibility: (id, visible) =>
        setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible } : l))),
      // Endre farge
      setColor: (id, color) =>
        setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, color } : l))),
      // Endre navn
      setName: (id, name) =>
        setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l))),
      // Endre rekkefølge på lagene
      reorderLayers: (fromIndex, toIndex) =>
        setLayers((prev) => {
          const next = prev.slice();
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return next;
        }),
      clearAll: () => setLayers([]),
    }),
    [layers]
  );

  return <LayersContext.Provider value={api}>{children}</LayersContext.Provider>;
}
