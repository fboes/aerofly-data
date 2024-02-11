# Aerofly Airports

This project contains [GeoJSON](https://geojson.org/) which show the location of all airports present in [Aerofly FS 4](https://www.aerofly.com/). This project is based on data from [OurAirports](https://ourairports.com/).

## Usage

* [`airports.geojson`](./data/airports.geojson) contains _all_ airports
* [`airports-e.geojson`](./data/airports-e.geojson) contains airports from the European region
* [`airports-k.geojson`](./data/airports-k.geojson) contains airports from the North American region

## Building

To generate a new list of all airports available in Aerofly FS 4:

1. Install this project  
  `npm install`
2. Download a list of all airports from https://ourairports.com/data/ to `tmp/airports.csv`.  
  `wget -O tmp/airports.csv https://davidmegginson.github.io/ourairports-data/airports.csv`
3. Get a directory listing of all Aerofly airports from your local installation and paste it to `tmp/airports.txt`.
  `ls 'C:\SteamLibrary\steamapps\common\Aerofly FS 4 Flight Simulator\scenery\airports_db' > airports.txt`
4. Generate output file via `time node ./build.js < tmp/airports.txt > data/airports.geojson`. There is also an extra parameter after `build.js` which only uses airports with ICAO codes starting with the letters you supply.

## Legal stuff

Author: [Frank Boës](https://3960.org)

Copyright & license: See [LICENSE.txt](LICENSE.txt)

This tool is NOT affiliated with, endorsed, or sponsored by IPACS GbR. As stated in the [LICENSE.txt](LICENSE.txt), this tool comes with no warranty.

The base data for geo locations was taken from [OurAirports](https://ourairports.com/), which is licensed as: "All data is released to the Public Domain, and comes with no guarantee of accuracy or fitness for use."

The icons are based on [Maki icons](https://github.com/mapbox/maki), which are licensed via CC0 1.0 Universal.
