import { create } from "zustand";
import { nanoid } from "nanoid";
import type { FeatureCollection } from "geojson";
import { randomPastel } from "../utils/commonFunctions";

// Holder styr på lag i kartet

// Argumenter for hvert lag
export type Layer = {
  id: string;
  name: string;
  data: FeatureCollection;
  color: string;
  visible: boolean;
};

// hva som kan gjøres med lagene
type LayerState = {
  layers: Layer[];
  addLayers: (items: { name: string; data: FeatureCollection }[]) => void;
  toggleVisible: (id: string) => void;
  setColor: (id: string, color: string) => void;
  removeLayer: (id: string) => void;
  clear: () => void;
};

export const useLayers = create<LayerState>((set) => ({
  layers: [], // ingen lag til å begynne med
  // legge til lag
  addLayers: (items) =>
    set((state) => ({
      layers: [
        ...state.layers,
        ...items.map((it) => ({
          id: nanoid(),
          name: it.name,
          data: it.data,
          color: randomPastel(), // startfarge
          visible: true,
        })),
      ],
    })),
  // gjøre synlig usynlig
  toggleVisible: (id) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    })),
  // skifte farge
  setColor: (id, color) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, color } : l)),
    })),
  // fjerne lag
  removeLayer: (id) => set((state) => ({ layers: state.layers.filter((l) => l.id !== id) })),
  clear: () => set({ layers: [] }),
}));
