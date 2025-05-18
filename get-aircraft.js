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
 * @type {AeroflyAircraftParsed & {
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

      const tmdOptionFileContent = fs.readFileSync(
        path.join(dirent.parentPath, dirent.name, "option.tmc"),
        "utf8"
      );

      const liveries = [
        {
          aeroflyCode: "default",
          name: parseTmdLine(tmdOptionFileContent, "Description"),
        },
        ...fs
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
      ];

      return {
        ...parseAircraft(tmdFileContent),
        aeroflyCode: dirent.name,
        liveries,
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

// Ensure the output directory exists
const outputDirectory = path.join("data");
await fs.promises.mkdir(outputDirectory, { recursive: true });

// Write the full output (with liveries) to aircraft-liveries.json
const outputFilePathWithLiveries = path.join(
  outputDirectory,
  "aircraft-liveries.json"
);
await fs.promises.writeFile(
  outputFilePathWithLiveries,
  JSON.stringify(aeroflyAircraft, null, 2),
  "utf-8"
);
process.stderr.write(
  `Full aircraft data (with liveries) written to \x1b[92m${outputFilePathWithLiveries}\x1b[0m\n`
);

// Write the abbreviated output (without liveries) to aircraft.json
const outputFilePathWithoutLiveries = path.join(
  outputDirectory,
  "aircraft.json"
);
await fs.promises.writeFile(
  outputFilePathWithoutLiveries,
  JSON.stringify(
    aeroflyAircraft,
    (key, value) => (key === "liveries" ? undefined : value),
    2
  ),
  "utf-8"
);
process.stderr.write(
  `Abbreviated aircraft data (without liveries) written to \x1b[92m${outputFilePathWithoutLiveries}\x1b[0m\n`
);

// Write summary to aircraft.md
const summaryFilePath = path.join(outputDirectory, "aircraft.md");
let summaryContent = `\
# Aerofly FS Aircraft Summary

| Aircraft Name                        | ICAO Code | Aerofly FS Code | Approach Speed (kts) | Cruise Altitude (ft) | Cruise Speed (kts) | Maximum Range (nm) |
| ------------------------------------ | --------- | --------------- | -------------------: | -------------------: | -----------------: | -----------------: |
`;
summaryContent += aeroflyAircraft
  .map((aircraft) => {
    return `| ${aircraft.nameFull} | \`${aircraft.icaoCode}\` | \`${aircraft.aeroflyCode}\` | ${aircraft.approachAirspeedKts} | ${aircraft.cruiseAltitudeFt} | ${aircraft.cruiseSpeedKts} | ${aircraft.maximumRangeNm} |`;
  })
  .join("\n");

await fs.promises.writeFile(summaryFilePath, summaryContent, "utf-8");
process.stderr.write(`Summary written to \x1b[92m${summaryFilePath}\x1b[0m\n`);
