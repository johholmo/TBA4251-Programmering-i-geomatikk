/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />
export {};
// Hjelp fra AI til å skrive geo-worker. Måtte flytte ting ut fra verktøy til worker for at nettsiden ikke skulle krasje.
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";

import bbox from "@turf/bbox";
import booleanIntersects from "@turf/boolean-intersects";
import cleanCoords from "@turf/clean-coords";
import buffer from "@turf/buffer";
import area from "@turf/area";
import flatten from "@turf/flatten";
import dissolve from "@turf/dissolve";

import {
  isPoly,
  turfDifference,
  turfIntersect,
  unionPolygons,
  explodeToPolygons,
} from "../utils/geomaticFunctions";

type Properties = Record<string, any>;

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

// Funksjoner originalt fra tsx filer i tools mappen, men flyttet hit for å gjøre den tunge jobben i worker istedenfor

// hjelpefunksjon for å preprosesser polygonlag for raske operasjoner
function preprocessPolygonLayer(
  layer: FeatureCollection<Geometry>,
  options?: { dissolve?: boolean }
): FeatureCollection<Polygon | MultiPolygon, Properties> {
  const flat = flatten(layer as any) as FeatureCollection<Geometry, Properties>;
  const polys: Feature<Polygon | MultiPolygon, Properties>[] = [];
  for (const f of flat.features) {
    if (!f.geometry) continue;
    if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
      polys.push({
        type: "Feature",
        properties: (f.properties || {}) as Properties,
        geometry: f.geometry as Polygon | MultiPolygon,
      });
    }
  }

  if (!polys.length) {
    return { type: "FeatureCollection", features: [] };
  }

  if (options?.dissolve) {
    try {
      const dissolved = dissolve({
        type: "FeatureCollection",
        features: polys as any,
      }) as FeatureCollection<Polygon | MultiPolygon, Properties>;
      return dissolved;
    } catch {
      return {
        type: "FeatureCollection",
        features: polys,
      };
    }
  }
  return {
    type: "FeatureCollection",
    features: polys,
  };
}

// Difference
function runDifference(
  layerA: FeatureCollection<Geometry>,
  layerB: FeatureCollection<Geometry>
): FeatureCollection<Geometry> {
  const preA = preprocessPolygonLayer(layerA, { dissolve: false });
  const preB = preprocessPolygonLayer(layerB, { dissolve: true });

  const featsA = preA.features;
  const featsB = preB.features;

  if (!featsA.length || !featsB.length) {
    throw new Error("Manglende polygon-geometrier i ett eller begge lag.");
  }

  const outFeatures: Feature<Geometry>[] = [];

  // Forhåndsberegn bbox for B
  const featsBWithBbox = featsB.map((fb) => ({
    feature: fb,
    bbox: bbox(fb.geometry as any),
  }));

  for (const fa of featsA) {
    let currentGeom: Polygon | MultiPolygon | null = fa.geometry || null;
    if (!currentGeom) continue;

    for (const { feature: fb, bbox: bbB } of featsBWithBbox) {
      if (!currentGeom) break;

      const geomB = fb.geometry;
      if (!geomB) continue;

      // bbox-filter
      const bbA = bbox(currentGeom as any);
      const overlapBBox =
        bbA[0] <= bbB[2] && bbA[2] >= bbB[0] && bbA[1] <= bbB[3] && bbA[3] >= bbB[1];
      if (!overlapBBox) continue;

      // kjapp intersects-test
      const intersects = booleanIntersects(
        { type: "Feature", properties: {}, geometry: currentGeom } as any,
        { type: "Feature", properties: {}, geometry: geomB } as any
      );
      if (!intersects) continue;

      try {
        const res = turfDifference(
          {
            type: "Feature",
            properties: {},
            geometry: currentGeom,
          } as Feature<Polygon | MultiPolygon>,
          fb as Feature<Polygon | MultiPolygon>
        );

        if (!res || !res.geometry) {
          currentGeom = null;
          break;
        }

        currentGeom = res.geometry;
      } catch {
        // fallback med cleanCoords som før
        const cleanedA = cleanCoords(currentGeom as any) as Polygon | MultiPolygon;
        const cleanedB = cleanCoords(geomB as any) as Polygon | MultiPolygon;

        const featCleanA: Feature<Polygon | MultiPolygon> = {
          type: "Feature",
          properties: {},
          geometry: cleanedA,
        };
        const featCleanB: Feature<Polygon | MultiPolygon> = {
          type: "Feature",
          properties: {},
          geometry: cleanedB,
        };

        try {
          const res = turfDifference(featCleanA, featCleanB);
          if (!res || !res.geometry) {
            currentGeom = null;
            break;
          }
          currentGeom = res.geometry;
        } catch {
          // Hvis det fortsatt feiler, hopp over denne B og fortsett
          continue;
        }
      }
    }

    if (currentGeom) {
      outFeatures.push({
        type: "Feature",
        properties: { ...(fa.properties || {}) },
        geometry: currentGeom as Geometry,
      });
    }
  }

  return {
    type: "FeatureCollection",
    features: outFeatures,
  };
}

// Intersect
function runIntersect(
  layerA: FeatureCollection<Geometry>,
  layerB: FeatureCollection<Geometry>
): FeatureCollection<Geometry> {
  const featsA: Feature<Polygon | MultiPolygon>[] = [];
  const featsB: Feature<Polygon | MultiPolygon>[] = [];

  for (const f of layerA.features) {
    if (isPoly(f.geometry)) {
      featsA.push({
        type: "Feature",
        properties: { ...(f.properties || {}) },
        geometry: f.geometry as Polygon | MultiPolygon,
      });
    }
  }
  for (const f of layerB.features) {
    if (isPoly(f.geometry)) {
      featsB.push({
        type: "Feature",
        properties: { ...(f.properties || {}) },
        geometry: f.geometry as Polygon | MultiPolygon,
      });
    }
  }

  if (!featsA.length || !featsB.length) {
    throw new Error("Manglende polygon-geometrier i ett eller begge lag.");
  }

  const featsAWithBbox = featsA.map((fa) => ({
    feature: fa,
    bbox: bbox(fa.geometry as any),
  }));
  const featsBWithBbox = featsB.map((fb) => ({
    feature: fb,
    bbox: bbox(fb.geometry as any),
  }));

  const outFeatures: Feature<Geometry>[] = [];
  const seenGeoms = new Set<string>();

  for (const { feature: fa, bbox: bbA } of featsAWithBbox) {
    for (const { feature: fb, bbox: bbB } of featsBWithBbox) {
      const geomA = fa.geometry;
      const geomB = fb.geometry;
      if (!geomA || !geomB) continue;

      const overlap = bbA[0] <= bbB[2] && bbA[2] >= bbB[0] && bbA[1] <= bbB[3] && bbA[3] >= bbB[1];
      if (!overlap) continue;

      const inters = booleanIntersects(
        { type: "Feature", properties: {}, geometry: geomA } as any,
        { type: "Feature", properties: {}, geometry: geomB } as any
      );
      if (!inters) continue;

      let clipped: Feature<Polygon | MultiPolygon> | null = null;

      try {
        clipped = turfIntersect(fa as any, fb as any);
      } catch {
        const cleanedA = cleanCoords(geomA as any) as Polygon | MultiPolygon;
        const cleanedB = cleanCoords(geomB as any) as Polygon | MultiPolygon;

        const featCleanA: Feature<Polygon | MultiPolygon> = {
          type: "Feature",
          properties: fa.properties || {},
          geometry: cleanedA,
        };
        const featCleanB: Feature<Polygon | MultiPolygon> = {
          type: "Feature",
          properties: fb.properties || {},
          geometry: cleanedB,
        };

        try {
          clipped = turfIntersect(featCleanA as any, featCleanB as any);
        } catch {
          clipped = null;
        }
      }

      if (!clipped || !clipped.geometry) continue;

      const geomKey = JSON.stringify(clipped.geometry);
      if (seenGeoms.has(geomKey)) continue;
      seenGeoms.add(geomKey);

      const mergedProps = {
        ...(fa.properties || {}),
        ...(fb.properties || {}),
      };

      outFeatures.push({
        type: "Feature",
        properties: mergedProps,
        geometry: clipped.geometry as Geometry,
      });
    }
  }

  const intersect4326: FeatureCollection<Geometry> = {
    type: "FeatureCollection",
    features: outFeatures,
  };

  return intersect4326;
}

// Buffer
function runBuffer(
  layer: FeatureCollection<Geometry>,
  distance: number
): FeatureCollection<Geometry> {
  if (!layer.features.length) {
    throw new Error("Laget inneholder ingen geometrier.");
  }

  // Hvis laget inneholder polygoner, preprosesseres det for å gå raskere
  const hasPolygon = layer.features.some(
    (f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
  );

  const source: FeatureCollection<Geometry> = hasPolygon
    ? (preprocessPolygonLayer(layer, { dissolve: true }) as FeatureCollection<Geometry>)
    : layer;

  const bufferedFeatures: Feature<Geometry>[] = [];

  for (const f of source.features) {
    if (!f.geometry) continue;

    const buffered = buffer(f as Feature<Geometry>, distance, {
      units: "meters",
    });

    if (buffered && buffered.geometry) {
      bufferedFeatures.push(buffered as Feature<Geometry>);
    }
  }

  if (!bufferedFeatures.length) {
    throw new Error("Fikk ikke laget buffer av dette laget.");
  }

  return {
    type: "FeatureCollection",
    features: bufferedFeatures,
  };
}

// AreaFilter
function runAreaFilter(
  layer: FeatureCollection<Geometry>,
  minArea: number
): FeatureCollection<Geometry> {
  const polys: Feature<Polygon | MultiPolygon>[] = [];

  for (const f of layer.features) {
    if (isPoly(f.geometry)) {
      polys.push({
        type: "Feature",
        properties: { ...(f.properties || {}) },
        geometry: f.geometry,
      });
    }
  }

  if (!polys.length) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  const unionFeat = unionPolygons(polys);
  if (!unionFeat || !unionFeat.geometry) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  const singlePolys = explodeToPolygons(unionFeat);
  const bigPolys: Feature<Geometry>[] = [];

  for (const p of singlePolys) {
    const currentArea = area(p);
    if (currentArea >= minArea) {
      bigPolys.push(p as Feature<Geometry>);
    }
  }

  const out4326: FeatureCollection<Geometry> = {
    type: "FeatureCollection",
    features: bigPolys,
  };

  return out4326;
}

// Union
function runUnion(layers: FeatureCollection<Geometry>[]): FeatureCollection<Geometry> {
  const perLayerPolys: Feature<Polygon | MultiPolygon>[][] = layers.map((fc) => {
    const polys: Feature<Polygon | MultiPolygon>[] = [];
    for (const f of fc.features) {
      if (isPoly(f.geometry)) {
        polys.push({
          type: "Feature",
          properties: { ...(f.properties || {}) },
          geometry: f.geometry as Polygon | MultiPolygon,
        });
      }
    }
    return polys;
  });

  const perLayerUnion: Feature<Polygon | MultiPolygon>[] = [];
  for (const polys of perLayerPolys) {
    if (!polys.length) continue;
    const u = unionPolygons(polys);
    if (u && u.geometry) {
      perLayerUnion.push(u);
    }
  }

  if (perLayerUnion.length === 0) {
    throw new Error("Fant ikke nok polygon-geometrier til å lage union.");
  }

  if (perLayerUnion.length === 1) {
    const union4326: FeatureCollection<Geometry> = {
      type: "FeatureCollection",
      features: [perLayerUnion[0] as Feature<Geometry>],
    };
    return union4326;
  }

  // 4) Union av alle lag-unionene
  const finalUnion = unionPolygons(perLayerUnion);
  if (!finalUnion || !finalUnion.geometry) {
    throw new Error("Klarte ikke å lage union av lagene.");
  }

  const union4326: FeatureCollection<Geometry> = {
    type: "FeatureCollection",
    features: [finalUnion as Feature<Geometry>],
  };

  return union4326;
}

// Worker message handler (hjelp fra AI)
console.log("geoWorker loaded");

self.onmessage = (event: MessageEvent<GeoJob>) => {
  const job = event.data;

  const respond = (msg: GeoResponse) => {
    (self as any).postMessage(msg);
  };

  try {
    switch (job.type) {
      case "difference": {
        const fc4326 = runDifference(job.layerA, job.layerB);
        return respond({ id: job.id, ok: true, type: job.type, result: { fc4326 } });
      }
      case "intersect": {
        const fc4326 = runIntersect(job.layerA, job.layerB);
        return respond({ id: job.id, ok: true, type: job.type, result: { fc4326 } });
      }
      case "buffer": {
        const fc4326 = runBuffer(job.layer, job.distance);
        return respond({ id: job.id, ok: true, type: job.type, result: { fc4326 } });
      }
      case "areaFilter": {
        const fc4326 = runAreaFilter(job.layer, job.minArea);
        return respond({ id: job.id, ok: true, type: job.type, result: { fc4326 } });
      }
      case "union": {
        const fc4326 = runUnion(job.layers);
        return respond({ id: job.id, ok: true, type: job.type, result: { fc4326 } });
      }
      default:
        throw new Error(`Ukjent jobbtype: ${(job as any).type}`);
    }
  } catch (e: any) {
    respond({
      id: job.id,
      ok: false,
      type: job.type,
      error: e?.message || "Ukjent feil i geoprocessing-worker",
    });
  }
};
