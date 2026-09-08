import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import AIAssistantFAB from '../../../components/community/AIAssistantFAB';
import CommunityPostCard from '../../../components/community/CommunityPostCard';
import FilterTabs from '../../../components/community/FilterTabs';
import ReportIncidentModal from '../../../components/community/ReportIncidentModal';
import ShareUpdateModal from '../../../components/community/ShareUpdateModal';
import { useTheme, useThemedStyles } from '../../../theme';
import AvatarButton from '../../../components/AvatarButton';
import type { ThemePalette } from '../../../theme';
import { Typography } from '../../../constants/typography';
import { useCommunityFeed } from '../../../hooks/useCommunityFeed';

export default function CommunityScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const {
    posts,
    isLoading,
    error,
    isSubmitting,
    activeTab,
    setActiveTab,
    handleLike,
    handleShareUpdate,
    handleReportIncident,
    refresh,
  } = useCommunityFeed();
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  const sectionTitle = activeTab === 'community' ? 'Community Updates' : 'Recent Incidents';
  const sectionIcon: keyof typeof Ionicons.glyphMap =
    activeTab === 'community' ? 'people-outline' : 'warning-outline';

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.headerBar}>
            <View style={styles.brandGroup}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../../../assets/smartflow-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>SmartFlow NLEX</Text>
              </View>
            </View>

            <AvatarButton initials="NT" onPress={() => router.push('/profile')} />
          </View>

          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderIcon}>
              <Ionicons name="people-outline" size={18} color={colors.textInverse} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Community</Text>
              <Text style={styles.pageSubtitle}>
                Share your traffic experience and help the community
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.actionsRow}>
            <Pressable onPress={() => setShowShareModal(true)} style={styles.shareButton}>
              <Ionicons name="paper-plane-outline" size={16} color={colors.textInverse} />
              <Text style={styles.actionButtonText}>Share Update</Text>
            </Pressable>

            <Pressable onPress={() => setShowReportModal(true)} style={styles.reportButton}>
              <Ionicons name="warning-outline" size={16} color={colors.textInverse} />
              <Text style={styles.actionButtonText}>Report Incident</Text>
            </Pressable>
            </View>

            <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <View style={styles.sectionHeader}>
              <Ionicons name={sectionIcon} size={18} color={colors.accent} />
              <Text style={styles.sectionHeaderText}>{sectionTitle}</Text>
            </View>

            {isSubmitting ? (
              <Text style={styles.loadingText}>Posting...</Text>
            ) : null}

            {isLoading ? (
              <Text style={styles.loadingText}>Loading community feed...</Text>
            ) : null}

            {/*
              There is no sample data behind this any more, so an empty feed
              genuinely means nobody has posted - and a failure has to say so
              rather than looking like an empty feed.
            */}
            {error !== null ? (
              <View style={styles.feedError}>
                <Ionicons name="cloud-offline-outline" size={20} color={colors.dangerRed} />
                <Text style={styles.feedErrorText}>{error}</Text>
                <Pressable onPress={refresh} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}

            {!isLoading && error === null && posts.length === 0 ? (
              <Text style={styles.loadingText}>
                {activeTab === 'community'
                  ? 'No updates yet. Be the first to share one.'
                  : 'No incidents reported yet.'}
              </Text>
            ) : null}

            {posts.map((post) => (
              <CommunityPostCard key={post.id} onLike={handleLike} post={post} />
            ))}
          </View>
        </ScrollView>

        <AIAssistantFAB onPress={() => setShowAiModal(true)} />

        <ShareUpdateModal
          onClose={() => setShowShareModal(false)}
          onSubmit={(payload) => void handleShareUpdate(payload).catch(() => undefined)}
          visible={showShareModal}
        />
        <ReportIncidentModal
          onClose={() => setShowReportModal(false)}
          onSubmit={(payload) => void handleReportIncident(payload).catch(() => undefined)}
          visible={showReportModal}
        />

        <Modal animationType="fade" transparent visible={showAiModal} onRequestClose={() => setShowAiModal(false)}>
          <View style={styles.aiBackdrop}>
            <Pressable onPress={() => setShowAiModal(false)} style={styles.aiScrim} />
            <View style={styles.aiCard}>
              <Text style={styles.aiTitle}>AI Assistant</Text>
              <Text style={styles.aiMessage}>
                Ask SmartFlow AI about current traffic, alternate routes, or nearby incidents.
              </Text>
              <Pressable
                onPress={() => {
                  setShowAiModal(false);
                  Alert.alert('AI Assistant', 'AI assistant modal opened.');
                }}
                style={styles.aiButton}
              >
                <Text style={styles.aiButtonText}>Open Assistant</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  safeArea: {
    // Brand colour so the status-bar inset runs into the header instead of
    // leaving a white strip above it.
    flex: 1,
    backgroundColor: c.primary,
  },
  screen: {
    // c.background, not c.surface: the post cards are c.surface, and in dark
    // mode both were #142234 - the cards vanished into the page because a drop
    // shadow does not read against a dark ground the way it does on white.
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    paddingBottom: 120,
  },
  headerBar: {
    backgroundColor: c.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    overflow: 'hidden',
  },
  logo: {
    width: 22,
    height: 22,
  },
  headerTitle: {
    color: c.textInverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  pageHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  pageTitle: {
    color: c.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  pageSubtitle: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: 18,
    marginTop: 4,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  shareButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  reportButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: c.dangerRed,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonText: {
    color: c.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeaderText: {
    color: c.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  feedError: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  feedErrorText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: c.primary,
  },
  retryButtonText: {
    color: c.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  loadingText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: 12,
  },
  aiBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    paddingHorizontal: 24,
  },
  aiScrim: {
    // RN 0.86 removed StyleSheet.absoluteFillObject; absoluteFill is the
    // registered-style equivalent and spreads the same way.
    ...StyleSheet.absoluteFill,
  },
  aiCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: c.surface,
    padding: 20,
  },
  aiTitle: {
    color: c.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 8,
  },
  aiMessage: {
    color: c.text,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: 18,
  },
  aiButton: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  aiButtonText: {
    color: c.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});
