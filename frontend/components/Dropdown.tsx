import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';
import SheetModal from './SheetModal';
import type { ThemePalette } from '../theme';
import { Typography } from '../constants/typography';

export interface DropdownOption {
  id: string;
  label: string;
  /** Secondary line shown under the label in the option list. */
  sublabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export interface DropdownProps {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
  /** Shown inside the sheet under the title, e.g. why the list is filtered. */
  helperText?: string;
  /** Message rendered when `options` is empty. */
  emptyText?: string;
  testID?: string;
}

/**
 * Bottom-sheet select. React Native has no native picker element, so the field
 * is a pressable row and the choices open in a modal sheet.
 */
const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  helperText,
  emptyText = 'No options available',
  testID,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  // An empty list still opens: the sheet is where `emptyText` explains why
  // there is nothing to pick (e.g. the last exit in a direction).
  const isDisabled = disabled;

  const handleSelect = (id: string): void => {
    onChange(id);
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${selected === null ? placeholder : selected.label}`}
        accessibilityState={{ disabled: isDisabled, expanded: open }}
        disabled={isDisabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          pressed && styles.fieldPressed,
          isDisabled && styles.fieldDisabled,
        ]}
      >
        <View style={styles.fieldValueGroup}>
          {selected?.icon !== undefined ? (
            <Ionicons
              name={selected.icon}
              size={16}
              color={selected.iconColor ?? colors.primary}
            />
          ) : null}
          <Text
            numberOfLines={1}
            style={selected === null ? styles.placeholder : styles.value}
          >
            {selected === null ? placeholder : selected.label}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={18}
          color={isDisabled ? colors.borderLight : colors.textTertiary}
        />
      </Pressable>

      <SheetModal visible={open} onClose={() => setOpen(false)}>
        {/* A plain View: SheetModal's scrim sits behind the sheet rather than
            wrapping it, so there is no parent press to stop. */}
        <View style={styles.sheet}>
            <View style={styles.grabber} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={10}
                onPress={() => setOpen(false)}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {helperText !== undefined ? (
              <Text style={styles.sheetHelper}>{helperText}</Text>
            ) : null}

            {options.length === 0 ? (
              <Text style={styles.emptyText}>{emptyText}</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => item.id}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => {
                  const active = item.id === value;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => handleSelect(item.id)}
                      style={({ pressed }) => [
                        styles.option,
                        pressed && styles.optionPressed,
                        active && styles.optionActive,
                      ]}
                    >
                      <View style={styles.optionTextGroup}>
                        {item.icon !== undefined ? (
                          <Ionicons
                            name={item.icon}
                            size={17}
                            color={item.iconColor ?? colors.primary}
                          />
                        ) : null}
                        <View style={styles.optionLabels}>
                          <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                            {item.label}
                          </Text>
                          {item.sublabel !== undefined ? (
                            <Text style={styles.optionSublabel}>{item.sublabel}</Text>
                          ) : null}
                        </View>
                      </View>

                      {active ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            )}
        </View>
      </SheetModal>
    </View>
  );
};

export default Dropdown;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 8,
  },
  field: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.field,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  fieldPressed: {
    backgroundColor: c.surfaceLight,
    borderColor: c.primaryLight,
  },
  fieldDisabled: {
    backgroundColor: c.surfaceDisabled,
    borderColor: c.track,
  },
  fieldValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  value: {
    color: c.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    flexShrink: 1,
  },
  placeholder: {
    color: c.textTertiary,
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    flexShrink: 1,
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '72%',
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: c.border,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: c.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  sheetHelper: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    marginTop: 6,
  },
  list: {
    marginTop: 12,
  },
  separator: {
    height: 1,
    backgroundColor: c.hairline,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
  },
  optionPressed: {
    backgroundColor: c.surfaceMuted,
  },
  optionActive: {
    backgroundColor: c.surfaceLight,
  },
  optionTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionLabels: {
    flex: 1,
  },
  optionLabel: {
    color: c.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  optionLabelActive: {
    color: c.accent,
    fontWeight: '800',
  },
  optionSublabel: {
    color: c.textTertiary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyText: {
    color: c.textTertiary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    paddingVertical: 24,
    textAlign: 'center',
  },
});
