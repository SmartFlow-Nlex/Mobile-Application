import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActiveCommunityTab } from '@smartflow/shared';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export interface FilterTabsProps {
  activeTab: ActiveCommunityTab;
  onTabChange: (tab: ActiveCommunityTab) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onTabChange('community')}
        style={[styles.tab, activeTab === 'community' && styles.tabActive]}
      >
        <Ionicons
          name="people-outline"
          size={16}
          color={activeTab === 'community' ? Colors.communityBlue : '#6B7280'}
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
          color={activeTab === 'incidents' ? Colors.communityBlue : '#6B7280'}
        />
        <Text style={[styles.tabLabel, activeTab === 'incidents' && styles.tabLabelActive]}>
          Recent Incidents
        </Text>
      </Pressable>
    </View>
  );
};

export default FilterTabs;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
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
    backgroundColor: Colors.surface,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabLabel: {
    color: '#6B7280',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: Colors.communityBlue,
    fontWeight: Typography.fontWeight.bold,
  },
});
