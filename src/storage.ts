import type { Point } from "./network";
const KEY = "neurones.points.v1";
export function parsePoints(raw: string): Point[] | null {
  try {
    const data = JSON.parse(raw);
    if (
      data.version !== 1 ||
      !Array.isArray(data.points) ||
      data.points.length > 10000
    )
      return null;
    const ids = new Set<string>();
    for (const p of data.points) {
      if (
        typeof p.id !== "string" ||
        ids.has(p.id) ||
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        Math.abs(p.x) > 3 ||
        Math.abs(p.y) > 3 ||
        (p.target !== 0 && p.target !== 1)
      )
        return null;
      ids.add(p.id);
    }
    return data.points;
  } catch {
    return null;
  }
}
export function loadPoints() {
  try {
    const raw = localStorage.getItem(KEY);
    return { points: raw ? parsePoints(raw) : null, error: false };
  } catch {
    return { points: null, error: true };
  }
}
export function savePoints(points: Point[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, points }));
    return true;
  } catch {
    return false;
  }
}
