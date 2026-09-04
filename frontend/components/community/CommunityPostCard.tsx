import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CommunityPost } from '@smartflow/shared';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import StatusBadge from './StatusBadge';

export interface CommunityPostCardProps {
  post: CommunityPost;
  onLike: (id: string) => void;
}

const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ post, onLike }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
              <Text style={styles.metaBullet}>•</Text>
              <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
              <Text style={styles.metaText}>{post.timeAgo}</Text>
            </View>
          </View>
        </View>

        <StatusBadge status={post.status} />
      </View>

      <Text style={styles.message}>{post.message}</Text>

      {post.media && post.media.length > 0 ? (
        <View style={styles.mediaRow}>
          {post.media.map((item, index) =>
            item.type === 'image' ? (
              <Image
                key={`${item.uri}-${index}`}
                source={{ uri: item.uri }}
                style={styles.mediaThumb}
              />
            ) : (
              <View key={`${item.uri}-${index}`} style={[styles.mediaThumb, styles.mediaVideo]}>
                <Ionicons name="play-circle" size={26} color={colors.textInverse} />
              </View>
            )
          )}
        </View>
      ) : null}

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
  metaBullet: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginHorizontal: 2,
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
