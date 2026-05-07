import React, { useState } from 'react';
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
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { useCommunityFeed } from '../../../hooks/useCommunityFeed';

export default function CommunityScreen(): React.ReactElement {
  const {
    posts,
    isLoading,
    activeTab,
    setActiveTab,
    handleLike,
    handleShareUpdate,
    handleReportIncident,
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
                <Text style={styles.headerSubtitle}>Predictive Traffic Intelligence</Text>
              </View>
            </View>

            <Pressable style={styles.headerIconButton}>
              <Ionicons name="notifications-outline" size={21} color={Colors.textInverse} />
            </Pressable>
          </View>

          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderIcon}>
              <Ionicons name="people-outline" size={18} color={Colors.textInverse} />
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
              <Ionicons name="paper-plane-outline" size={16} color={Colors.textInverse} />
              <Text style={styles.actionButtonText}>Share Update</Text>
            </Pressable>

            <Pressable onPress={() => setShowReportModal(true)} style={styles.reportButton}>
              <Ionicons name="warning-outline" size={16} color={Colors.textInverse} />
              <Text style={styles.actionButtonText}>Report Incident</Text>
            </Pressable>
            </View>

            <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <View style={styles.sectionHeader}>
              <Ionicons name={sectionIcon} size={18} color={Colors.communityBlue} />
              <Text style={styles.sectionHeaderText}>{sectionTitle}</Text>
            </View>

            {isLoading ? (
              <Text style={styles.loadingText}>Loading community feed...</Text>
            ) : null}

            {!isLoading && posts.length === 0 ? (
              <Text style={styles.loadingText}>No posts available yet.</Text>
            ) : null}

            {posts.map((post) => (
              <CommunityPostCard key={post.id} onLike={handleLike} post={post} />
            ))}
          </View>
        </ScrollView>

        <AIAssistantFAB onPress={() => setShowAiModal(true)} />

        <ShareUpdateModal
          onClose={() => setShowShareModal(false)}
          onSubmit={handleShareUpdate}
          visible={showShareModal}
        />
        <ReportIncidentModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportIncident}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    paddingBottom: 120,
  },
  headerBar: {
    backgroundColor: Colors.communityBlue,
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
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  logo: {
    width: 22,
    height: 22,
  },
  headerTitle: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 2,
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pageHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.communityBlue,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  pageSubtitle: {
    color: '#6B7280',
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
    backgroundColor: Colors.communityBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  reportButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.dangerRed,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonText: {
    color: Colors.textInverse,
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
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  loadingText: {
    color: '#6B7280',
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
    ...StyleSheet.absoluteFillObject,
  },
  aiCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: Colors.surface,
    padding: 20,
  },
  aiTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 8,
  },
  aiMessage: {
    color: '#374151',
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: 18,
  },
  aiButton: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.communityBlue,
  },
  aiButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});
