import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { PostMedia } from '@smartflow/shared';

export interface MediaViewerProps {
  media: PostMedia[];
  /** Which attachment was tapped. */
  startIndex: number;
  visible: boolean;
  onClose: () => void;
}

/**
 * Full-screen viewer for a post's attachments.
 *
 * Deliberately not themed: a photo reads best against black regardless of the
 * app's light/dark setting, which is how every other photo viewer behaves.
 */
const MediaViewer: React.FC<MediaViewerProps> = ({ media, startIndex, visible, onClose }) => {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(startIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Re-open on whichever thumbnail was tapped, not wherever we were left.
  useEffect(() => {
    if (visible) {
      setIndex(startIndex);
      setIsLoading(true);
      setFailed(false);
    }
  }, [visible, startIndex]);

  const item = media[index];
  const hasMultiple = media.length > 1;

  const step = (delta: number): void => {
    setIndex((current) => {
      const next = (current + delta + media.length) % media.length;
      return next;
    });
    setIsLoading(true);
    setFailed(false);
  };

  if (item === undefined) {
    return null;
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Tapping anywhere off the image closes, the way a photo viewer should. */}
        <Pressable accessibilityLabel="Close image" onPress={onClose} style={StyleSheet.absoluteFill} />

        {item.type === 'image' ? (
          <View pointerEvents="box-none" style={styles.stage}>
            {isLoading && !failed ? (
              <ActivityIndicator color="#FFFFFF" size="large" style={styles.spinner} />
            ) : null}
            <Image
              onLoadEnd={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setFailed(true);
              }}
              resizeMode="contain"
              source={{ uri: item.uri }}
              style={{ width, height: height * 0.8 }}
            />
            {failed ? (
              <View style={styles.failed}>
                <Ionicons name="image-outline" size={30} color="rgba(255,255,255,0.7)" />
                <Text style={styles.failedText}>This image could not be loaded.</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.stage}>
            <Ionicons name="videocam" size={54} color="rgba(255,255,255,0.85)" />
            <Text style={styles.videoLabel}>Video attachment</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void Linking.openURL(item.uri)}
              style={styles.videoButton}
            >
              <Ionicons name="play" size={16} color="#0B1524" />
              <Text style={styles.videoButtonText}>Play video</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          onPress={onClose}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        {hasMultiple ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous"
              hitSlop={12}
              onPress={() => step(-1)}
              style={[styles.arrow, styles.arrowLeft]}
            >
              <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next"
              hitSlop={12}
              onPress={() => step(1)}
              style={[styles.arrow, styles.arrowRight]}
            >
              <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
            </Pressable>
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {index + 1} / {media.length}
              </Text>
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
};

export default MediaViewer;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  spinner: {
    position: 'absolute',
    zIndex: 1,
  },
  failed: {
    position: 'absolute',
    alignItems: 'center',
    gap: 10,
  },
  failedText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '500',
  },
  videoLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  videoButtonText: {
    color: '#0B1524',
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    top: 52,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  counter: {
    position: 'absolute',
    bottom: 54,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
