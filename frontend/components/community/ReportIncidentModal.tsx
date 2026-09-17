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
import { PostMedia, ReportIncidentPayload } from '@smartflow/shared';
import { useTheme, useThemedStyles } from '../../theme';
import SheetModal from '../SheetModal';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import MediaPicker from './MediaPicker';
import LocationPicker, { LocationValue, emptyLocation, formatLocation } from './LocationPicker';

export interface ReportIncidentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: ReportIncidentPayload) => void;
}

const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [location, setLocation] = useState<LocationValue>(emptyLocation());
  const [description, setDescription] = useState<string>('');
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
      description,
      /*
       * Always `incident`, because that is what this form is for.
       *
       * The severity picker offered moderate / heavy / incident, which asked
       * the reporter to grade their own report - and since the status badge
       * came off the post cards, the answer was never shown anywhere. The form
       * you chose already carries the meaning.
       */
      status: 'incident',
      reportedBy: 'Community User',
      media,
      direction: location.direction,
    });
    setLocation(emptyLocation());
    setDescription('');
    setMedia([]);
    onClose();
  };

  return (
    <SheetModal visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>Report Incident</Text>
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

            <Text style={styles.label}>Description</Text>
            <TextInput
              multiline
              onChangeText={setDescription}
              placeholder="Describe what happened"
              placeholderTextColor={colors.textTertiary}
              style={styles.textArea}
              textAlignVertical="top"
              value={description}
            />

            <MediaPicker accentColor={colors.danger} onChange={setMedia} value={media} />

            <Pressable
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            >
              <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                Submit Report
              </Text>
            </Pressable>
          </ScrollView>
      </View>
    </SheetModal>
  );
};

export default ReportIncidentModal;

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
    backgroundColor: c.danger,
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
