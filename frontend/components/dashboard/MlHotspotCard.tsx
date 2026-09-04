import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import { HotspotSeed } from '../../constants/dashboardData';

export interface MlHotspotCardProps {
  hotspot: HotspotSeed;
}

/** Badge tints resolved from the palette so they invert with the theme. */
function toneStyles(
  tone: HotspotSeed['tone'],
  c: ThemePalette,
): { background: string; text: string } {
  switch (tone) {
    case 'critical':
      return { background: c.statusHeavyBg, text: c.statusHeavyText };
    case 'warning':
      return { background: c.statusHighBg, text: c.statusHighText };
    case 'caution':
    default:
      return { background: c.statusModerateBg, text: c.statusModerateText };
  }
}

const MlHotspotCard: React.FC<MlHotspotCardProps> = ({ hotspot }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const tone = toneStyles(hotspot.tone, colors);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.textGroup}>
          <Text style={styles.name}>{hotspot.name}</Text>
          <Text style={styles.description}>{hotspot.description}</Text>
        </View>

        <View style={[styles.tag, { backgroundColor: tone.background }]}>
          <Text style={[styles.tagText, { color: tone.text }]}>{hotspot.tag}</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Ionicons name="warning-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.statText}>{hotspot.incidents30Days} incidents (30 days)</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="timer-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.statText}>Avg response: {hotspot.averageResponseMinutes} min</Text>
        </View>
      </View>
    </View>
  );
};

export default MlHotspotCard;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  textGroup: {
    flex: 1,
  },
  name: {
    color: c.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    marginBottom: 4,
  },
  description: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    lineHeight: 18,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
});
