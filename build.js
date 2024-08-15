#!/usr/bin/env node

//ts-check

import GeoJSON from "@fboes/geojson";
import * as fs from "fs";
import { parse } from "csv-parse/sync";

/**
 *
 * @param {string} type
 * @param {boolean} isMilitary
 * @param {number|undefined} lenght in Bytes
 * @returns {string}
 */
const geoJsonType = (type, isMilitary, lenght) => {
  if (type === "heliport") {
    return type;
  }

  if (lenght !== undefined) {
    let size = "closed";
    if (lenght > 1200) {
      size = "large";
    } else if (lenght > 1050) {
      size = "medium";
    } else if (lenght > 920) {
      size = "small";
    }

    if (size === "closed") {
      return size;
    }

    return size + "_" + (isMilitary ? "airbase" : "airport");
  }

  return type;
};

// -----------------------------------------------------------------------------

const icaoFilterArg = process.argv[2]?.replace(/[^A-Z]/, "").toUpperCase();
const icaoFilter = icaoFilterArg
  ? new RegExp("^[" + icaoFilterArg + "]")
  : null;
const aeroflyData = fs.readFileSync(0, "utf-8");

const aeroflyGeoJson = new GeoJSON.FeatureCollection();

/** @type {Map<string,number>} */
const aeroflyAirports = new Map();
const aeroflyDataMatches = aeroflyData.matchAll(/(\d+)\s+(\S+)\.wad/g);

let maxLength = 0;
let minLength = 10_000;

for (const match of aeroflyDataMatches) {
  const icaoCode = match[2].toUpperCase();
  if (!icaoFilter || icaoCode.match(icaoFilter)) {
    const length = Number(match[1]);
    maxLength = Math.max(maxLength, length);
    minLength = Math.min(minLength, length);
    aeroflyAirports.set(icaoCode, length);
  }
}

const aeroflyAirportsLength = aeroflyAirports.size;
process.stderr
  .write(`Found \x1b[92m${aeroflyAirports.size}\x1b[0m Aerofly FS Airports (${minLength} - ${maxLength} Bytes)
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

    const length =
      aeroflyAirports.get(icaoCode) ?? aeroflyAirports.get(icaoCodeAlternate);

    if (length !== undefined) {
      // Remove airport from list of Aerofly FS4 Airports
      aeroflyAirports.delete(icaoCode) ||
        aeroflyAirports.delete(icaoCodeAlternate);

      const isMilitary =
        airportsRecord[3].match(
          /\b(base|rnas|raf|naval|air\s?force|coast\s?guard|army|afs|mod)\b/i
        ) !== null;
      let type = airportsRecord[2];
      if (isMilitary) {
        type = type.replace(/port/, "base");
      }

      const feature = new GeoJSON.Feature(
        new GeoJSON.Point(
          Number(airportsRecord[5]),
          Number(airportsRecord[4]),
          Number(airportsRecord[6]) * 0.3048
        ),
        {
          title: icaoCode,
          type: geoJsonType(type, isMilitary, length),
          description: airportsRecord[3],
          elevation: Number(airportsRecord[6]),
          municipality: airportsRecord[10],
          fileSize: Math.ceil(length),
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
  }
);

process.stdout.write(JSON.stringify(aeroflyGeoJson, null, 2));
if (aeroflyAirports.size > 0) {
  process.stderr.write(
    `Missing airport matches for \x1b[92m${
      aeroflyAirports.size
    }\x1b[0m Aerofly FS4 Airports, \x1b[92m${(
      (aeroflyAirports.size / aeroflyAirportsLength) *
      100
    ).toFixed(1)}%\x1b[0m
Missing matches for Aerofly FS4 Airport codes:
\x1b[90m> ${[...aeroflyAirports]
      .map((a) => {
        return a[0];
      })
      .join(", ")}\x1b[0m
`
  );
}
