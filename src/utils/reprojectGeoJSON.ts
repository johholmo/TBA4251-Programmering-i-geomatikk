import { reproject } from "reproject";

export function toWgs84(fc: any, fromCrs = "EPSG:25832") {
  try {
    return reproject(fc, fromCrs, "EPSG:4326");
  } catch (e) {
    console.error("Reprojection failed:", e);
    return fc;
  }
}
