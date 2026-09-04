/**
 * Canonical NLEX exit list for SmartFlow.
 *
 * Ordered north -> south (Sta. Ines is the northern terminus, Balintawak the
 * southern one). `km` is the distance in kilometres measured from Balintawak,
 * which lets us derive segment length, travel time and delay for any pair.
 */

export type NlexDirectionId = 'northbound' | 'southbound';

export interface NlexDirection {
  id: NlexDirectionId;
  label: string;
  /** Short hint shown under the picker, e.g. "Balintawak -> Sta. Ines". */
  hint: string;
}

export interface NlexExitPoint {
  id: string;
  name: string;
  city: string;
  /** Kilometres from Balintawak. Higher = further north. */
  km: number;
  /** Toll barriers add plaza friction on top of mainline congestion. */
  isBarrier?: boolean;
}

/** North -> south, exactly the exit set SmartFlow forecasts on. */
export const nlexExitPoints: NlexExitPoint[] = [
  { id: 'sta-ines', name: 'Sta. Ines', city: 'Mabalacat', km: 86 },
  { id: 'sctex', name: 'SCTEX', city: 'Mabalacat', km: 83 },
  { id: 'dau', name: 'Dau', city: 'Mabalacat', km: 80 },
  { id: 'angeles', name: 'Angeles', city: 'Angeles City', km: 74 },
  { id: 'mexico', name: 'Mexico', city: 'Mexico', km: 67 },
  { id: 'san-fernando', name: 'San Fernando', city: 'San Fernando', km: 60 },
  { id: 'san-simon', name: 'San Simon', city: 'San Simon', km: 52 },
  { id: 'pulilan', name: 'Pulilan', city: 'Pulilan', km: 44 },
  { id: 'sta-rita', name: 'Sta. Rita', city: 'Guiguinto', km: 37 },
  { id: 'balagtas', name: 'Balagtas', city: 'Balagtas', km: 34 },
  { id: 'tabang', name: 'Tabang', city: 'Guiguinto', km: 31 },
  { id: 'tambubong', name: 'Tambubong', city: 'Bocaue', km: 28 },
  { id: 'bocaue-interchange', name: 'Bocaue Interchange', city: 'Bocaue', km: 25 },
  { id: 'bocaue-barrier', name: 'Bocaue Barrier', city: 'Bocaue', km: 24, isBarrier: true },
  { id: 'cdv-ph-arena', name: 'CDV / Ph. Arena', city: 'Bocaue', km: 22 },
  { id: 'marilao', name: 'Marilao', city: 'Marilao', km: 18 },
  { id: 'meycauayan', name: 'Meycauayan', city: 'Meycauayan', km: 14 },
  { id: 'paso-de-blas', name: 'Paso de Blas', city: 'Valenzuela', km: 7 },
  { id: 'harbor-link', name: 'NLEX Harbor Link', city: 'Valenzuela', km: 5 },
  { id: 'balintawak', name: 'Balintawak', city: 'Quezon City', km: 0 },
];

export const nlexDirections: NlexDirection[] = [
  { id: 'northbound', label: 'Northbound', hint: 'Balintawak to Sta. Ines' },
  { id: 'southbound', label: 'Southbound', hint: 'Sta. Ines to Balintawak' },
];

const exitsById: Record<string, NlexExitPoint> = nlexExitPoints.reduce<Record<string, NlexExitPoint>>(
  (acc, exit) => {
    acc[exit.id] = exit;
    return acc;
  },
  {},
);

export function getExit(id: string | null): NlexExitPoint | null {
  if (id === null) {
    return null;
  }
  return exitsById[id] ?? null;
}

export function getDirection(id: NlexDirectionId): NlexDirection {
  // nlexDirections always contains both ids, so this cannot be undefined.
  return nlexDirections.find((item) => item.id === id) as NlexDirection;
}

/**
 * Exits ordered along the direction of travel: southbound runs from the
 * northern end down to Balintawak, northbound is the reverse.
 */
export function exitsInTravelOrder(direction: NlexDirectionId): NlexExitPoint[] {
  return direction === 'southbound'
    ? [...nlexExitPoints]
    : [...nlexExitPoints].reverse();
}

/** Every exit the driver can still reach after passing `fromId`. */
export function reachableExits(direction: NlexDirectionId, fromId: string | null): NlexExitPoint[] {
  const ordered = exitsInTravelOrder(direction);
  if (fromId === null) {
    return ordered;
  }
  const fromIndex = ordered.findIndex((exit) => exit.id === fromId);
  if (fromIndex < 0) {
    return ordered;
  }
  return ordered.slice(fromIndex + 1);
}

/** True when `toId` sits downstream of `fromId` for the given direction. */
export function isValidPair(
  direction: NlexDirectionId,
  fromId: string | null,
  toId: string | null,
): boolean {
  if (fromId === null || toId === null || fromId === toId) {
    return false;
  }
  return reachableExits(direction, fromId).some((exit) => exit.id === toId);
}

/** Exits strictly between `from` and `to`, in travel order. */
export function exitsBetween(
  direction: NlexDirectionId,
  fromId: string,
  toId: string,
): NlexExitPoint[] {
  const ordered = exitsInTravelOrder(direction);
  const fromIndex = ordered.findIndex((exit) => exit.id === fromId);
  const toIndex = ordered.findIndex((exit) => exit.id === toId);
  if (fromIndex < 0 || toIndex < 0 || toIndex <= fromIndex) {
    return [];
  }
  return ordered.slice(fromIndex + 1, toIndex);
}

export function distanceKm(fromId: string, toId: string): number {
  const from = getExit(fromId);
  const to = getExit(toId);
  if (from === null || to === null) {
    return 0;
  }
  return Math.abs(from.km - to.km);
}
