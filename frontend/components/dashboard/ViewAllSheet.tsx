import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import SheetModal from '../SheetModal';

export interface ViewAllSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** How the list is ordered, stated rather than left to be inferred. */
  sortLabel: string;
  count: number;
  children: React.ReactNode;
}

/**
 * The full list behind a section's "View All", as a sheet rather than a screen.
 *
 * The dashboard previews three of each list to stay short; this is where the
 * rest live. A sheet rather than a pushed route because nothing here is a
 * destination - you open it, scan it and dismiss it, and coming back to a
 * scrolled dashboard is the point.
 *
 * Capped at 80% of the screen so the sheet always reads as a layer over the
 * dashboard rather than a page that has taken it over.
 */
const ViewAllSheet: React.FC<ViewAllSheetProps> = ({
  visible,
  onClose,
  title,
  sortLabel,
  count,
  children,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <SheetModal visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.grabber} />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {count} {count === 1 ? 'entry' : 'entries'} · {sortLabel}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={10}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressedDim]}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </SheetModal>
  );
};

export default ViewAllSheet;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingBottom: 20,
      maxHeight: '80%',
    },
    grabber: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderLight,
      marginTop: 10,
      marginBottom: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingBottom: 14,
      marginBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: c.text,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    subtitle: {
      color: c.textTertiary,
      fontSize: Typography.fontSize.xs,
      fontWeight: '600',
      marginTop: 3,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
    },
    pressedDim: {
      opacity: 0.6,
    },
    list: {
      gap: 12,
      paddingBottom: 8,
    },
  });
