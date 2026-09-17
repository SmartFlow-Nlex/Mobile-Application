import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CommunityPost, TrafficStatus } from '@smartflow/shared';
import { useTheme, useThemedStyles } from '../../theme';
import type { CongestionLevel } from '../../lib/trafficModel';
import { toneFor } from '../dashboard/severity';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import MediaViewer from './MediaViewer';

export interface CommunityPostCardProps {
  post: CommunityPost;
  onLike: (id: string) => void;
}

/**
 * The condition the poster reported, as a tint rather than a badge.
 *
 * This used to be a pill reading "🚛 heavy" pinned to the top-right of every
 * card - an emoji and a lowercase enum value, loud enough to compete with the
 * post itself. The same fact now rides in the meta line as a coloured dot and
 * a word, next to the location it belongs with. The top-right corner it
 * vacated is where the timestamp sits.
 */
const conditionLevel: Record<TrafficStatus, CongestionLevel> = {
  smooth: 'low',
  moderate: 'moderate',
  heavy: 'severe',
  incident: 'severe',
};

const conditionLabel: Record<TrafficStatus, string> = {
  smooth: 'Smooth',
  moderate: 'Moderate',
  heavy: 'Heavy',
  incident: 'Incident',
};

const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ post, onLike }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const media = post.media ?? [];
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.authorSection}>
          <View style={[styles.avatar, { backgroundColor: post.avatarColor }]}>
            <Text style={styles.avatarText}>{post.authorInitial}</Text>
          </View>

          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
              <Text style={styles.metaText}>{post.location}</Text>
              {post.direction !== undefined ? (
                <View style={styles.directionChip}>
                  <Text style={styles.directionChipText}>
                    {post.direction === 'northbound' ? 'NB' : 'SB'}
                  </Text>
                </View>
              ) : null}
              <View
                style={[
                  styles.conditionChip,
                  { backgroundColor: toneFor(conditionLevel[post.status], colors).background },
                ]}
              >
                <View
                  style={[
                    styles.conditionDot,
                    { backgroundColor: toneFor(conditionLevel[post.status], colors).solid },
                  ]}
                />
                <Text
                  style={[
                    styles.conditionChipText,
                    { color: toneFor(conditionLevel[post.status], colors).text },
                  ]}
                >
                  {conditionLabel[post.status]}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/*
          Pinned to the card's right edge rather than buried mid-line. It used
          to sit between the direction chip and the condition chip, competing
          with two coloured pills for one row - and on a narrow phone that row
          wrapped, breaking "9d ago" away from its own clock icon. Top-right is
          where a reader looks for a post's age anyway.
        */}
        <View style={styles.timeGroup}>
          <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.timeText}>{post.timeAgo}</Text>
        </View>
      </View>

      <Text style={styles.message}>{post.message}</Text>

      {media.length > 0 ? (
        <View style={styles.mediaRow}>
          {media.map((item, index) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.type === 'image' ? 'View photo' : 'View video'}
              key={`${item.uri}-${index}`}
              onPress={() => setViewerIndex(index)}
              style={({ pressed }) => [styles.mediaThumbWrap, pressed && styles.mediaThumbPressed]}
            >
              {item.type === 'image' ? (
                <Image source={{ uri: item.uri }} style={styles.mediaThumb} />
              ) : (
                <View style={[styles.mediaThumb, styles.mediaVideo]}>
                  <Ionicons name="play-circle" size={26} color={colors.textInverse} />
                </View>
              )}
              {/* Small cue that the thumbnail opens larger. */}
              <View style={styles.expandBadge}>
                <Ionicons name="expand-outline" size={11} color={colors.textInverse} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <MediaViewer
        media={media}
        onClose={() => setViewerIndex(null)}
        startIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
      />

      <Pressable onPress={() => onLike(post.id)} style={styles.likeRow}>
        <Ionicons
          name={post.likedByUser ? 'thumbs-up' : 'thumbs-up-outline'}
          size={14}
          color={colors.textTertiary}
        />
        <Text style={styles.likeText}>{post.likes}</Text>
      </Pressable>
    </View>
  );
};

export default CommunityPostCard;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    // A drawn edge as well as the shadow: shadows carry the card on a light
    // background but contribute almost nothing on a dark one.
    borderWidth: 1,
    borderColor: c.hairline,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  authorSection: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: c.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    color: c.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.normal,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // Never squeezed by a long location name, and nudged onto the author-name
    // line - that name carries 4pt of bottom margin, so an unshifted stamp
    // sits a touch high against it.
    flexShrink: 0,
    marginTop: 1,
  },
  timeText: {
    // A step quieter than the location: it is the least actionable fact on the
    // card, and it now sits alone where nothing else competes for the eye.
    color: c.textTertiary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.normal,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  conditionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  conditionChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  directionChip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: c.primarySoft,
  },
  directionChipText: {
    color: c.accent,
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },
  message: {
    color: c.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: 21,
    marginTop: 14,
    marginBottom: 14,
  },
  mediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  mediaThumbWrap: {
    width: 78,
    height: 78,
  },
  mediaThumbPressed: {
    opacity: 0.75,
  },
  expandBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaThumb: {
    width: 78,
    height: 78,
    borderRadius: 10,
    backgroundColor: c.surfaceMuted,
  },
  mediaVideo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeText: {
    color: c.textTertiary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
