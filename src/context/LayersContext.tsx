import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { FeatureCollection, Geometry } from "geojson";

export const LAYER_PALETTE = [
  "#e11d48",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#84cc16",
  "#0f766e",
];

function randomColor() {
  return LAYER_PALETTE[Math.floor(Math.random() * LAYER_PALETTE.length)];
}

export type LayerRecord = {
  id: string;
  name: string;
  sourceCrs: string;
  geojson25832: FeatureCollection<Geometry>;
  geojson4326: FeatureCollection<Geometry>;
  visible: boolean;
  color: string;
};

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

  const api = useMemo<LayersContextType>(
    () => ({
      layers,
      addLayer: (layer) => {
        const id = crypto.randomUUID();
        const color = layer.color ?? randomColor();
        const visible = layer.visible ?? true;
        setLayers((prev) => [...prev, { id, ...layer, color, visible } as LayerRecord]);
        return id;
      },
      removeLayer: (id) => setLayers((prev) => prev.filter((l) => l.id !== id)),
      setVisibility: (id, visible) =>
        setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible } : l))),
      setColor: (id, color) =>
        setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, color } : l))),
      setName: (id, name) =>
        setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l))),
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
