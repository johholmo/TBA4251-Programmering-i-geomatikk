import type { FeatureCollection, Geometry } from "geojson";
import GeoWorker from "./geoworkers?worker";

type GeoJobType = "difference" | "intersect" | "buffer" | "areaFilter" | "union";

type BaseJob = {
  id: string;
  type: GeoJobType;
};

type DifferenceJob = BaseJob & {
  type: "difference";
  layerA: FeatureCollection<Geometry>;
  layerB: FeatureCollection<Geometry>;
};

type IntersectJob = BaseJob & {
  type: "intersect";
  layerA: FeatureCollection<Geometry>;
  layerB: FeatureCollection<Geometry>;
};

type BufferJob = BaseJob & {
  type: "buffer";
  layer: FeatureCollection<Geometry>;
  distance: number;
};

type AreaFilterJob = BaseJob & {
  type: "areaFilter";
  layer: FeatureCollection<Geometry>;
  minArea: number;
};

type UnionJob = BaseJob & {
  type: "union";
  layers: FeatureCollection<Geometry>[];
};

type GeoJob = DifferenceJob | IntersectJob | BufferJob | AreaFilterJob | UnionJob;

// Matcher NY geoworkers.ts
type GeoSuccess = {
  id: string;
  ok: true;
  type: GeoJobType;
  result: {
    fc4326: FeatureCollection<Geometry>;
  };
};

type GeoError = {
  id: string;
  ok: false;
  type: GeoJobType;
  error: string;
};

type GeoResponse = GeoSuccess | GeoError;

// Det vi eksponerer til verktøyene
export type GeoResult = {
  fc4326: FeatureCollection<Geometry>;
};

let worker: Worker | null = null;
const pending = new Map<
  string,
  {
    resolve: (res: GeoResult) => void;
    reject: (err: Error) => void;
  }
>();

function ensureWorker(): Worker {
  if (worker) return worker;

  worker = new GeoWorker();

  worker.onmessage = (event: MessageEvent<GeoResponse>) => {
    const msg = event.data;
    const entry = pending.get(msg.id);
    if (!entry) return;

    pending.delete(msg.id);

    if (!msg.ok) {
      entry.reject(new Error(msg.error || "GeoWorker error"));
    } else {
      entry.resolve({ fc4326: msg.result.fc4326 });
    }
  };

  worker.onerror = (event: ErrorEvent) => {
    console.error("GeoWorker global error:", event.message);
    for (const [, entry] of pending.entries()) {
      entry.reject(new Error(event.message || "GeoWorker global error"));
    }
    pending.clear();
  };

  return worker;
}

function runJob(job: Omit<GeoJob, "id">): Promise<GeoResult> {
  const w = ensureWorker();
  const id = crypto.randomUUID();
  const fullJob: GeoJob = { ...(job as any), id };

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage(fullJob);
  });
}

// --- Hjelpefunksjoner per verktøy ---

export function runDifference(
  layerA: FeatureCollection<Geometry>,
  layerB: FeatureCollection<Geometry>
): Promise<GeoResult> {
  return runJob({ type: "difference", layerA, layerB } as DifferenceJob);
}

export function runIntersect(
  layerA: FeatureCollection<Geometry>,
  layerB: FeatureCollection<Geometry>
): Promise<GeoResult> {
  return runJob({ type: "intersect", layerA, layerB } as IntersectJob);
}

export function runBuffer(
  layer: FeatureCollection<Geometry>,
  distance: number
): Promise<GeoResult> {
  return runJob({ type: "buffer", layer, distance } as BufferJob);
}

export function runAreaFilter(
  layer: FeatureCollection<Geometry>,
  minArea: number
): Promise<GeoResult> {
  return runJob({ type: "areaFilter", layer, minArea } as AreaFilterJob);
}

export function runUnion(layers: FeatureCollection<Geometry>[]): Promise<GeoResult> {
  return runJob({ type: "union", layers } as UnionJob);
}
