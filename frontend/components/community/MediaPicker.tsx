import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { PostMedia } from '@smartflow/shared';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';

export interface MediaPickerProps {
  value: PostMedia[];
  onChange: (media: PostMedia[]) => void;
  /** Brand colour of the host modal, so the picker matches its chips/submit button. */
  accentColor: string;
  maxItems?: number;
}

const DEFAULT_MAX_ITEMS = 4;

/**
 * Attaches photos or clips to a community update / incident report.
 *
 * Videos are shown as a labelled tile rather than a frame preview: pulling a
 * real thumbnail out of a video would need expo-video-thumbnails, which is a
 * native module we don't ship — and adding one would break Expo Go for the team.
 */
const MediaPicker: React.FC<MediaPickerProps> = ({
  value,
  onChange,
  accentColor,
  maxItems = DEFAULT_MAX_ITEMS,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const remaining = maxItems - value.length;
  const isFull = remaining <= 0;

  const appendAssets = (assets: ImagePicker.ImagePickerAsset[]): void => {
    const picked: PostMedia[] = assets.slice(0, remaining).map((asset) => ({
      uri: asset.uri,
      type: asset.type === 'video' || asset.type === 'pairedVideo' ? 'video' : 'image',
    }));
    if (picked.length > 0) {
      onChange([...value, ...picked]);
    }
  };

  const handlePickFromLibrary = async (): Promise<void> => {
    if (isFull) {
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access in Settings to attach images or video.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled) {
      appendAssets(result.assets);
    }
  };

  const handleCapture = async (): Promise<void> => {
    if (isFull) {
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Camera access needed',
        'Allow camera access in Settings to take a photo or video of the incident.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (!result.canceled) {
      appendAssets(result.assets);
    }
  };

  const handleRemove = (index: number): void => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Add Media (Images/Video)</Text>
        <Text style={styles.counter}>
          {value.length}/{maxItems}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          disabled={isFull}
          onPress={handlePickFromLibrary}
          style={[styles.libraryButton, isFull && styles.actionDisabled]}
        >
          <Ionicons
            name="images-outline"
            size={18}
            color={isFull ? colors.textTertiary : accentColor}
          />
          <Text style={[styles.libraryText, isFull && styles.actionTextDisabled]}>
            Upload photo or video
          </Text>
        </Pressable>

        <Pressable
          disabled={isFull}
          onPress={handleCapture}
          style={[styles.cameraButton, isFull && styles.actionDisabled]}
        >
          <Ionicons
            name="camera-outline"
            size={20}
            color={isFull ? colors.textTertiary : accentColor}
          />
        </Pressable>
      </View>

      {value.length > 0 ? (
        <View style={styles.thumbRow}>
          {value.map((item, index) => (
            <View key={`${item.uri}-${index}`} style={styles.thumbWrapper}>
              {item.type === 'image' ? (
                <Image source={{ uri: item.uri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.videoThumb]}>
                  <Ionicons name="videocam" size={22} color={colors.textInverse} />
                  <Text style={styles.videoLabel}>Video</Text>
                </View>
              )}

              <Pressable
                hitSlop={6}
                onPress={() => handleRemove(index)}
                style={styles.removeButton}
              >
                <Ionicons name="close" size={13} color={colors.textInverse} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>Optional — attach up to {maxItems} photos or clips.</Text>
      )}

      {isFull ? <Text style={styles.hint}>Attachment limit reached.</Text> : null}
    </View>
  );
};

export default MediaPicker;

const THUMB_SIZE = 74;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    label: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
    },
    counter: {
      color: c.textTertiary,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.medium,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    libraryButton: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.border,
      backgroundColor: c.field,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    cameraButton: {
      width: 46,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.border,
      backgroundColor: c.field,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionDisabled: {
      backgroundColor: c.surfaceDisabled,
      borderColor: c.hairline,
    },
    libraryText: {
      color: c.text,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
    },
    actionTextDisabled: {
      color: c.textTertiary,
    },
    thumbRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 12,
    },
    thumbWrapper: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: 10,
      backgroundColor: c.surfaceMuted,
    },
    videoThumb: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      backgroundColor: c.primary,
    },
    videoLabel: {
      color: c.textInverse,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.semibold,
    },
    removeButton: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.dangerRed,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.surface,
    },
    hint: {
      color: c.textTertiary,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.normal,
      marginTop: 8,
    },
  });
