# Flight / 24 — Airport Activity Visualization

Flight / 24 is an editorial flight-activity visualization built for both exploration and vertical video. It animates a representative day of domestic arrivals and departures at a selected airport, with great-circle routes, moving flight heads, fading trails, live statistics, and an accumulating daily network.

The included deterministic mock datasets contain 240 flights each for ATL and DTW and are ready to use without downloading external data.

## What the visualization looks like

The interactive view uses a dark continental-US map with cool cyan arrivals, warm orange departures, a pulsing selected-airport marker, a synchronized clock, live counts, and direct playback controls. The recording view rearranges the same visualization into a minimal 9:16 editorial composition for a 1080 × 1920 Instagram Reel.

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
npm run generate:mock  # generate or update one airport's seeded mock dataset
npm run preprocess     # convert BTS and OurAirports CSV data
```

## Routes

### Interactive route

`/`

The interactive route includes airport and date selectors, play/pause and restart controls, timeline scrubbing, 15/30/60/120-minute playback speeds, and toggles for the completed network, secondary airport markers, active-flight count, and debug information.

The default 60-minute speed compresses the 24-hour day into about 24 seconds.

### Recording route

`/recording?airport=DTW&date=mock&speed=60`

Supported parameters:

| Parameter       | Values                        | Default  | Purpose                                      |
| --------------- | ----------------------------- | -------- | -------------------------------------------- |
| `airport`       | Three-letter manifest code    | `DTW`    | Selects the airport dataset                  |
| `date`          | Manifest date or `mock`       | `mock`   | Selects the day                              |
| `speed`         | `15`, `30`, `60`, `90`, `120` | `60`     | Simulated minutes per real second            |
| `autoplay`      | `true`, `false`, `1`, `0`     | `true`   | Starts once the map and fonts are ready      |
| `loop`          | `true`, `false`, `1`, `0`     | `true`   | Repeats after the final 1.75-second hold     |
| `showHook`      | `true`, `false`, `1`, `0`     | `false`  | Adds the 0.75-second completed-network hook  |
| `pacing`        | `linear`, `activity`          | `linear` | Chooses constant or activity-weighted pacing |
| `showSafeAreas` | `true`, `false`, `1`, `0`     | `false`  | Shows non-interactive Reel-safe guides       |
| `showDebug`     | `true`, `false`, `1`, `0`     | `false`  | Shows render and recording diagnostics       |

The recording route has no hover UI, scrollbars, or development controls. Completed routes remain at low opacity so the full daily network accumulates over time. Its fixed design canvas scales uniformly for previews and reserves Reel-safe equivalents of 90 px left, 150 px right, 120 px top, and 280 px bottom at 1080 × 1920.

## Data architecture

The browser never parses large source CSV files. It reads a small manifest plus one preprocessed JSON file for the selected airport and date. Production hosting uses only a minimal static-asset worker entry; there is no application backend or runtime data processing.

```text
public/data/manifest.json
public/data/ATL/mock.json
public/data/ATL/2026-05-15.json
public/data/DTW/mock.json
public/data/DTW/2026-05-15.json
```

Each flight stores elapsed minutes from the start of the selected airport’s day and a timestamped, approximately 48-point great-circle path. Flights crossing midnight may have a negative `startMinute` or an `endMinute` above 1440 and are retained when any part overlaps the selected day.

Each dataset also includes provenance metadata:

```ts
type DatasetKind = "mock" | "representative" | "historical";

interface DatasetMetadata {
  kind: DatasetKind;
  airportCode: string;
  date?: string;
  coverage?: "domestic" | "international" | "all-reported";
  sourceName?: string;
  sourceUrl?: string;
  routesAreCalculated: boolean;
  isCompleteDataset?: boolean;
}
```

Recording titles, final summaries, and the selectable social-caption disclosure in the interactive view are generated from this metadata. “Every domestic flight” is only permitted for historical domestic data whose `isCompleteDataset` value is explicitly `true`; mock and representative datasets never make that claim.

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
  --date 2026-05-15 \
  --timezone America/New_York
```

The script writes `public/data/ATL/2026-05-15.json` and safely adds or updates the corresponding manifest entry. Existing airports and dates are preserved. Field aliases are isolated in `src/lib/preprocess.ts`, so a differently named source export can be supported by editing one mapping.

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

For real data:

1. Ensure the selected airport and destinations exist in the airports CSV.
2. Run the preprocessing command with the new airport code, date, and IANA timezone.
3. Reload the app; preprocessing updates the manifest and selectors automatically.

For a deterministic mock airport:

1. Add its name, coordinates, and timezone to `scripts/airports.ts`.
2. Generate its dataset:

```bash
npm run generate:mock -- --airport DTW --date 2026-05-15 --count 240
```

The generator creates both `mock.json` and the dated JSON file, then merges the airport into the manifest without removing other entries. Add `--default true` to make it the default airport. The UI, recording link, headings, airport code, and dataset selectors are derived from the manifest and processed data.

## Recording at 1080 × 1920

### Browser recording

1. Open `/recording?airport=DTW&date=mock&speed=60&autoplay=false&showHook=true&pacing=linear`.
2. Set the browser viewport to exactly 1080 × 1920.
3. Hide browser chrome if possible.
4. Change `autoplay=false` to `autoplay=true` or reload a URL without that parameter.
5. Record at 60 frames per second when supported.

At 60 simulated minutes per real second, the complete day takes approximately 24 seconds. The canvas uses the correct 9:16 aspect ratio and scales down proportionally for previews.

For automated capture, Playwright can be added separately to open the recording route at 1080 × 1920 and capture video. It is intentionally not a core dependency.

## GitHub Pages

The Vite configuration automatically uses the repository name as its base path when it builds inside GitHub Actions. Publish the `dist/` directory with the standard Vite GitHub Pages workflow. The production build also emits `404.html`, allowing direct visits to the `/recording` route on project Pages sites.

## Testing

Unit tests cover provenance-gated copy, disclosure text, query validation, clock formatting, midnight crossings, arrival/departure/airborne counts, pacing, recording phases and loop resets, time derivation, great-circle generation, interpolation, and source-record filtering. The fixed mock seed makes generated output reproducible.

## Performance notes

The app gives deck.gl timestamped routes that are already calculated in JSON. `TripsLayer` animates trails on the GPU. React maintains one shared simulation clock rather than per-flight state, and completed-route data is updated in five-minute buckets. The design target is 2,500 daily flights, 500 simultaneously active flights, and 40–60 points per route.

## Accessibility

All interactive controls have accessible labels and keyboard behavior. Statistics use high-contrast text, the loaded dataset is summarized for screen readers, and the interactive view starts paused when `prefers-reduced-motion` is enabled.

## Important limitation

Routes are calculated great-circle arcs between airport coordinates. They are not literal radar-recorded aircraft tracks and do not show real airways, weather deviations, holding patterns, or air-traffic-control vectors. The bundled flight schedule is deterministic mock data designed to demonstrate the product before external data is supplied.

## Data attribution

The production preprocessing workflow is designed for US Bureau of Transportation Statistics flight records and OurAirports airport metadata. The dark basemap uses OpenStreetMap contributors and CARTO tiles. Consult each source’s current terms before republishing derived data.
