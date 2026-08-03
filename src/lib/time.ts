export function parseHHMM(
  value: string | number | undefined | null,
): number | null {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).trim().padStart(4, "0");
  if (!/^\d{4}$/.test(raw)) return null;
  const hours = Number(raw.slice(0, 2));
  const minutes = Number(raw.slice(2));
  if (hours === 24 && minutes === 0) return 1440;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function resolveFlightTimes(args: {
  direction: "arrival" | "departure";
  actualDeparture?: string | number | null;
  scheduledDeparture?: string | number | null;
  actualArrival?: string | number | null;
  scheduledArrival?: string | number | null;
  actualElapsed?: string | number | null;
  scheduledElapsed?: string | number | null;
}): { startMinute: number; endMinute: number } | null {
  const duration = Number(args.actualElapsed || args.scheduledElapsed);
  if (!Number.isFinite(duration) || duration <= 0) return null;

  if (args.direction === "departure") {
    const actual = parseHHMM(args.actualDeparture);
    const start = actual ?? parseHHMM(args.scheduledDeparture);
    if (start === null) return null;
    return { startMinute: start, endMinute: start + duration };
  }

  const actual = parseHHMM(args.actualArrival);
  const end = actual ?? parseHHMM(args.scheduledArrival);
  if (end === null) return null;
  let start = end - duration;
  if (start > end) start -= 1440;
  return { startMinute: start, endMinute: end };
}

export function formatClock(minute: number): string {
  const wrapped = ((Math.floor(minute) % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${period}`;
}

export function formatDateLabel(value: string): string {
  if (value === "mock") return "Representative day";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
