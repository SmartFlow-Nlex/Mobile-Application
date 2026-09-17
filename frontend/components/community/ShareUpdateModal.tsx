import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostMedia, ShareUpdatePayload, TrafficStatus } from '@smartflow/shared';
import { useTheme, useThemedStyles } from '../../theme';
import SheetModal from '../SheetModal';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import type { CongestionLevel } from '../../lib/trafficModel';
import { toneFor } from '../dashboard/severity';
import MediaPicker from './MediaPicker';
import LocationPicker, { LocationValue, emptyLocation, formatLocation } from './LocationPicker';

export interface ShareUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: ShareUpdatePayload) => void;
}

/**
 * What the poster is actually being asked.
 *
 * The old picker was three chips reading "smooth", "moderate", "heavy" -
 * lowercase enum values in navy pills, with nothing to say what any of them
 * meant or which way was bad. Each option now carries the word a driver would
 * use, a line describing the road it applies to, and the palette's own status
 * colour, so the scale reads green-to-red without being explained.
 */
const CONDITIONS: {
  id: TrafficStatus;
  level: CongestionLevel;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: 'smooth',
    level: 'low',
    label: 'Smooth',
    hint: 'Free flowing, at or near the limit',
    icon: 'checkmark-circle',
  },
  {
    id: 'moderate',
    level: 'moderate',
    label: 'Moderate',
    hint: 'Slower than usual, but still moving',
    icon: 'alert-circle',
  },
  {
    id: 'heavy',
    level: 'severe',
    label: 'Heavy',
    hint: 'Stop and go, barely moving',
    icon: 'close-circle',
  },
];

const ShareUpdateModal: React.FC<ShareUpdateModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [location, setLocation] = useState<LocationValue>(emptyLocation());
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<TrafficStatus>('smooth');
  const [media, setMedia] = useState<PostMedia[]>([]);

  // Location is the one required field, so the button stays inert until the
  // exit (or the pair of exits) has actually been chosen.
  const locationLabel = formatLocation(location);
  const canSubmit = locationLabel !== null;

  const handleSubmit = (): void => {
    if (locationLabel === null) {
      return;
    }
    onSubmit({
      location: locationLabel,
      message,
      status,
      postedBy: 'Community User',
      media,
      direction: location.direction,
    });
    setLocation(emptyLocation());
    setMessage('');
    setStatus('smooth');
    setMedia([]);
    onClose();
  };

  return (
    <SheetModal visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>Share Update</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <LocationPicker onChange={setLocation} value={location} />

            <Text style={styles.label}>Message</Text>
            <TextInput
              multiline
              onChangeText={setMessage}
              placeholder="Share your traffic experience"
              placeholderTextColor={colors.textTertiary}
              style={styles.textArea}
              textAlignVertical="top"
              value={message}
            />

            <Text style={styles.label}>Traffic condition</Text>
            <View
              accessibilityRole="radiogroup"
              style={styles.conditionGroup}
            >
              {CONDITIONS.map((condition) => {
                const active = status === condition.id;
                const tone = toneFor(condition.level, colors);
                return (
                  <Pressable
                    key={condition.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${condition.label}. ${condition.hint}`}
                    onPress={() => setStatus(condition.id)}
                    style={({ pressed }) => [
                      styles.condition,
                      active && { backgroundColor: tone.background, borderColor: tone.solid },
                      pressed && !active && styles.conditionPressed,
                    ]}
                  >
                    <Ionicons
                      name={condition.icon}
                      size={20}
                      color={active ? tone.solid : colors.textTertiary}
                    />
                    <View style={styles.conditionText}>
                      <Text
                        style={[styles.conditionLabel, active && { color: tone.text }]}
                      >
                        {condition.label}
                      </Text>
                      <Text style={styles.conditionHint}>{condition.hint}</Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark" size={18} color={tone.solid} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <MediaPicker accentColor={colors.accent} onChange={setMedia} value={media} />

            <Pressable
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            >
              <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                Post Update
              </Text>
            </Pressable>
          </ScrollView>
      </View>
    </SheetModal>
  );
};

export default ShareUpdateModal;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '82%',
  },
  /* Tapping the backdrop still dismisses, but a sheet this tall pushes the
     backdrop off screen on a small phone - so it needs an explicit way out. */
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
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
  closePressed: {
    opacity: 0.6,
  },
  title: {
    flex: 1,
    color: c.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  conditionGroup: {
    gap: 8,
    marginBottom: 18,
  },
  condition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: c.surfaceMuted,
    borderWidth: 1,
    borderColor: c.border,
  },
  conditionPressed: {
    backgroundColor: c.pressed,
  },
  conditionText: {
    flex: 1,
  },
  conditionLabel: {
    color: c.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
  },
  conditionHint: {
    color: c.textTertiary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  label: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 8,
    marginTop: 4,
  },
  textArea: {
    minHeight: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: c.text,
    marginBottom: 12,
  },
  submitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  submitButtonDisabled: {
    backgroundColor: c.surfaceDisabled,
  },
  submitText: {
    color: c.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  submitTextDisabled: {
    color: c.textTertiary,
  },
});
