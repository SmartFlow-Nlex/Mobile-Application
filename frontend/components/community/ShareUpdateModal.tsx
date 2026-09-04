import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PostMedia, ShareUpdatePayload, TrafficStatus } from '@smartflow/shared';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import MediaPicker from './MediaPicker';
import LocationPicker, { LocationValue, emptyLocation, formatLocation } from './LocationPicker';

export interface ShareUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: ShareUpdatePayload) => void;
}

const SHARE_STATUSES: TrafficStatus[] = ['smooth', 'moderate', 'heavy'];

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
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={styles.scrim} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Share Update</Text>
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

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {SHARE_STATUSES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setStatus(item)}
                  style={[styles.statusChip, status === item && styles.statusChipActive]}
                >
                  <Text
                    style={[styles.statusChipText, status === item && styles.statusChipTextActive]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
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
      </View>
    </Modal>
  );
};

export default ShareUpdateModal;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  scrim: {
    flex: 1,
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '82%',
  },
  title: {
    color: c.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 18,
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
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusChip: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipActive: {
    backgroundColor: c.primary,
  },
  statusChipText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  statusChipTextActive: {
    color: c.textInverse,
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
