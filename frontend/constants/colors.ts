/**
 * Legacy colour entry point.
 *
 * `Colors` is the LIGHT palette and is fixed at import time, so anything that
 * reads it cannot follow the dark-mode setting. New code should call
 * `useTheme()` / `useThemedStyles()` from `../theme` instead.
 */
import { lightPalette } from '../theme/palette';

export const Colors = lightPalette;
