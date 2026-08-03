# ATL / 24 — Flight Activity Visualization

ATL / 24 is an editorial flight-activity visualization built for both exploration and vertical video. It animates a representative day of domestic arrivals and departures at Hartsfield–Jackson Atlanta International Airport, with great-circle routes, moving flight heads, fading trails, live statistics, and an accumulating daily network.

The included deterministic mock dataset contains 240 flights across a full day and is ready to use without downloading external data.

## What the visualization looks like

The interactive view uses a dark continental-US map with cool cyan arrivals, warm orange departures, a pulsing ATL marker, a synchronized clock, live counts, and direct playback controls. The recording view rearranges the same visualization into a minimal 9:16 editorial composition for a 1080 × 1920 Instagram Reel.

## Setup

Requirements: Node.js 22.13 or newer and a browser with WebGL support.

```bash
npm install
npm run generate:mock
npm run dev
```

Open the URL printed by Vite. The app loads the representative ATL day by default.

## Commands

```bash
npm run dev            # start local development
npm run build          # type-check and build for production
npm run test           # run deterministic unit tests
npm run lint           # run ESLint
npm run format         # format the project with Prettier
npm run generate:mock  # regenerate the seeded mock dataset and manifest
npm run preprocess     # convert BTS and OurAirports CSV data
```

## Routes

### Interactive route

`/`

The interactive route includes airport and date selectors, play/pause and restart controls, timeline scrubbing, 15/30/60/120-minute playback speeds, and toggles for the completed network, secondary airport markers, active-flight count, and debug information.

The default 60-minute speed compresses the 24-hour day into about 24 seconds.

### Recording route

`/recording?airport=ATL&date=2026-05-15&speed=60`

Supported parameters:

| Parameter   | Values                  | Default | Purpose                                     |
| ----------- | ----------------------- | ------- | ------------------------------------------- |
| `airport`   | Manifest airport code   | `ATL`   | Selects the airport dataset                 |
| `date`      | Manifest date or `mock` | `mock`  | Selects the day                             |
| `speed`     | `15`, `30`, `60`, `120` | `60`    | Simulated minutes per real second           |
| `autoplay`  | `true`, `false`         | `true`  | Begins after a one-second composition delay |
| `loop`      | `true`, `false`         | `true`  | Restarts at the end of the day              |
| `showDebug` | `true`, `false`         | `false` | Shows render diagnostics                    |

The recording route has no hover UI, scrollbars, or development controls. Completed routes remain at low opacity so the full daily network accumulates over time.

## Data architecture

The browser never parses large source CSV files. It reads a small manifest plus one preprocessed JSON file for the selected airport and date. Production hosting uses only a minimal static-asset worker entry; there is no application backend or runtime data processing.

```text
public/data/manifest.json
public/data/ATL/mock.json
public/data/ATL/2026-05-15.json
```

Each flight stores elapsed minutes from the start of the selected airport’s day and a timestamped, approximately 48-point great-circle path. Flights crossing midnight may have a negative `startMinute` or an `endMinute` above 1440 and are retained when any part overlaps the selected day.

The project layout is:

```text
src/
  components/   map, controls, statistics, status, and debug UI
  data/         visual theme constants
  hooks/        playback, data loading, and FPS tracking
  lib/          time, geography, preprocessing, and statistics logic
  pages/        interactive and recording routes
  styles/       responsive editorial styling
  types/        processed data contracts
scripts/        mock generation, airport fixtures, and CSV preprocessing
public/data/    browser-ready manifests and flight-day JSON
```

## Real-data preprocessing

Download flight records from the US Bureau of Transportation Statistics and airport metadata from [OurAirports](https://ourairports.com/data/). Place raw files somewhere outside `public/`—for example:

```text
raw/flights.csv
raw/airports.csv
```

Convert one airport and date with:

```bash
npm run preprocess -- \
  --flights ./raw/flights.csv \
  --airports ./raw/airports.csv \
  --airport ATL \
  --date 2026-05-15
```

The script writes `public/data/ATL/2026-05-15.json`. Add or update the corresponding entry in `public/data/manifest.json` before using it in the selectors. Field aliases are isolated in `src/lib/preprocess.ts`, so a differently named source export can be supported by editing one mapping.

### Expected BTS flight fields

The processor recognizes names equivalent to:

- `FlightDate`
- `Reporting_Airline`
- `Flight_Number_Reporting_Airline`
- `Origin` and `Dest`
- `CRSDepTime` and `DepTime`
- `CRSArrTime` and `ArrTime`
- `ActualElapsedTime` and `CRSElapsedTime`
- `Cancelled` and `Diverted`
- `Distance`

Cancelled and diverted flights are excluded. Actual times and duration are preferred; scheduled values are used as fallbacks.

### Expected OurAirports fields

- `ident`
- `iata_code`
- `name`
- `latitude_deg`
- `longitude_deg`
- `municipality`
- `iso_country`
- `type`

Only rows with a three-letter IATA code and valid coordinates are kept.

### Selected-airport time normalization

For a departure, the path begins at actual (or scheduled) departure time and ends after actual (or scheduled) elapsed duration. For an arrival, the path ends at actual (or scheduled) arrival time and begins one elapsed duration earlier. This keeps the entire animation aligned to the selected airport’s local day without resolving every destination timezone.

## Add another airport or date

1. Ensure the selected airport and destinations exist in the airports CSV.
2. Run the preprocessing command with the new airport code and date.
3. Add the airport/date/file entry to `public/data/manifest.json`.
4. Reload the app; selectors are generated entirely from the manifest.

For a mock airport, add coordinates to `scripts/airports.ts` and adapt `scripts/generate-mock.ts` to produce its flight day.

## Recording at 1080 × 1920

### Browser recording

1. Open `/recording?airport=ATL&date=mock&speed=60&autoplay=false`.
2. Set the browser viewport to exactly 1080 × 1920.
3. Hide browser chrome if possible.
4. Change `autoplay=false` to `autoplay=true` or reload a URL without that parameter.
5. Record at 60 frames per second when supported.

At 60 simulated minutes per real second, the complete day takes approximately 24 seconds. The canvas uses the correct 9:16 aspect ratio and scales down proportionally for previews.

For automated capture, Playwright can be added separately to open the recording route at 1080 × 1920 and capture video. It is intentionally not a core dependency.

## Testing

Unit tests cover HHMM parsing, midnight crossings, arrival and departure time derivation, scheduled fallbacks, great-circle generation, timestamp interpolation, active-flight detection, completed counts, and source-record filtering. The fixed mock seed makes generated output reproducible.

## Performance notes

The app gives deck.gl timestamped routes that are already calculated in JSON. `TripsLayer` animates trails on the GPU. React maintains one shared simulation clock rather than per-flight state, and completed-route data is updated in five-minute buckets. The design target is 2,500 daily flights, 500 simultaneously active flights, and 40–60 points per route.

## Accessibility

All interactive controls have accessible labels and keyboard behavior. Statistics use high-contrast text, the loaded dataset is summarized for screen readers, and the interactive view starts paused when `prefers-reduced-motion` is enabled.

## Important limitation

Routes are calculated great-circle arcs between airport coordinates. They are not literal radar-recorded aircraft tracks and do not show real airways, weather deviations, holding patterns, or air-traffic-control vectors. The bundled flight schedule is deterministic mock data designed to demonstrate the product before external data is supplied.

## Data attribution

The production preprocessing workflow is designed for US Bureau of Transportation Statistics flight records and OurAirports airport metadata. The dark basemap uses OpenStreetMap contributors and CARTO tiles. Consult each source’s current terms before republishing derived data.
