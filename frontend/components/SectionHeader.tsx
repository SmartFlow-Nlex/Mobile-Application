import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../theme';
import type { ThemePalette } from '../theme';
import { Typography } from '../constants/typography';

export interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

export default SectionHeader;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  title: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
