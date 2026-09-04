import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import AIAssistantFAB from '../../components/community/AIAssistantFAB';
import { useTheme, useThemedStyles } from '../../theme';
import AvatarButton from '../../components/AvatarButton';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';

type AlertTone = 'critical' | 'warning';

/** Alert tints come from the palette so they stay legible in both themes. */
function alertTone(tone: AlertTone, c: ThemePalette): { solid: string; background: string } {
  return tone === 'critical'
    ? { solid: c.statusHeavySolid, background: c.statusHeavyBg }
    : { solid: c.statusHighSolid, background: c.statusHighBg };
}

interface AlertItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  priority: 'high priority' | 'medium priority';
  icon: keyof typeof Ionicons.glyphMap;
  tone: AlertTone;
  unread: boolean;
}

const alertFeatures = [
  'Predictive congestion alerts',
  'Event-driven traffic surges',
  'Maintenance schedules',
  'Incident clusters',
] as const;

const initialAlerts: AlertItem[] = [
  {
    id: 'high-traffic-bocaue',
    title: 'High Traffic Predicted',
    message:
      'Severe congestion expected at Bocaue Exit tomorrow 5-8 PM due to Philippine Arena concert.',
    timeAgo: '30m ago',
    priority: 'high priority',
    icon: 'trending-up-outline',
    tone: 'critical',
    unread: true,
  },
  {
    id: 'incident-cluster-marilao',
    title: 'Incident Cluster Detected',
    message:
      'Multiple accident reports near Marilao. ML system suggests avoiding this segment.',
    timeAgo: '45m ago',
    priority: 'high priority',
    icon: 'warning-outline',
    tone: 'critical',
    unread: true,
  },
  {
    id: 'maintenance-balintawak',
    title: 'Scheduled Maintenance Tonight',
    message:
      'Road resurfacing at Balintawak begins at 11 PM. Expect lane reductions and slower flow.',
    timeAgo: '1h ago',
    priority: 'medium priority',
    icon: 'construct-outline',
    tone: 'warning',
    unread: false,
  },
];

export default function AlertsScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);

  const unreadCount = useMemo(
    () => alerts.filter((item) => item.unread).length,
    [alerts]
  );

  const handleMarkAllAsRead = (): void => {
    setAlerts((current) => current.map((item) => ({ ...item, unread: false })));
  };

  const handleOpenAlert = (id: string): void => {
    setAlerts((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerBar}>
            <View style={styles.brandGroup}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../../assets/smartflow-logo.png')}
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

          <View style={styles.body}>
            <View style={styles.sectionHeading}>
              <Text style={styles.pageTitle}>Smart Alerts</Text>
              <Text style={styles.pageSubtitle}>
                Proactive notifications for traffic events
              </Text>
            </View>

            <View style={styles.settingsCard}>
              <View style={styles.settingsTopRow}>
                <View>
                  <Text style={styles.settingsTitle}>Push Notifications</Text>
                  <Text style={styles.settingsStatus}>
                    {notificationsEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>

                <Switch
                  onValueChange={setNotificationsEnabled}
                  value={notificationsEnabled}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={notificationsEnabled ? colors.primary : colors.surface}
                />
              </View>

              <View style={styles.featuresList}>
                {alertFeatures.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <View style={styles.featureDot} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.unreadHeader}>
              <Text style={styles.unreadTitle}>
                {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
              </Text>
              <Pressable disabled={unreadCount === 0} onPress={handleMarkAllAsRead}>
                <Text
                  style={[
                    styles.markReadText,
                    unreadCount === 0 && styles.markReadTextDisabled,
                  ]}
                >
                  Mark all as read
                </Text>
              </Pressable>
            </View>

            <View style={styles.alertList}>
              {alerts.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleOpenAlert(item.id)}
                  style={({ pressed }) => [
                    styles.alertCard,
                    item.unread && styles.alertCardUnread,
                    pressed && styles.alertCardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.alertIconWrap,
                      { backgroundColor: alertTone(item.tone, colors).background },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={alertTone(item.tone, colors).solid}
                    />
                  </View>

                  <View style={styles.alertContent}>
                    <View style={styles.alertTopRow}>
                      <Text style={styles.alertTitle}>{item.title}</Text>
                      <View style={styles.alertActions}>
                        {item.unread ? <View style={styles.unreadDot} /> : null}
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textTertiary}
                        />
                      </View>
                    </View>

                    <Text style={styles.alertMessage}>{item.message}</Text>

                    <View style={styles.alertMetaRow}>
                      <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                        <Text style={styles.timeText}>{item.timeAgo}</Text>
                      </View>

                      <View
                        style={[
                          styles.priorityPill,
                          item.priority === 'high priority'
                            ? styles.priorityPillHigh
                            : styles.priorityPillMedium,
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            item.priority === 'high priority'
                              ? styles.priorityTextHigh
                              : styles.priorityTextMedium,
                          ]}
                        >
                          {item.priority}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <AIAssistantFAB onPress={() => undefined} />
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
    flex: 1,
    backgroundColor: c.surfaceMuted,
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  body: {
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  sectionHeading: {
    marginBottom: 18,
  },
  pageTitle: {
    color: c.text,
    fontSize: 31,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 8,
  },
  pageSubtitle: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  settingsCard: {
    backgroundColor: c.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    padding: 14,
    marginBottom: 20,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  settingsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  settingsTitle: {
    color: '#000000',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  settingsStatus: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 4,
  },
  featuresList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10C74C',
  },
  featureText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  unreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  unreadTitle: {
    color: c.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  markReadText: {
    color: '#1D5CFF',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  markReadTextDisabled: {
    opacity: 0.45,
  },
  alertList: {
    gap: 12,
  },
  alertCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: c.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    padding: 14,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  alertCardUnread: {
    borderColor: '#FFB8B1',
  },
  alertCardPressed: {
    opacity: 0.82,
  },
  alertIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  alertTitle: {
    flex: 1,
    color: c.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  alertActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: c.primary,
  },
  alertMessage: {
    color: c.text,
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
    marginBottom: 10,
  },
  alertMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  priorityPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityPillHigh: {
    backgroundColor: c.statusHeavyBg,
  },
  priorityPillMedium: {
    backgroundColor: c.statusHighBg,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.medium,
  },
  priorityTextHigh: {
    color: '#F04438',
  },
  priorityTextMedium: {
    color: '#D97706',
  },
});
