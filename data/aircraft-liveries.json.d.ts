// Type definitions for aircraft-liveries.json
export type AeroflyAircraftLivery = {
  aeroflyCode: string;
  name: string;
  requirements: string[];
};

declare const AeroflyAircraftLiveries: Array<{
  name: string;
  nameFull: string;
  icaoCode: string;
  tags: string[];
  approachAirspeedKts: number;
  cruiseAltitudeFt: number;
  cruiseSpeedKts: number;
  maximumRangeNm: number;
  aeroflyCode: string;
  liveries: AeroflyAircraftLivery[];
}>;
export default AeroflyAircraftLiveries;
