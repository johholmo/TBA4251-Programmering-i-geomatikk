import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";
import intersect from "@turf/intersect";
import difference from "@turf/difference";
import * as turf from "@turf/turf";

export function isPoly(g: Geometry | null | undefined): g is Polygon | MultiPolygon {
  return !!g && (g.type === "Polygon" || g.type === "MultiPolygon");
}

// slår sammen polygoner
export function unionPolygons(
  features: Feature<Polygon | MultiPolygon>[]
): Feature<Polygon | MultiPolygon> | null {
  if (features.length === 0) return null;
  if (features.length === 1) return features[0];

  const fn = (turf as any).union;
  const fc: FeatureCollection<Polygon | MultiPolygon> = {
    type: "FeatureCollection",
    features,
  };

  try {
    return fn(fc) as Feature<Polygon | MultiPolygon> | null;
  } catch {
    let acc: Feature<Polygon | MultiPolygon> | null = features[0];
    for (let i = 1; i < features.length; i++) {
      const next = features[i];
      try {
        const u = fn(acc as any, next as any) as Feature<Polygon | MultiPolygon> | null;
        if (u) acc = u;
      } catch {}
    }
    return acc;
  }
}

// splitter MultiPolygon til en Feature per sammenhengende område
export function explodeToPolygons(feat: Feature<Polygon | MultiPolygon>): Feature<Polygon>[] {
  const out: Feature<Polygon>[] = [];
  if (!feat.geometry) return out;

  if (feat.geometry.type === "Polygon") {
    out.push(feat as Feature<Polygon>);
  } else if (feat.geometry.type === "MultiPolygon") {
    for (const coords of feat.geometry.coordinates) {
      out.push({
        type: "Feature",
        properties: { ...(feat.properties || {}) },
        geometry: {
          type: "Polygon",
          coordinates: coords,
        },
      });
    }
  }
  return out;
}

// Mye trøbbel med intersect fra @turf, så AI tipset om å lage wrapper som støtter både "intersect(a,b)" og "intersect(FeatureCollection)"
export function turfIntersect(
  a: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon,
  b: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon
): Feature<Polygon | MultiPolygon> | null {
  const fn = intersect as any;

  // Prøver først vanlig
  try {
    return fn(a, b) as Feature<Polygon | MultiPolygon> | null;
  } catch (e: any) {
    if (!e?.message?.includes("Must specify at least 2 geometries")) {
      throw e;
    }
    // Hvis vi får kjent feilmelding som lager trøbbel med polygon-lag
    const featA: Feature<Polygon | MultiPolygon> =
      (a as any).type === "Feature"
        ? (a as any)
        : { type: "Feature", properties: {}, geometry: a as Polygon | MultiPolygon };

    const featB: Feature<Polygon | MultiPolygon> =
      (b as any).type === "Feature"
        ? (b as any)
        : { type: "Feature", properties: {}, geometry: b as Polygon | MultiPolygon };

    const fc: FeatureCollection<Polygon | MultiPolygon> = {
      type: "FeatureCollection",
      features: [featA, featB],
    };

    // Kall intersect på nytt, med én FeatureCollection inn
    return fn(fc) as Feature<Polygon | MultiPolygon> | null;
  }
}

// samme logikk som intersect bare med difference
export function turfDifference(
  a: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon,
  b: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon
): Feature<Polygon | MultiPolygon> | null {
  const fn = difference as any;

  try {
    // Prøv først vanlig difference(a, b)
    return fn(a, b) as Feature<Polygon | MultiPolygon> | null;
  } catch (e: any) {
    const msg = e?.message || "";

    // Typiske feil pga turf, så eliminerer dem
    if (
      !msg.includes("Must have at least two features") &&
      !msg.includes("Must specify at least 2 geometries")
    ) {
      throw e;
    }

    const featA: Feature<Polygon | MultiPolygon> =
      (a as any).type === "Feature"
        ? (a as any)
        : { type: "Feature", properties: {}, geometry: a as Polygon | MultiPolygon };

    const featB: Feature<Polygon | MultiPolygon> =
      (b as any).type === "Feature"
        ? (b as any)
        : { type: "Feature", properties: {}, geometry: b as Polygon | MultiPolygon };

    const fc: FeatureCollection<Polygon | MultiPolygon> = {
      type: "FeatureCollection",
      features: [featA, featB],
    };

    // Kaller difference på nytt, men med FeatureCollection
    return fn(fc) as Feature<Polygon | MultiPolygon> | null;
  }
}
