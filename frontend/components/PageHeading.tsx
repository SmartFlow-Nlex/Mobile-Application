import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../theme';
import type { ThemePalette } from '../theme';

/**
 * Which accent the icon tile wears. `ai` is the assistant's violet - the one
 * screen that deliberately steps outside the navy brand.
 */
export type PageHeadingTone = 'brand' | 'ai';

export interface PageHeadingProps {
  icon: keyof typeof Ionicons.glyphMap;
  /**
   * Rendered instead of the icon tile - the assistant passes its mascot,
   * which has to be a node rather than an image source because it animates
   * while the model is thinking.
   *
   * No tinted tile behind it: the mascot carries its own colour and outline,
   * and a violet plate behind an orange hard hat is two accents fighting in a
   * 38pt square.
   */
  mark?: React.ReactNode;
  title: string;
  subtitle: string;
  tone?: PageHeadingTone;
  /** Trailing control, e.g. a clear or refresh action. */
  action?: React.ReactNode;
  /**
   * Draws the divider under the block. Off for screens that follow it with a
   * card, where a line plus a card edge is one rule too many.
   */
  divider?: boolean;
}

/**
 * The "what screen am I on" block, directly under the brand bar.
 *
 * Exists because all four tabs that had one had built it by hand at a
 * different size - the title was 20pt on Map, 18pt on Community, 18pt on
 * Assistant and 31pt on Alerts, so moving between tabs made the app look like
 * four different apps. One component, one scale.
 */
const PageHeading: React.FC<PageHeadingProps> = ({
  icon,
  mark,
  title,
  subtitle,
  tone = 'brand',
  action,
  divider = true,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.wrap, divider && styles.wrapDivided]}>
      {mark !== undefined ? (
        mark
      ) : (
        <View style={[styles.iconTile, tone === 'ai' && styles.iconTileAi]}>
          <Ionicons name={icon} size={20} color={colors.textInverse} />
        </View>
      )}

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {action !== undefined ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
};

export default PageHeading;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: c.surface,
    },
    wrapDivided: {
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    iconTile: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    iconTileAi: {
      // On light this is a deep violet surface; on dark the token lifts to a
      // tint that still carries white glyphs.
      backgroundColor: c.ai,
    },
    text: {
      flex: 1,
    },
    title: {
      color: c.text,
      // One size for every page title in the app. Sits a clear step above the
      // 18pt section headings and well above 16pt card titles.
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
      marginTop: 3,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  });
