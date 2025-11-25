import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { randomColor } from "../utils/commonFunctions";

// Håndterer kartlag ved react

// et kartlag
export type LayerRecord = {
  id: string;
  name: string;
  sourceCrs: string;
  geojson25832: FeatureCollection<Geometry>;
  geojson4326: FeatureCollection<Geometry>;
  visible: boolean;
  color: string;
};

// typen for hele api-et vi lager
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

const LayersContext = createContext<LayersContextType | null>(null);

export function useLayers() {
  const ctx = useContext(LayersContext);
  if (!ctx) throw new Error("useLayers must be used within LayersProvider");
  return ctx;
}

// AI was used to suggest a structure for managing layers in a React context, including functions for adding, removing, and updating layers.
export function LayersProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<LayerRecord[]>([]);

  // bygger API-et
  const api = useMemo<LayersContextType>(
    () => ({
      layers,
      //legg til lag
      addLayer: (layer) => {
        const id = crypto.randomUUID();
        const color = layer.color ?? randomColor();
        const visible = layer.visible ?? true;
        setLayers((prev) => [...prev, { id, ...layer, color, visible } as LayerRecord]);
        return id;
      },
      // fjern lag
      removeLayer: (id) => setLayers((prev) => prev.filter((l) => l.id !== id)),
      // gjør synlig/usynlig
      setVisibility: (id, visible) =>
        setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible } : l))),
      // endre farge
      setColor: (id, color) =>
        setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, color } : l))),
      // endre navn
      setName: (id, name) =>
        setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l))),
      // endre rekkefølge på lagene
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
