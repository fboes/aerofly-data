#!/usr/bin/env node

//@ts-check

import * as fs from "node:fs";
import * as path from "node:path";

/**
 * @typedef AeroflyAircraftParsed
 * @type {{
 *   name: string,
 *   nameFull: string,
 *   icaoCode: string,
 *   tags: string[],
 *   approachAirspeedKts: number,
 *   cruiseAltitudeFt: number,
 *   cruiseSpeedKts: number,
 *   maximumRangeNm: number,
 * }}
 */

/**
 * @typedef AeroflyAircraft
 * @type {AeroflyAircraftParsed | {
 *   aeroflyCode: string,
 *   liveries: {
 *     aeroflyCode: string,
 *     name: string,
 *   }[],
 * }}
 */

/**
 *
 * @param {string} directory
 * @returns {AeroflyAircraft[]}
 */
const getAeroflyAircraft = (directory) => {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .sort()
    .map((dirent) => {
      const tmdFileContent = fs.readFileSync(
        path.join(dirent.parentPath, dirent.name, dirent.name + ".tmc"),
        "utf8"
      );

      return {
        ...parseAircraft(tmdFileContent),
        aeroflyCode: dirent.name,
        liveries: fs
          .readdirSync(path.join(dirent.parentPath, dirent.name), {
            withFileTypes: true,
          })
          .filter((dirent) => dirent.isDirectory())
          .filter((dirent) =>
            fs.existsSync(
              path.join(dirent.parentPath, dirent.name, "preview.ttx")
            )
          )
          .sort()
          .map((dirent) => {
            const tmdFileContent = fs.readFileSync(
              path.join(dirent.parentPath, dirent.name, "option.tmc"),
              "utf8"
            );

            return {
              aeroflyCode: dirent.name,
              name: parseTmdLine(tmdFileContent, "Description"),
            };
          }),
      };
    });
};

/**
 * @param {string} tmdFileContent
 * @returns {AeroflyAircraftParsed}
 */
const parseAircraft = (tmdFileContent) => {
  const tags = parseTmdLine(tmdFileContent, "Tags").trim().split(" ");

  // type: ;
  return {
    name: parseTmdLine(tmdFileContent, "DisplayName"),
    nameFull: parseTmdLine(tmdFileContent, "DisplayNameFull"),
    icaoCode: parseTmdLine(tmdFileContent, "ICAO"),
    tags,
    /*MinimumAirspeed: convertSpeed(
      parseTmdLine(tmdFileContent, "MinimumAirspeed")
    ),*/
    approachAirspeedKts: convertSpeed(
      parseTmdLine(tmdFileContent, "ApproachAirspeed")
    ),
    /*CruiseAirspeed: convertSpeed(
      parseTmdLine(tmdFileContent, "CruiseAirspeed")
    ),*/
    cruiseAltitudeFt: convertAltitude(
      parseTmdLine(tmdFileContent, "CruiseAltitude")
    ),
    cruiseSpeedKts: convertSpeed(parseTmdLine(tmdFileContent, "CruiseSpeed")),
    /*MaximumAirspeed: convertSpeed(
      parseTmdLine(tmdFileContent, "MaximumAirspeed")
    ),
    MaximumAltitude: convertAltitude(
      parseTmdLine(tmdFileContent, "MaximumAltitude")
    ),
    MaximumSpeed: convertSpeed(parseTmdLine(tmdFileContent, "MaximumSpeed")),*/
    maximumRangeNm: convertDistance(
      parseTmdLine(tmdFileContent, "MaximumRange")
    ),
    /*FlapAirspeedRange: parseTmdLine(tmdFileContent, "FlapAirspeedRange")
      .trim()
      .split(" ")
      .map((v) => convertSpeed(v)),
    NormalAirspeedRange: parseTmdLine(tmdFileContent, "NormalAirspeedRange")
      .trim()
      .split(" ")
      .map((v) => convertSpeed(v)),
    CautionAirspeedRange: parseTmdLine(tmdFileContent, "CautionAirspeedRange")
      .trim()
      .split(" ")
      .map((v) => convertSpeed(v)),*/
  };
};

/**
 *
 * @param {string} tmdFileContent
 * @param {string} key
 * @returns {string}
 */
const parseTmdLine = (tmdFileContent, key) => {
  const r = new RegExp("\\[" + key + "\\]\\s*\\[(.+?)\\]");
  const match = tmdFileContent.match(r);
  return match && match[1] ? match[1] : "";
};

/**
 *
 * @param {string} speed in m/s
 * @returns {number} in kts
 */
const convertSpeed = (speed) => {
  return Math.round(Number(speed) * 1.94384449);
};

/**
 *
 * @param {string} altitude in m
 * @returns {number} in ft
 */
const convertAltitude = (altitude) => {
  return Math.round(Number(altitude) * 3.28084);
};

/**
 *
 * @param {string} range in m
 * @returns {number} in kts
 */
const convertDistance = (range) => {
  return Math.round(Number(range) / 1852);
};

// -----------------------------------------------------------------------------

const inputDirectory = process.argv[2] ?? ".";
const aeroflyAircraft = getAeroflyAircraft(inputDirectory);

process.stderr
  .write(`Found \x1b[92m${aeroflyAircraft.length}\x1b[0m Aerofly FS Aircraft
`);

process.stdout.write(JSON.stringify(aeroflyAircraft, null, 2));
