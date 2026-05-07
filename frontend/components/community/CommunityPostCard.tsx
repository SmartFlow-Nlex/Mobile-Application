import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CommunityPost } from '@smartflow/shared';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import StatusBadge from './StatusBadge';

export interface CommunityPostCardProps {
  post: CommunityPost;
  onLike: (id: string) => void;
}

const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ post, onLike }) => {
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
              <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{post.location}</Text>
              <Text style={styles.metaBullet}>•</Text>
              <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{post.timeAgo}</Text>
            </View>
          </View>
        </View>

        <StatusBadge status={post.status} />
      </View>

      <Text style={styles.message}>{post.message}</Text>

      <Pressable onPress={() => onLike(post.id)} style={styles.likeRow}>
        <Ionicons
          name={post.likedByUser ? 'thumbs-up' : 'thumbs-up-outline'}
          size={14}
          color={Colors.textTertiary}
        />
        <Text style={styles.likeText}>{post.likes}</Text>
      </Pressable>
    </View>
  );
};

export default CommunityPostCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
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
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    color: Colors.text,
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
    color: '#6B7280',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.normal,
  },
  metaBullet: {
    color: '#6B7280',
    fontSize: Typography.fontSize.xs,
    marginHorizontal: 2,
  },
  message: {
    color: '#374151',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: 21,
    marginTop: 14,
    marginBottom: 14,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeText: {
    color: '#9CA3AF',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
