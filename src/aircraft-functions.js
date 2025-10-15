// @ts-check

import * as fs from "node:fs";
import * as path from "path";

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
 *     requirements: string[],
 *   }[],
 * }}
 */

/**
 * Get all potential aircraft directories in the given directory.
 * @param {string} directory
 * @returns {fs.Dirent<string>[]}
 */
const getAeroflyAircraftDirectories = (directory) => {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .sort()
    .filter((dirent) => fs.existsSync(path.join(dirent.parentPath, dirent.name, dirent.name + ".tmc")));
};

/**
 *
 * @param {string} directory
 * @returns {AeroflyAircraft[]}
 */
export const getAeroflyAircraft = (directory) => {
  return getAeroflyAircraftDirectories(directory).map((dirent) => {
    const tmdFileContent = fs.readFileSync(path.join(dirent.parentPath, dirent.name, dirent.name + ".tmc"), "utf8");

    const tmdOptionFileContent = fs.readFileSync(path.join(dirent.parentPath, dirent.name, "option.tmc"), "utf8");

    const liveries = [
      {
        aeroflyCode: "default",
        name: parseTmdLine(tmdOptionFileContent, "Description"),
        requirements: parseRequirements(tmdOptionFileContent),
      },
      ...fs
        .readdirSync(path.join(dirent.parentPath, dirent.name), {
          withFileTypes: true,
        })
        .filter((dirent) => dirent.isDirectory())
        .filter((dirent) => fs.existsSync(path.join(dirent.parentPath, dirent.name, "preview.ttx")))
        .sort()
        .map((dirent) => {
          const tmdFileContent = fs.readFileSync(path.join(dirent.parentPath, dirent.name, "option.tmc"), "utf8");

          return {
            aeroflyCode: dirent.name,
            name: parseTmdLine(tmdFileContent, "Description"),
            requirements: parseRequirements(tmdFileContent),
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
export const parseAircraft = (tmdFileContent) => {
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
    approachAirspeedKts: convertSpeed(parseTmdLine(tmdFileContent, "ApproachAirspeed")),
    /*CruiseAirspeed: convertSpeed(
      parseTmdLine(tmdFileContent, "CruiseAirspeed")
    ),*/
    cruiseAltitudeFt: convertAltitude(parseTmdLine(tmdFileContent, "CruiseAltitude")),
    cruiseSpeedKts: convertSpeed(parseTmdLine(tmdFileContent, "CruiseSpeed")),
    /*MaximumAirspeed: convertSpeed(
      parseTmdLine(tmdFileContent, "MaximumAirspeed")
    ),
    MaximumAltitude: convertAltitude(
      parseTmdLine(tmdFileContent, "MaximumAltitude")
    ),
    MaximumSpeed: convertSpeed(parseTmdLine(tmdFileContent, "MaximumSpeed")),*/
    maximumRangeNm: convertDistance(parseTmdLine(tmdFileContent, "MaximumRange")),
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

const parseRequirements = (tmdFileContent) => {
  const requirements = parseTmdLine(tmdFileContent, "Requirements").trim();
  if (requirements === "") {
    return [];
  }
  return requirements
    .split(" ")
    .map((req) => req.trim())
    .filter((req) => req !== "");
};

/**
 *
 * @param {string} tmdFileContent
 * @param {string} key
 * @returns {string}
 */
export const parseTmdLine = (tmdFileContent, key) => {
  const r = new RegExp("\\[" + key + "\\]\\s*\\[(.+?)\\]");
  const match = tmdFileContent.match(r);
  return match && match[1] ? match[1] : "";
};

/**
 *
 * @param {string} speed in m/s
 * @returns {number} in kts
 */
export const convertSpeed = (speed) => {
  return Math.round(Number(speed) * 1.94384449);
};

/**
 *
 * @param {string} altitude in m
 * @returns {number} in ft
 */
export const convertAltitude = (altitude) => {
  return Math.round(Number(altitude) * 3.28084);
};

/**
 *
 * @param {string} range in m
 * @returns {number} in kts
 */
export const convertDistance = (range) => {
  return Math.round(Number(range) / 1852);
};

/**
 *
 * @param {AeroflyAircraft[]} sortedAircraft
 * @returns {string}
 */
export const getSelectOptions = (sortedAircraft) => {
  const selectContent = sortedAircraft
    .map((aircraft) => {
      return `  <option value="${aircraft.aeroflyCode}">${aircraft.nameFull}</option>`;
    })
    .join("\n");

  return `\
<select id="aircraft-select">
${selectContent}
</select>
`;
};

/**
 *
 * @param {AeroflyAircraft[]} sortedAircraft
 * @returns {string}
 */
export const getSelectOptgroupOptions = (sortedAircraft) => {
  /**
   * @type {{
   *   [key: string]: {
   *     label: string,
   *     options: { value: string; label: string }[]
   *   }
   * }}
   */
  const options = {
    airliner: {
      label: "Airliner",
      options: [],
    },
    helicopter: {
      label: "Helicopters",
      options: [],
    },
    general_aviation: {
      label: "General Aviation",
      options: [],
    },
    historical: {
      label: "Historical Aircraft",
      options: [],
    },
    military: {
      label: "Military Aircraft",
      options: [],
    },
    aerobatic: {
      label: "Aerobatic aircraft",
      options: [],
    },
    glider: {
      label: "Gliders",
      options: [],
    },
  };

  for (const aircraft of sortedAircraft) {
    const o = {
      value: aircraft.aeroflyCode,
      label: aircraft.nameFull,
    };

    if (aircraft.tags.includes("historical")) {
      options.historical.options.push(o);
    } else if (aircraft.tags.includes("airliner")) {
      options.airliner.options.push(o);
    } else if (aircraft.tags.includes("helicopter")) {
      options.helicopter.options.push(o);
    } else if (aircraft.tags.includes("military")) {
      options.military.options.push(o);
    } else if (aircraft.tags.includes("glider")) {
      options.glider.options.push(o);
    } else if (aircraft.tags.includes("aerobatic")) {
      options.aerobatic.options.push(o);
    } else {
      options.general_aviation.options.push(o);
    }
  }

  let html = "";
  for (const optgroup of [
    options.airliner,
    options.general_aviation,
    options.military,
    options.historical,
    options.helicopter,
    options.aerobatic,
    options.glider,
  ]) {
    if (optgroup.options.length === 0) {
      continue;
    }
    html += `  <optgroup label="${optgroup.label}">` + "\n";
    for (const option of optgroup.options) {
      html += `    <option value="${option.value}">${option.label}</option>` + "\n";
    }
    html += "  </optgroup>\n";
  }

  return `\
<select id="aircraft-select-optgroup">
${html}\
</select>
`;
};
