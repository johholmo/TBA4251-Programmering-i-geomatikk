/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />
export {};
// Hjelp fra AI til å skrive geo-worker. Måtte flytte ting ut i worker for at nettsiden ikke skulle krasje.
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";

import bbox from "@turf/bbox";
import booleanIntersects from "@turf/boolean-intersects";
import cleanCoords from "@turf/clean-coords";
import * as turf from "@turf/turf";

import {
  isPoly,
  to25832,
  turfDifference,
  turfIntersect,
  unionPolygons,
  explodeToPolygons,
} from "../utils/geomaticFunctions";

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
    fc25832: FeatureCollection<Geometry>;
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

// Difference
function runDifference(
  layerA: FeatureCollection<Geometry>,
  layerB: FeatureCollection<Geometry>
): { fc4326: FeatureCollection<Geometry>; fc25832: FeatureCollection<Geometry> } {
  const featsA: Feature<Polygon | MultiPolygon>[] = [];
  const featsB: Feature<Polygon | MultiPolygon>[] = [];

  // Samle polygoner i A og B
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

  const outFeatures: Feature<Geometry>[] = [];

  // Forhåndsberegn bbox for alle B
  const featsBWithBbox = featsB.map((fb) => ({
    feature: fb,
    bbox: bbox(fb.geometry as any),
  }));

  // STANDARD MODUS: A minus alle B, én og én
  for (const fa of featsA) {
    let currentGeom: Polygon | MultiPolygon | null = fa.geometry || null;
    if (!currentGeom) continue;

    for (const { feature: fb, bbox: bbB } of featsBWithBbox) {
      if (!currentGeom) break; // Hele A er spist opp

      const geomB = fb.geometry;
      if (!geomB) continue;

      // Grov bbox-sjekk
      const bbA = bbox(currentGeom as any);
      const overlapBBox =
        bbA[0] <= bbB[2] && bbA[2] >= bbB[0] && bbA[1] <= bbB[3] && bbA[3] >= bbB[1];

      if (!overlapBBox) continue;

      // Mer nøyaktig intersect-test
      const intersects = booleanIntersects(
        { type: "Feature", properties: {}, geometry: currentGeom } as any,
        { type: "Feature", properties: {}, geometry: geomB } as any
      );
      if (!intersects) continue;

      // Prøv difference: currentGeom - geomB
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
          // Hele currentGeom er dekket av B
          currentGeom = null;
          break;
        }

        currentGeom = res.geometry;
      } catch {
        // Fallback: rens koordinater og prøv igjen
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

  const diff4326: FeatureCollection<Geometry> = {
    type: "FeatureCollection",
    features: outFeatures,
  };
  const diff25832 = to25832(diff4326);

  return { fc4326: diff4326, fc25832: diff25832 };
}

// Intersect
function runIntersect(
  layerA: FeatureCollection<Geometry>,
  layerB: FeatureCollection<Geometry>
): { fc4326: FeatureCollection<Geometry>; fc25832: FeatureCollection<Geometry> } {
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
  const intersect25832 = to25832(intersect4326);

  return { fc4326: intersect4326, fc25832: intersect25832 };
}

// Buffer
// Buffer – trygg, «klassisk» variant (som før)
function runBuffer(
  layer: FeatureCollection<Geometry>,
  distance: number
): { fc4326: FeatureCollection<Geometry>; fc25832: FeatureCollection<Geometry> } {
  const bufferedFeatures: Feature<Geometry>[] = [];

  for (const f of layer.features) {
    if (!f.geometry) continue;

    // Samme som før: buffer hver feature for seg
    const buffered = turf.buffer(f as Feature<Geometry>, distance, { units: "meters" });

    if (buffered && buffered.geometry) {
      bufferedFeatures.push(buffered as Feature<Geometry>);
    }
  }

  if (!bufferedFeatures.length) {
    throw new Error("Fikk ikke laget buffer av dette laget.");
  }

  const buffered4326: FeatureCollection<Geometry> = {
    type: "FeatureCollection",
    features: bufferedFeatures,
  };
  const buffered25832 = to25832(buffered4326);

  return { fc4326: buffered4326, fc25832: buffered25832 };
}

// AreaFilter
function runAreaFilter(
  layer: FeatureCollection<Geometry>,
  minArea: number
): { fc4326: FeatureCollection<Geometry>; fc25832: FeatureCollection<Geometry> } {
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
      fc4326: { type: "FeatureCollection", features: [] },
      fc25832: { type: "FeatureCollection", features: [] },
    };
  }

  const unionFeat = unionPolygons(polys);
  if (!unionFeat || !unionFeat.geometry) {
    return {
      fc4326: { type: "FeatureCollection", features: [] },
      fc25832: { type: "FeatureCollection", features: [] },
    };
  }

  const singlePolys = explodeToPolygons(unionFeat);
  const bigPolys: Feature<Geometry>[] = [];

  for (const p of singlePolys) {
    const area = turf.area(p);
    if (area >= minArea) {
      bigPolys.push(p as Feature<Geometry>);
    }
  }

  const out4326: FeatureCollection<Geometry> = {
    type: "FeatureCollection",
    features: bigPolys,
  };
  const out25832 = to25832(out4326);

  return { fc4326: out4326, fc25832: out25832 };
}

// Union
// Union av flere lag (som Union-verktøyet)
function runUnion(layers: FeatureCollection<Geometry>[]): {
  fc4326: FeatureCollection<Geometry>;
  fc25832: FeatureCollection<Geometry>;
} {
  // 1) Samle polygoner per lag
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

  // 2) Unionér hver lag for seg
  const perLayerUnion: Feature<Polygon | MultiPolygon>[] = [];
  for (const polys of perLayerPolys) {
    if (!polys.length) continue;
    // unionPolygons er allerede robust (bruker turf.union med fallback)
    const u = unionPolygons(polys);
    if (u && u.geometry) {
      perLayerUnion.push(u);
    }
  }

  if (perLayerUnion.length === 0) {
    throw new Error("Fant ikke nok polygon-geometrier til å lage union.");
  }

  // 3) Hvis bare ett lag har polygoner → ferdig
  if (perLayerUnion.length === 1) {
    const union4326: FeatureCollection<Geometry> = {
      type: "FeatureCollection",
      features: [perLayerUnion[0] as Feature<Geometry>],
    };
    const union25832 = to25832(union4326);
    return { fc4326: union4326, fc25832: union25832 };
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
  const union25832 = to25832(union4326);

  return { fc4326: union4326, fc25832: union25832 };
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
        const { fc4326, fc25832 } = runDifference(job.layerA, job.layerB);
        return respond({ id: job.id, ok: true, type: job.type, result: { fc4326, fc25832 } });
      }
      case "intersect": {
        const { fc4326, fc25832 } = runIntersect(job.layerA, job.layerB);
        return respond({ id: job.id, ok: true, type: job.type, result: { fc4326, fc25832 } });
      }
      case "buffer": {
        const { fc4326, fc25832 } = runBuffer(job.layer, job.distance);
        return respond({ id: job.id, ok: true, type: job.type, result: { fc4326, fc25832 } });
      }
      case "areaFilter": {
        const { fc4326, fc25832 } = runAreaFilter(job.layer, job.minArea);
        return respond({ id: job.id, ok: true, type: job.type, result: { fc4326, fc25832 } });
      }
      case "union": {
        const { fc4326, fc25832 } = runUnion(job.layers);
        return respond({ id: job.id, ok: true, type: job.type, result: { fc4326, fc25832 } });
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
