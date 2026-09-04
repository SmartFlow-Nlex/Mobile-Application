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

const FilterTabs: React.FC<FilterTabsProps> = ({ activeTab, onTabChange }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onTabChange('community')}
        style={[styles.tab, activeTab === 'community' && styles.tabActive]}
      >
        <Ionicons
          name="people-outline"
          size={16}
          color={activeTab === 'community' ? colors.accent : colors.textSecondary}
        />
        <Text style={[styles.tabLabel, activeTab === 'community' && styles.tabLabelActive]}>
          Community Updates
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onTabChange('incidents')}
        style={[styles.tab, activeTab === 'incidents' && styles.tabActive]}
      >
        <Ionicons
          name="warning-outline"
          size={16}
          color={activeTab === 'incidents' ? colors.accent : colors.textSecondary}
        />
        <Text style={[styles.tabLabel, activeTab === 'incidents' && styles.tabLabelActive]}>
          Recent Incidents
        </Text>
      </Pressable>
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
