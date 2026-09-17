/**
 * Seed data for the dashboard's event forecasts and ML hotspots.
 *
 * Event dates are expressed as an offset from "now" rather than fixed
 * calendar dates, so the Event-Triggered Forecasts section always shows
 * genuinely upcoming events instead of drifting into the past.
 */

import { CongestionLevel } from '../lib/trafficModel';

export interface EventForecastSeed {
  id: string;
  title: string;
  venue: string;
  /** Days from today the event takes place. */
  inDays: number;
  /** 24-hour start time. */
  startHour: number;
  severity: CongestionLevel;
  expectedAttendance: number;
  /** Exit ids from nlexSegments that the event loads. */
  affectedExitIds: string[];
}

export interface HotspotSeed {
  id: string;
  name: string;
  description: string;
  tag: string;
  tone: 'critical' | 'warning' | 'caution';
  incidents30Days: number;
  averageResponseMinutes: number;
  /** Exit ids the hotspot sits between, used to link it to a segment. */
  exitIds: string[];
}

export const eventForecasts: EventForecastSeed[] = [
  {
    id: 'evt-arena-concert',
    title: 'Concert at Philippine Arena',
    venue: 'Philippine Arena',
    inDays: 2,
    startHour: 19,
    severity: 'severe',
    expectedAttendance: 45000,
    affectedExitIds: ['cdv-ph-arena', 'bocaue-interchange', 'bocaue-barrier', 'marilao'],
  },
  {
    id: 'evt-basketball-finals',
    title: 'Basketball Championship Finals',
    venue: 'Smart Araneta Coliseum',
    inDays: 1,
    startHour: 18,
    severity: 'high',
    expectedAttendance: 20000,
    affectedExitIds: ['balintawak', 'harbor-link'],
  },
  {
    id: 'evt-clark-festival',
    title: 'Festival at Clark Parade Grounds',
    venue: 'Clark Parade Grounds',
    inDays: 3,
    startHour: 10,
    severity: 'moderate',
    expectedAttendance: 15000,
    affectedExitIds: ['angeles', 'dau', 'sctex'],
  },
];

export const mlHotspots: HotspotSeed[] = [
  {
    id: 'hot-bocaue',
    name: 'Bocaue Exit Area',
    description: 'Frequent accidents due to merging traffic',
    tag: 'High-Risk',
    tone: 'critical',
    incidents30Days: 47,
    averageResponseMinutes: 12,
    exitIds: ['bocaue-interchange', 'bocaue-barrier'],
  },
  {
    id: 'hot-marilao-meycauayan',
    name: 'Marilao - Meycauayan Stretch',
    description: 'Sharp curves and heavy truck traffic',
    tag: 'Accident-Prone',
    tone: 'warning',
    incidents30Days: 34,
    averageResponseMinutes: 15,
    exitIds: ['marilao', 'meycauayan'],
  },
  {
    id: 'hot-balintawak',
    name: 'Balintawak Entry',
    description: 'Increased traffic volume from Metro Manila',
    tag: 'Emerging Bottleneck',
    tone: 'caution',
    incidents30Days: 28,
    averageResponseMinutes: 8,
    exitIds: ['balintawak', 'harbor-link'],
  },
];

/** Resolve a seed's `inDays` / `startHour` into a concrete Date. */
/**
 * Worst hotspot first, then the busiest.
 *
 * Shared by the dashboard preview and the full Insights list so the top three
 * on the dashboard are genuinely the top three of the whole set, rather than
 * whichever three happened to be declared first.
 */
const hotspotToneRank: Record<HotspotSeed['tone'], number> = {
  critical: 0,
  warning: 1,
  caution: 2,
};

export function compareHotspots(a: HotspotSeed, b: HotspotSeed): number {
  const byTone = hotspotToneRank[a.tone] - hotspotToneRank[b.tone];
  return byTone !== 0 ? byTone : b.incidents30Days - a.incidents30Days;
}

export function eventDate(seed: EventForecastSeed, now: Date): Date {
  const date = new Date(now);
  date.setDate(date.getDate() + seed.inDays);
  date.setHours(seed.startHour, 0, 0, 0);
  return date;
}

const severityLoad: Record<CongestionLevel, number> = {
  low: 0.05,
  moderate: 0.1,
  high: 0.16,
  severe: 0.24,
};

/**
 * Extra demand an event puts on a stretch of road at `at`.
 *
 * Load ramps up in the three hours before the event (arrivals) and decays over
 * the two hours after it ends, and only applies when the event's affected
 * exits overlap the selected segment.
 */
export function eventLoadForSegment(
  segmentExitIds: string[],
  at: Date,
  now: Date,
): { load: number; source: EventForecastSeed | null } {
  let load = 0;
  let source: EventForecastSeed | null = null;

  eventForecasts.forEach((seed) => {
    const overlaps = seed.affectedExitIds.some((id) => segmentExitIds.includes(id));
    if (!overlaps) {
      return;
    }
    const start = eventDate(seed, now).getTime();
    const hoursFromStart = (at.getTime() - start) / 3600000;
    // Arrivals build from 3h before; dispersal tails off 2h after.
    if (hoursFromStart < -3 || hoursFromStart > 4) {
      return;
    }
    const proximity =
      hoursFromStart <= 0
        ? 1 - Math.abs(hoursFromStart) / 3
        : Math.max(0, 1 - hoursFromStart / 4);
    const contribution = severityLoad[seed.severity] * proximity;
    if (contribution > load) {
      load = contribution;
      source = seed;
    }
  });

  return { load, source };
}
