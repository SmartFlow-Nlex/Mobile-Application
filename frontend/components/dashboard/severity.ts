import type { ThemePalette } from '../../theme';
import { CongestionLevel } from '../../lib/trafficModel';

export interface SeverityTone {
  /** Solid colour for bars, dots and icons. */
  solid: string;
  /** Tinted background for pills. */
  background: string;
  /** Readable text colour on `background`. */
  text: string;
}

/**
 * Congestion level -> pill colours, resolved against the active palette.
 *
 * This is a function rather than a constant because the light theme's pastel
 * pill backgrounds are far too bright on the dark page; each theme supplies its
 * own tint and text pair.
 */
export function toneFor(level: CongestionLevel, c: ThemePalette): SeverityTone {
  switch (level) {
    case 'low':
      return {
        solid: c.statusSmoothSolid,
        background: c.statusSmoothBg,
        text: c.statusSmoothText,
      };
    case 'moderate':
      return {
        solid: c.statusModerateSolid,
        background: c.statusModerateBg,
        text: c.statusModerateText,
      };
    case 'high':
      return {
        solid: c.statusHighSolid,
        background: c.statusHighBg,
        text: c.statusHighText,
      };
    case 'severe':
    default:
      return {
        solid: c.statusHeavySolid,
        background: c.statusHeavyBg,
        text: c.statusHeavyText,
      };
  }
}
