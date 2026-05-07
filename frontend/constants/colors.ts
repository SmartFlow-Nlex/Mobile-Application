/**
 * Color Constants for SmartFlow NLEX
 * All colors used throughout the app
 */

export const Colors = {
  // Primary Colors (Blue theme matching image)
  primary: '#2563EB',
  primaryLight: '#60A5FA',
  primaryDark: '#1D4ED8',

  // Status Colors
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  error: '#FF3B30',

  // Neutral Colors
  background: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceLight: '#EEF2FF',
  border: '#D9E2F2',
  borderLight: '#C7D2FE',

  // Text Colors
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Traffic Condition Colors
  trafficNormal: '#34C759',
  trafficCongested: '#FF9500',
  trafficAccident: '#FF3B30',
  trafficConstruction: '#FFB81C',

  // Alert Severity Colors
  severityLow: '#34C759',
  severityMedium: '#FF9500',
  severityHigh: '#FF3B30',

  // Community Colors
  communityBlue: '#1565C0',
  dangerRed: '#E53E3E',
  statusSmoothBg: '#D1FAE5',
  statusSmoothText: '#065F46',
  statusHeavyBg: '#FEE2E2',
  statusHeavyText: '#991B1B',
  statusModerateBg: '#FEF3C7',
  statusModerateText: '#92400E',
} as const;
