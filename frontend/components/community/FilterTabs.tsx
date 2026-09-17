import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActiveCommunityTab } from '@smartflow/shared';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';

export interface FilterTabsProps {
  activeTab: ActiveCommunityTab;
  onTabChange: (tab: ActiveCommunityTab) => void;
}

/** One entry per tab, so the id, label and icon are each written once. */
const tabs: {
  id: ActiveCommunityTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'community', label: 'Community Updates', icon: 'people-outline' },
  { id: 'incidents', label: 'Recent Incidents', icon: 'warning-outline' },
];

const FilterTabs: React.FC<FilterTabsProps> = ({ activeTab, onTabChange }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            // Without the role and state a screen reader reads these as two
            // stray labels: nothing says they are tabs, or which one you are
            // already on.
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onTabChange(tab.id)}
            style={[styles.tab, selected && styles.tabActive]}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={selected ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default FilterTabs;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: c.surfaceMuted,
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  tabActive: {
    backgroundColor: c.surface,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabLabel: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: c.accent,
    fontWeight: Typography.fontWeight.bold,
  },
});
