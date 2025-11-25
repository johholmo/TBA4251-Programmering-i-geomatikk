// Funksjoner som brukes til å reprojisere GeoJSON-data mellom EPSG:25832 og EPSG:4326, og andre geomatikk verktøy.

import proj4 from "proj4"; // Importer bibliotek for koordinattransformasjoner
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeometryCollection,
  Position,
  Point,
  LineString,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
} from "geojson";
import intersect from "@turf/intersect";
import difference from "@turf/difference";
import * as turf from "@turf/turf";

// Definerer EPSG:25832 (ETRS89 / UTM sone 32N)
proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs +type=crs");

type CoordGeom = Point | LineString | Polygon | MultiPoint | MultiLineString | MultiPolygon;

// Funksjoner for å bestemme geometri-type
function isGeometryCollection(geom: Geometry): geom is GeometryCollection {
  return geom.type === "GeometryCollection";
}
function isCoordGeometry(geom: Geometry): geom is CoordGeom {
  return (
    geom.type === "Point" ||
    geom.type === "LineString" ||
    geom.type === "Polygon" ||
    geom.type === "MultiPoint" ||
    geom.type === "MultiLineString" ||
    geom.type === "MultiPolygon"
  );
}
export function isPoly(g: Geometry | null | undefined): g is Polygon | MultiPolygon {
  return !!g && (g.type === "Polygon" || g.type === "MultiPolygon");
}

// Funksjon for å sjekke om geojson er i EPSG:25832
export function isEPSG25832(fc: FeatureCollection<Geometry>): boolean {
  const crsName = (fc as any).crs?.properties?.name as string | undefined;
  if (!crsName) return false;
  return crsName.includes("25832");
}

// Funksjoner for å transformere koordinater
// Meter -> lat/lon
function forward25832to4326([x, y]: Position): [number, number] {
  const [lon, lat] = proj4("EPSG:25832", "EPSG:4326", [x, y]) as [number, number];
  return [lon, lat];
}
// Lat/lon -> meter
function inverse4326to25832([lon, lat]: Position): [number, number] {
  const [x, y] = proj4("EPSG:4326", "EPSG:25832", [lon, lat]) as [number, number];
  return [x, y];
}
// Rekursivt mappe koordinater. Sjekker om coords er en enkelt posisjon eller en liste av posisjoner
function mapCoords(coords: any, fn: (p: Position) => [number, number]): any {
  if (Array.isArray(coords) && typeof coords[0] === "number") {
    return fn(coords as Position);
  }
  return (coords as any[]).map((c) => mapCoords(c, fn));
}
// Transformere geometri. Returnerer et nytt geometriobjekt med transformerte koordinater, og originalen forblir uendret
function transformGeometry(geom: Geometry, fn: (p: Position) => [number, number]): Geometry {
  if (isGeometryCollection(geom)) {
    return { ...geom, geometries: geom.geometries.map((g) => transformGeometry(g, fn)) };
  }
  if (isCoordGeometry(geom)) {
    return { ...geom, coordinates: mapCoords(geom.coordinates as any, fn) as any };
  }
  return geom;
}

// Transformere hele FeatureCollection til WGS84
export function toWGS84(fc: FeatureCollection<Geometry>): FeatureCollection<Geometry> {
  const features: Feature<Geometry>[] = fc.features.map((f) => {
    if (!f.geometry) return f;
    return { ...f, geometry: transformGeometry(f.geometry, forward25832to4326) };
  });
  return { type: "FeatureCollection", features };
}
// Transformere hele FeatureCollection til EPSG:25832
export function to25832(fc: FeatureCollection<Geometry>): FeatureCollection<Geometry> {
  const features: Feature<Geometry>[] = fc.features.map((f) => {
    if (!f.geometry) return f;
    return { ...f, geometry: transformGeometry(f.geometry, inverse4326to25832) };
  });
  return { type: "FeatureCollection", features };
}

// Geometriske verktøy

// Union av flere polygoner
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
  // Prøver batch-union først, og faller tilbake til iterativ union hvis det feiler
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

// Splitte MultiPolygon-funksjoner til individuelle Polygon-funksjoner
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

// Mye trøbbel med intersect fra @turf, så AI foreslo å lage en wrapper som støtter både "intersect(a,b)" og "intersect(FeatureCollection)"
export function turfIntersect(
  a: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon,
  b: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon
): Feature<Polygon | MultiPolygon> | null {
  const fn = intersect as any;

  // Prøver først vanlig intersect
  try {
    return fn(a, b) as Feature<Polygon | MultiPolygon> | null;
  } catch (e: any) {
    if (!e?.message?.includes("Must specify at least 2 geometries")) {
      throw e;
    }
    // Hvis vi får en kjent feilmelding som lager trøbbel med polygon-lag løser vi det ved å pakke inn i FeatureCollection
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

// Samme logikk som intersect over, bare med difference
export function turfDifference(
  a: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon,
  b: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon
): Feature<Polygon | MultiPolygon> | null {
  const fn = difference as any;

  try {
    // Prøv først vanlig difference
    return fn(a, b) as Feature<Polygon | MultiPolygon> | null;
  } catch (e: any) {
    const msg = e?.message || "";

    // Typiske feilmelding pga turf, så eliminerer dem
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
