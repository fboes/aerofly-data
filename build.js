#!/usr/bin/env node

//ts-check

import GeoJSON from "@fboes/geojson";
import * as fs from "fs";
import { parse } from "csv-parse/sync";

const icaoFilterArg = process.argv[2]?.replace(/[^A-Z]/, '').toUpperCase();
const icaoFilter = icaoFilterArg
  ? new RegExp("^[" + icaoFilterArg + "]")
  : null;
const aeroflyData = fs.readFileSync(0, "utf-8");
const aeroflyGeoJson = new GeoJSON.FeatureCollection();
const aeroflyAirports = aeroflyData
  .match(/\S+\.wad/gu)
  .map((filename) => {
    return filename.replace(/\.wad/, "").toUpperCase();
  })
  .filter((icaoCode) => {
    return !icaoFilter || icaoCode.match(icaoFilter);
  });

const airportsSource = fs.readFileSync(`tmp/airports.csv`);
const airportsRecords = parse(airportsSource, { bom: true });

airportsRecords.forEach(
  /** @param {String[]} airportsRecord */
  (airportsRecord) => {
    // 'id',             'ident',
    // 'type',           'name',
    // 'latitude_deg',   'longitude_deg',
    // 'elevation_ft',   'continent',

    // 3685,"KMIA","large_airport","Miami International Airport",25.79319953918457,-80.29060363769531,8,"NA","US","US-FL","Miami","yes","KMIA","MIA","MIA","http://www.miami-airport.com/","https://en.wikipedia.org/wiki/

    const icaoCode = airportsRecord[1];
    const icaoCodeAlternate = airportsRecord[12];

    // EL = Europe
    // K = US
    if (
      icaoFilter &&
      !icaoCode.match(icaoFilter) &&
      !icaoCodeAlternate.match(icaoFilter)
    ) {
      return;
    }

    const aeroflyIndex = aeroflyAirports.indexOf(icaoCode);
    const aeroflyIndexAlternate = aeroflyAirports.indexOf(icaoCodeAlternate);

    if (aeroflyIndex >= 0 || aeroflyIndexAlternate >= 0) {
      // Remove airport from list of Aerofly airports
      if (aeroflyIndex >= 0) {
        aeroflyAirports.splice(aeroflyIndex, 1);
      } else if (aeroflyIndexAlternate >= 0) {
        aeroflyAirports.splice(aeroflyIndexAlternate, 1);
      }

      aeroflyGeoJson.addFeature(
        new GeoJSON.Feature(
          new GeoJSON.Point(
            Number(airportsRecord[5]),
            Number(airportsRecord[4]),
            Number(airportsRecord[6]) * 0.3048
          ),
          {
            title: icaoCode,
            type: airportsRecord[2],
            description: airportsRecord[3],
            elevation: Number(airportsRecord[6]),
            municipality: airportsRecord[10],
            "marker-symbol": airportsRecord[2].match(/heliport/)
              ? "heliport"
              : airportsRecord[2].match(/small/)
              ? "airfield"
              : "airport",
            "marker-color": airportsRecord[2].match(/large/)
              ? "#5e6eba"
              : airportsRecord[2].match(/small/)
              ? "#777777"
              : "#555555",
          }
        )
      );
    }
  }
);

process.stdout.write(JSON.stringify(aeroflyGeoJson, null, 2));
if (aeroflyAirports.length > 0) {
  process.stderr.write("Missing airport codes: " + aeroflyAirports.join(", "));
}
