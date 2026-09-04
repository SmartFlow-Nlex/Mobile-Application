/**
 * Light and dark palettes for SmartFlow NLEX.
 *
 * Every colour the UI can render lives here. Components must never hardcode a
 * hex value: a literal that looks fine on white becomes unreadable on the dark
 * background, and the two palettes below are the only place that contract is
 * enforced.
 *
 * Tokens are named by ROLE, not by appearance - `surfaceMuted` is a slightly
 * recessed panel in both themes, even though it is near-white in one and
 * near-black in the other.
 */

export interface ThemePalette {
  // Brand
  /** Brand surface: header bar, hero card, FAB, active pills. */
  primary: string;
  /** Lighter brand tone for accent borders and highlights. */
  primaryLight: string;
  /** Pressed state for brand surfaces. */
  primaryDark: string;
  /** Tinted background for brand chips and selected rows. */
  primarySoft: string;
  /** Border that pairs with `primarySoft`. */
  primarySoftBorder: string;
  /** Shadow cast by brand surfaces. */
  primaryShadow: string;
  /**
   * Brand colour for FOREGROUND use - text and icons sitting on the page or a
   * card. Must contrast with `background`/`surface`, which is why it inverts
   * between themes while `primary` stays a surface colour.
   */
  accent: string;

  // Status
  success: string;
  warning: string;
  danger: string;
  error: string;

  // Neutral surfaces
  /** Page background. */
  background: string;
  /** Card background. */
  surface: string;
  /** Slightly tinted surface. */
  surfaceLight: string;
  /** Recessed panel: inactive chips, small pills. */
  surfaceMuted: string;
  /** Very subtle panel: empty states. */
  surfaceSubtle: string;
  /** Disabled control background. */
  surfaceDisabled: string;
  /** Input/field background. */
  field: string;
  /** Card background when highlighted as relevant. */
  surfaceHighlight: string;
  /** Row background while pressed. */
  pressed: string;

  // Lines
  border: string;
  borderLight: string;
  /** Hairline separators inside cards. */
  hairline: string;
  /** Shadow colour for neutral cards. */
  cardShadow: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** Text that sits on top of `primary`. */
  textInverse: string;

  // Traffic conditions
  trafficNormal: string;
  trafficCongested: string;
  trafficAccident: string;
  trafficConstruction: string;

  // Alert severity
  severityLow: string;
  severityMedium: string;
  severityHigh: string;

  // Congestion / status pills
  statusSmoothBg: string;
  statusSmoothText: string;
  statusSmoothSolid: string;
  statusModerateBg: string;
  statusModerateText: string;
  statusModerateSolid: string;
  statusHighBg: string;
  statusHighText: string;
  statusHighSolid: string;
  statusHeavyBg: string;
  statusHeavyText: string;
  statusHeavySolid: string;

  // Community
  communityBlue: string;
  dangerRed: string;
  /** Tinted background behind settings-row icons. */
  iconTint: string;
  /** Tinted background behind destructive icons. */
  iconTintDanger: string;

  // Chrome
  /** Track colour of the progress bar behind congestion fills. */
  track: string;
  /** Live indicator dot. */
  live: string;
  /** Translucent white used on brand surfaces (borders, inset panels). */
  onPrimarySoft: string;
  onPrimaryMuted: string;
}

export const lightPalette: ThemePalette = {
  primary: '#152A48',
  primaryLight: '#2F4E7E',
  primaryDark: '#0D1B30',
  primarySoft: '#EAEFF7',
  primarySoftBorder: '#CBD8EA',
  primaryShadow: '#0B1A2E',
  accent: '#152A48',

  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  error: '#FF3B30',

  background: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceLight: '#EAEFF7',
  surfaceMuted: '#F1F5F9',
  surfaceSubtle: '#F8FAFD',
  surfaceDisabled: '#F4F6FA',
  field: '#FBFCFE',
  surfaceHighlight: '#FCFDFF',
  pressed: '#F8FAFC',

  border: '#D9E2F2',
  borderLight: '#CBD8EA',
  hairline: '#EEF2F8',
  cardShadow: '#0F172A',

  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  trafficNormal: '#34C759',
  trafficCongested: '#FF9500',
  trafficAccident: '#FF3B30',
  trafficConstruction: '#FFB81C',

  severityLow: '#34C759',
  severityMedium: '#FF9500',
  severityHigh: '#FF3B30',

  statusSmoothBg: '#D1FAE5',
  statusSmoothText: '#065F46',
  statusSmoothSolid: '#16A34A',
  statusModerateBg: '#FEF3C7',
  statusModerateText: '#92400E',
  statusModerateSolid: '#F59E0B',
  statusHighBg: '#FFEDD5',
  statusHighText: '#9A3412',
  statusHighSolid: '#F97316',
  statusHeavyBg: '#FEE2E2',
  statusHeavyText: '#991B1B',
  statusHeavySolid: '#DC2626',

  communityBlue: '#1565C0',
  dangerRed: '#E53E3E',
  iconTint: '#EEF4FF',
  iconTintDanger: '#FEECEC',

  track: '#E8EDF6',
  live: '#4ADE80',
  onPrimarySoft: 'rgba(255,255,255,0.16)',
  onPrimaryMuted: 'rgba(255,255,255,0.75)',
};

export const darkPalette: ThemePalette = {
  // On a dark page the brand surface has to be LIGHTER than the background,
  // otherwise the header and hero card disappear into it.
  primary: '#2C4A78',
  primaryLight: '#5B85C4',
  primaryDark: '#1E3557',
  primarySoft: '#1C2E48',
  primarySoftBorder: '#2E4364',
  primaryShadow: '#000000',
  accent: '#7FA9E0',

  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#FF6B61',
  error: '#FF6B61',

  background: '#0B1524',
  surface: '#142234',
  surfaceLight: '#1C2E48',
  surfaceMuted: '#1B2A3D',
  surfaceSubtle: '#111E2F',
  surfaceDisabled: '#162233',
  field: '#16273C',
  surfaceHighlight: '#17293F',
  pressed: '#1B2A3D',

  border: '#253549',
  borderLight: '#2E4059',
  hairline: '#203044',
  cardShadow: '#000000',

  text: '#E9EFF7',
  textSecondary: '#9DAFC6',
  textTertiary: '#6C8098',
  textInverse: '#FFFFFF',

  trafficNormal: '#4ADE80',
  trafficCongested: '#FBBF24',
  trafficAccident: '#FF6B61',
  trafficConstruction: '#FCD34D',

  severityLow: '#4ADE80',
  severityMedium: '#FBBF24',
  severityHigh: '#FF6B61',

  // Pastel pills are blinding on a dark page: use deep tints with bright text.
  statusSmoothBg: '#10331F',
  statusSmoothText: '#6EE7A8',
  statusSmoothSolid: '#22C55E',
  statusModerateBg: '#37290D',
  statusModerateText: '#FCD34D',
  statusModerateSolid: '#F59E0B',
  statusHighBg: '#382012',
  statusHighText: '#FDBA74',
  statusHighSolid: '#F97316',
  statusHeavyBg: '#3A1717',
  statusHeavyText: '#FCA5A5',
  statusHeavySolid: '#EF4444',

  communityBlue: '#5B85C4',
  dangerRed: '#FF6B61',
  iconTint: '#1C2E48',
  iconTintDanger: '#3A1717',

  track: '#22344A',
  live: '#4ADE80',
  onPrimarySoft: 'rgba(255,255,255,0.14)',
  onPrimaryMuted: 'rgba(255,255,255,0.72)',
};
