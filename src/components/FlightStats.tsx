import { formatClock } from "../lib/time";
import type { FlightDayDataset, FlightStats } from "../types/flights";

export function FlightStatsPanel({
  dataset,
  stats,
  currentMinute,
}: {
  dataset: FlightDayDataset;
  stats: FlightStats;
  currentMinute: number;
}) {
  return (
    <section className="stats-grid" aria-label="Flight statistics">
      <div className="stat stat-primary">
        <span>Local time</span>
        <strong>{formatClock(currentMinute)}</strong>
      </div>
      <div className="stat">
        <span>Airborne now</span>
        <strong>{stats.active}</strong>
      </div>
      <div className="stat">
        <span>Arrivals</span>
        <strong>{dataset.totalArrivals}</strong>
        <small>{stats.completedArrivals} complete</small>
      </div>
      <div className="stat">
        <span>Departures</span>
        <strong>{dataset.totalDepartures}</strong>
        <small>{stats.completedDepartures} complete</small>
      </div>
      <div className="stat">
        <span>Total flights</span>
        <strong>{dataset.totalFlights}</strong>
      </div>
    </section>
  );
}
