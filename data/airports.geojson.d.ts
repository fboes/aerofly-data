// Type definitions for airports.geojson
export interface AeroflyGeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number, number?];
  };
  properties: {
    title: string;
    type: string;
    description: string;
    elevation: number;
    municipality: string;
    fileSize: number;
    "marker-symbol": string;
    "marker-color": string;
    [key: string]: any;
  };
}

export interface AeroflyGeoJSON {
  type: "FeatureCollection";
  features: AeroflyGeoJSONFeature[];
}

declare const AeroflyAirportsGeoJSON: AeroflyGeoJSON;
export default AeroflyAirportsGeoJSON;
