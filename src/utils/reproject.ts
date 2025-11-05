// Used AI suggestions to reproject GeoJSON data between EPSG:25832 and EPSG:4326

import proj4 from "proj4";
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

// EPSG:25832 (ETRS89 / UTM sone 32N)
proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs +type=crs");

type CoordGeom = Point | LineString | Polygon | MultiPoint | MultiLineString | MultiPolygon;

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

// --- Proj helpers ---
function forward25832to4326([x, y]: Position): [number, number] {
  const [lon, lat] = proj4("EPSG:25832", "EPSG:4326", [x, y]) as [number, number];
  return [lon, lat];
}
function inverse4326to25832([lon, lat]: Position): [number, number] {
  const [x, y] = proj4("EPSG:4326", "EPSG:25832", [lon, lat]) as [number, number];
  return [x, y];
}

function mapCoords(coords: any, fn: (p: Position) => [number, number]): any {
  if (Array.isArray(coords) && typeof coords[0] === "number") {
    return fn(coords as Position);
  }
  return (coords as any[]).map((c) => mapCoords(c, fn));
}

function transformGeometry(geom: Geometry, fn: (p: Position) => [number, number]): Geometry {
  if (isGeometryCollection(geom)) {
    return { ...geom, geometries: geom.geometries.map((g) => transformGeometry(g, fn)) };
  }
  if (isCoordGeometry(geom)) {
    return { ...geom, coordinates: mapCoords(geom.coordinates as any, fn) as any };
  }
  return geom;
}

// --- Public API ---
export function toWGS84(fc: FeatureCollection<Geometry>): FeatureCollection<Geometry> {
  const features: Feature<Geometry>[] = fc.features.map((f) => {
    if (!f.geometry) return f;
    return { ...f, geometry: transformGeometry(f.geometry, forward25832to4326) };
  });
  return { type: "FeatureCollection", features };
}

export function to25832(fc: FeatureCollection<Geometry>): FeatureCollection<Geometry> {
  const features: Feature<Geometry>[] = fc.features.map((f) => {
    if (!f.geometry) return f;
    return { ...f, geometry: transformGeometry(f.geometry, inverse4326to25832) };
  });
  return { type: "FeatureCollection", features };
}
