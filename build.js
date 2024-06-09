#!/usr/bin/env node

//ts-check

import GeoJSON from "@fboes/geojson";
import * as fs from "fs";
import { parse } from "csv-parse/sync";

const icaoFilterArg = process.argv[2]?.replace(/[^A-Z]/, "").toUpperCase();
const icaoFilter = icaoFilterArg
  ? new RegExp("^[" + icaoFilterArg + "]")
  : null;
const aeroflyData = fs.readFileSync(0, "utf-8");
const aeroflyGeoJson = new GeoJSON.FeatureCollection();
const aeroflyAirports = new Set(
  aeroflyData
    .match(/\S+\.wad/gu)
    .map((filename) => {
      return filename.replace(/\.wad/, "").toUpperCase();
    })
    .filter((icaoCode) => {
      return !icaoFilter || icaoCode.match(icaoFilter);
    }),
);
const aeroflyAirportsLength = aeroflyAirports.size;
process.stderr
  .write(`Found \x1b[92m${aeroflyAirports.size}\x1b[0m Aerofly FS Airports
`);

const airportsSource = fs.readFileSync(`tmp/airports.csv`);
const airportsRecords = parse(airportsSource, { bom: true });

let airportsRecordsProcessed = 0;
airportsRecords.forEach(
  /** @param {string[]} airportsRecord with a single CSV line from airports.csv */
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

    airportsRecordsProcessed++;

    if (
      aeroflyAirports.has(icaoCode) ||
      aeroflyAirports.has(icaoCodeAlternate)
    ) {
      // Remove airport from list of Aerofly airports
      aeroflyAirports.delete(icaoCode) ||
        aeroflyAirports.delete(icaoCodeAlternate);

      const isMilitary =
        airportsRecord[3].match(
          /\b(base|rnas|raf|naval|air\s?force|coast\s?guard|army|afs)\b/i,
        ) !== null;
      let type = airportsRecord[2];
      if (isMilitary) {
        type = type.replace(/port/, "base");
      }

      const feature = new GeoJSON.Feature(
        new GeoJSON.Point(
          Number(airportsRecord[5]),
          Number(airportsRecord[4]),
          Number(airportsRecord[6]) * 0.3048,
        ),
        {
          title: icaoCode,
          type: type,
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
        },
      );
      if (isMilitary) {
        feature.setProperty("isMilitary", true);
      }

      aeroflyGeoJson.addFeature(feature);
    }

    if (airportsRecordsProcessed % 5000 === 0) {
      const index = aeroflyAirportsLength - aeroflyAirports.size;
      process.stderr
        .write(`  Processed \x1b[92m${String(airportsRecordsProcessed).padStart(5)}\x1b[0m airport records, found \x1b[92m${String(index).padStart(5)}\x1b[0m Aerofly FS Airports
`);
    }
  },
);

process.stdout.write(JSON.stringify(aeroflyGeoJson, null, 2));
if (aeroflyAirports.size > 0) {
  process.stderr.write(
    `Missing airport matches for \x1b[92m${
      aeroflyAirports.size
    }\x1b[0m airports, \x1b[92m${(
      (aeroflyAirports.size / aeroflyAirportsLength) *
      100
    ).toFixed(1)}%\x1b[0m
Missing airport codes:
\x1b[90m> ${[...aeroflyAirports].join(", ")}\x1b[0m
`,
  );
}
