import { create } from "zustand";
import { nanoid } from "nanoid";
import type { FeatureCollection } from "geojson";

export type Layer = {
  id: string;
  name: string;
  data: FeatureCollection;
  color: string;
  visible: boolean;
};

type LayerState = {
  layers: Layer[];
  addLayers: (items: { name: string; data: FeatureCollection }[]) => void;
  toggleVisible: (id: string) => void;
  setColor: (id: string, color: string) => void;
  removeLayer: (id: string) => void;
  clear: () => void;
};

export const useLayers = create<LayerState>((set) => ({
  layers: [],
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
  toggleVisible: (id) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    })),
  setColor: (id, color) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, color } : l)),
    })),
  removeLayer: (id) => set((state) => ({ layers: state.layers.filter((l) => l.id !== id) })),
  clear: () => set({ layers: [] }),
}));

function randomPastel() {
  // fine lyse farger som passer paletten
  const colors = ["#5D866C", "#C2A68C", "#8AA78F", "#B8A089", "#7DA48F"];
  return colors[Math.floor(Math.random() * colors.length)];
}
