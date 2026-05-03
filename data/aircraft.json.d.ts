// Type definitions for aircraft.json
declare const AeroflyAircraft: Array<{
  name: string;
  nameFull: string;
  icaoCode: string;
  tags: string[];
  approachAirspeedKts: number;
  cruiseAltitudeFt: number;
  cruiseSpeedKts: number;
  maximumRangeNm: number;
  maximumFuelMassKg?: number;
  maximumPayloadKg?: number;
  maximumTakeoffMassKg?: number;
  operatingEmptyMassKg?: number;
  aeroflyCode: string;
}>;
export default AeroflyAircraft;
