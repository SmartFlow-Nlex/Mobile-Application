/**
 * SmartFlow on-device traffic prediction model.
 *
 * Everything here is a pure function of (segment, direction, timestamp), so the
 * same inputs always render the same forecast - the UI never flickers between
 * frames, but the numbers do move as the clock advances or the user shifts the
 * forecast horizon. When the backend forecast service comes online these
 * functions are the seam to replace: same inputs, same output shape.
 */

import {
  NlexDirectionId,
  distanceKm,
  exitsBetween,
  getExit,
  nlexExitPoints,
} from '../constants/nlexSegments';

export type CongestionLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface SegmentPrediction {
  probability: number; // 0-100
  level: CongestionLevel;
  delayMinutes: number;
  travelMinutes: number;
  freeFlowMinutes: number;
  distanceKm: number;
  averageSpeedKph: number;
  /** Human-readable driver of the forecast, e.g. "Evening peak outbound". */
  primaryDriver: string;
}

export interface NetworkStatus {
  activeIncidents: number;
  averageDelayMinutes: number;
  level: CongestionLevel;
  busiestSegment: string;
}

/** Free-flow speed used as the baseline for delay maths (km/h). */
const FREE_FLOW_KPH = 90;

// ---------------------------------------------------------------------------
// Deterministic noise
// ---------------------------------------------------------------------------

/** Small stable hash so variation is reproducible for a given key. */
function hashUnit(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 100000) / 100000;
}

/**
 * Gaussian bump over a 24-hour clock. The distance is measured the short way
 * around midnight, so 23:00 sits 3.5h from a 02:30 centre rather than 20.5h.
 */
function gaussian(hour: number, center: number, width: number): number {
  const delta = (((hour - center) % 24) + 36) % 24 - 12;
  return Math.exp(-(delta * delta) / (2 * width * width));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dayKey(at: Date): string {
  return `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`;
}

// ---------------------------------------------------------------------------
// Model terms
// ---------------------------------------------------------------------------

/**
 * Baseline demand by location. Volume is heaviest close to Metro Manila and
 * thins out towards Clark, so load decays with distance from Balintawak.
 */
function baseLoad(midpointKm: number): number {
  return 0.16 + 0.36 * Math.exp(-midpointKm / 38);
}

/**
 * Commuter tide. Weekday mornings load the southbound carriageway (inbound to
 * Manila) and weekday evenings load the northbound one (outbound). Weekends
 * flip to a leisure pattern that returns south late in the day.
 */
function peakFactor(hour: number, direction: NlexDirectionId, day: number): number {
  const isWeekend = day === 0 || day === 6;
  const inbound = direction === 'southbound';

  if (isWeekend) {
    const outboundMorning = gaussian(hour, 8.5, 2.1) * (inbound ? 0.1 : 0.26);
    const returnEvening = gaussian(hour, 18, 2.4) * (inbound ? 0.3 : 0.12);
    return outboundMorning + returnEvening;
  }

  const morning = gaussian(hour, 7.5, 1.7) * (inbound ? 0.34 : 0.12);
  const evening = gaussian(hour, 18.5, 2) * (inbound ? 0.13 : 0.36);
  // Friday evenings run heavier in both directions.
  const fridayBoost = day === 5 ? gaussian(hour, 19, 2.6) * 0.09 : 0;
  return morning + evening + fridayBoost;
}

/** Overnight lull: 11pm-4am the expressway is effectively empty. */
function nightRelief(hour: number): number {
  return gaussian(hour, 2.5, 2.6) * 0.22;
}

/** Toll plazas and closely spaced merges add friction independent of speed. */
function frictionMinutes(
  direction: NlexDirectionId,
  fromId: string,
  toId: string,
  ratio: number,
): number {
  const between = exitsBetween(direction, fromId, toId);
  const barriers = between.filter((exit) => exit.isBarrier === true).length;
  const merges = between.length - barriers;
  return merges * 0.4 * ratio + barriers * 1.6 * ratio;
}

/** Single source of truth for the probability -> level thresholds. */
export function levelFor(probability: number): CongestionLevel {
  if (probability >= 85) {
    return 'severe';
  }
  if (probability >= 70) {
    return 'high';
  }
  if (probability >= 50) {
    return 'moderate';
  }
  return 'low';
}

function describeDriver(
  hour: number,
  direction: NlexDirectionId,
  day: number,
  probability: number,
): string {
  const isWeekend = day === 0 || day === 6;
  if (probability < 35) {
    return hour >= 22 || hour <= 4 ? 'Overnight free flow' : 'Light steady volume';
  }
  if (isWeekend) {
    return hour >= 15 ? 'Weekend return traffic' : 'Weekend outbound volume';
  }
  if (hour >= 5 && hour <= 10) {
    return direction === 'southbound' ? 'Morning peak inbound' : 'Counterflow morning volume';
  }
  if (hour >= 15 && hour <= 21) {
    return direction === 'northbound' ? 'Evening peak outbound' : 'Counterflow evening volume';
  }
  if (hour >= 22 || hour <= 4) {
    return 'Late night volume';
  }
  return 'Sustained midday volume';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Raw congestion ratio (0-1) for a stretch of mainline at a given time.
 * `eventLoad` is the extra demand contributed by nearby scheduled events.
 */
function congestionRatio(
  direction: NlexDirectionId,
  fromKm: number,
  toKm: number,
  at: Date,
  eventLoad: number,
  seed: string,
): number {
  const midpoint = (fromKm + toKm) / 2;
  const hour = at.getHours() + at.getMinutes() / 60;
  const day = at.getDay();
  const jitter = hashUnit(`${seed}|${dayKey(at)}|${at.getHours()}`) - 0.5;

  const raw =
    baseLoad(midpoint) +
    peakFactor(hour, direction, day) +
    eventLoad -
    nightRelief(hour) +
    jitter * 0.09;

  return clamp(raw, 0.04, 0.97);
}

export interface PredictSegmentInput {
  direction: NlexDirectionId;
  fromId: string;
  toId: string;
  at: Date;
  /** Extra demand from event forecasts touching this stretch, 0-1. */
  eventLoad?: number;
}

const emptyPrediction: SegmentPrediction = {
  probability: 0,
  level: 'low',
  delayMinutes: 0,
  travelMinutes: 0,
  freeFlowMinutes: 0,
  distanceKm: 0,
  averageSpeedKph: FREE_FLOW_KPH,
  primaryDriver: 'No segment selected',
};

export function predictSegment(input: PredictSegmentInput): SegmentPrediction {
  const { direction, fromId, toId, at } = input;
  const eventLoad = input.eventLoad ?? 0;

  const from = getExit(fromId);
  const to = getExit(toId);
  const distance = distanceKm(fromId, toId);

  if (from === null || to === null || distance === 0) {
    return emptyPrediction;
  }

  const ratio = congestionRatio(
    direction,
    from.km,
    to.km,
    at,
    eventLoad,
    `${direction}:${fromId}>${toId}`,
  );
  const probability = Math.round(ratio * 100);

  // Speed decays super-linearly once demand approaches capacity.
  const speedRetention = 1 - 0.62 * Math.pow(ratio, 1.6);
  const averageSpeedKph = FREE_FLOW_KPH * speedRetention;

  const freeFlowMinutes = (distance / FREE_FLOW_KPH) * 60;
  const mainlineMinutes = (distance / averageSpeedKph) * 60;
  const travelMinutes = mainlineMinutes + frictionMinutes(direction, fromId, toId, ratio);

  return {
    probability,
    level: levelFor(probability),
    delayMinutes: Math.max(0, Math.round(travelMinutes - freeFlowMinutes)),
    travelMinutes: Math.max(1, Math.round(travelMinutes)),
    freeFlowMinutes: Math.round(freeFlowMinutes),
    distanceKm: distance,
    averageSpeedKph: Math.round(averageSpeedKph),
    primaryDriver: describeDriver(at.getHours(), direction, at.getDay(), probability),
  };
}

/**
 * Roll the per-segment model up into the headline numbers on the status card:
 * how many incidents are live right now, and the delay an average trip carries
 * across the corridor.
 */
export function predictNetwork(at: Date): NetworkStatus {
  const directions: NlexDirectionId[] = ['northbound', 'southbound'];
  let delayTotal = 0;
  let samples = 0;
  let worstProbability = 0;
  let worstLabel = '';

  directions.forEach((direction) => {
    for (let index = 0; index < nlexExitPoints.length - 1; index += 1) {
      const north = nlexExitPoints[index];
      const south = nlexExitPoints[index + 1];
      if (north === undefined || south === undefined) {
        continue;
      }
      const southbound = direction === 'southbound';
      const prediction = predictSegment({
        direction,
        fromId: southbound ? north.id : south.id,
        toId: southbound ? south.id : north.id,
        at,
      });
      delayTotal += prediction.delayMinutes;
      samples += 1;
      if (prediction.probability > worstProbability) {
        worstProbability = prediction.probability;
        worstLabel = `${north.name} - ${south.name}`;
      }
    }
  });

  // An average trip spans roughly seven consecutive exit-to-exit segments.
  const averageDelayMinutes = samples === 0 ? 0 : Math.round((delayTotal / samples) * 7);

  // Incidents clear over time, so bucket the clock into 5-minute windows: the
  // count holds steady inside a window and can change when the window turns.
  const bucket = Math.floor(at.getMinutes() / 5);
  const incidentSeed = hashUnit(`incidents|${dayKey(at)}|${at.getHours()}|${bucket}`);
  const hour = at.getHours();
  const peakPressure = hour >= 6 && hour <= 21 ? 1 : 0.35;
  const activeIncidents = Math.round(incidentSeed * 4 * peakPressure + (worstProbability >= 70 ? 1 : 0));

  return {
    activeIncidents,
    averageDelayMinutes,
    level: levelFor(worstProbability),
    busiestSegment: worstLabel,
  };
}

/** Corridor-wide congestion probability, used by the Today / This Week strips. */
export function corridorProbability(direction: NlexDirectionId, at: Date): number {
  const ratio = congestionRatio(direction, 0, 40, at, 0, `corridor:${direction}`);
  return Math.round(ratio * 100);
}

export const congestionLevelLabel: Record<CongestionLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  severe: 'Severe',
};
