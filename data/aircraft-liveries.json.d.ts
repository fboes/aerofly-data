// Type definitions for aircraft-liveries.json
export type AeroflyAircraftLivery = {
  aeroflyCode: string;
  name: string;
  requirements: string[];
  icaoCode?: string;
};

export type AeroflyAircraft = {
  name: string;
  nameFull: string;
  icaoCode: string;
  tags: string[];
  approachAirspeedKts: number;
  cruiseAltitudeFt: number;
  cruiseSpeedKts: number;
  maximumRangeNm: number;
  maximumFuelMassKg: number;
  maximumPayloadKg: number;
  aeroflyCode: string;
  liveries: AeroflyAircraftLivery[];
};

declare const AeroflyAircraftLiveries: Array<AeroflyAircraft>;
export default AeroflyAircraftLiveries;
