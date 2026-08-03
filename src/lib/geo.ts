import type { Coordinate, FlightPathPoint } from "../types/flights";

const EARTH_RADIUS_MILES = 3958.8;

const toRad = (degrees: number) => (degrees * Math.PI) / 180;
const toDeg = (radians: number) => (radians * 180) / Math.PI;

export function distanceMiles(a: Coordinate, b: Coordinate): number {
  const [lon1, lat1] = a.map(toRad);
  const [lon2, lat2] = b.map(toRad);
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function greatCirclePath(
  start: Coordinate,
  end: Coordinate,
  startMinute: number,
  endMinute: number,
  pointCount = 48,
): FlightPathPoint[] {
  const [lon1, lat1] = start.map(toRad);
  const [lon2, lat2] = end.map(toRad);
  const p1 = [
    Math.cos(lat1) * Math.cos(lon1),
    Math.cos(lat1) * Math.sin(lon1),
    Math.sin(lat1),
  ];
  const p2 = [
    Math.cos(lat2) * Math.cos(lon2),
    Math.cos(lat2) * Math.sin(lon2),
    Math.sin(lat2),
  ];
  const omega = Math.acos(
    Math.max(-1, Math.min(1, p1[0] * p2[0] + p1[1] * p2[1] + p1[2] * p2[2])),
  );

  return Array.from({ length: pointCount }, (_, index) => {
    const t = index / (pointCount - 1);
    let vector: number[];
    if (omega < 1e-8) {
      vector = p1;
    } else {
      const sinOmega = Math.sin(omega);
      const a = Math.sin((1 - t) * omega) / sinOmega;
      const b = Math.sin(t * omega) / sinOmega;
      vector = [
        a * p1[0] + b * p2[0],
        a * p1[1] + b * p2[1],
        a * p1[2] + b * p2[2],
      ];
    }
    const longitude = toDeg(Math.atan2(vector[1], vector[0]));
    const latitude = toDeg(
      Math.atan2(vector[2], Math.hypot(vector[0], vector[1])),
    );
    return {
      coordinate: [longitude, latitude],
      timestamp: startMinute + t * (endMinute - startMinute),
    };
  });
}

export function interpolatePosition(
  path: FlightPathPoint[],
  minute: number,
): Coordinate {
  if (!path.length) return [0, 0];
  if (minute <= path[0].timestamp) return path[0].coordinate;
  if (minute >= path[path.length - 1].timestamp)
    return path[path.length - 1].coordinate;
  for (let index = 1; index < path.length; index += 1) {
    const point = path[index];
    if (point.timestamp >= minute) {
      const previous = path[index - 1];
      const progress =
        (minute - previous.timestamp) / (point.timestamp - previous.timestamp);
      return [
        previous.coordinate[0] +
          (point.coordinate[0] - previous.coordinate[0]) * progress,
        previous.coordinate[1] +
          (point.coordinate[1] - previous.coordinate[1]) * progress,
      ];
    }
  }
  return path[path.length - 1].coordinate;
}
