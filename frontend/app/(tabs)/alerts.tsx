import React, { useMemo, useState } from 'react';
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
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface AlertItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  priority: 'high priority' | 'medium priority';
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  iconBg: string;
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
    tint: '#FF2D2D',
    iconBg: '#FFE8E8',
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
    tint: '#FF3B30',
    iconBg: '#FFE8E8',
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
    tint: '#F97316',
    iconBg: '#FFF1E8',
    unread: false,
  },
];

export default function AlertsScreen(): React.ReactElement {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [isMuted, setIsMuted] = useState<boolean>(true);

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
                <Text style={styles.headerSubtitle}>Predictive Traffic Intelligence</Text>
              </View>
            </View>

            <Pressable style={styles.headerIconButton}>
              <Ionicons name="notifications-outline" size={21} color={Colors.textInverse} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={styles.pageTitle}>Smart Alerts</Text>
                <Text style={styles.pageSubtitle}>
                  Proactive notifications for traffic events
                </Text>
              </View>

              <Pressable
                onPress={() => setIsMuted((current) => !current)}
                style={styles.muteButton}
              >
                <Ionicons
                  name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </Pressable>
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
                  thumbColor={notificationsEnabled ? Colors.primary : Colors.surface}
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
                  <View style={[styles.alertIconWrap, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={20} color={item.tint} />
                  </View>

                  <View style={styles.alertContent}>
                    <View style={styles.alertTopRow}>
                      <Text style={styles.alertTitle}>{item.title}</Text>
                      <View style={styles.alertActions}>
                        {item.unread ? <View style={styles.unreadDot} /> : null}
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={Colors.textTertiary}
                        />
                      </View>
                    </View>

                    <Text style={styles.alertMessage}>{item.message}</Text>

                    <View style={styles.alertMetaRow}>
                      <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    paddingBottom: 120,
  },
  headerBar: {
    backgroundColor: Colors.primary,
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
    color: 'rgba(255,255,255,0.9)',
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
  body: {
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: 31,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 8,
  },
  pageSubtitle: {
    color: '#58709A',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  muteButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EEF6',
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE4EF',
    padding: 14,
    marginBottom: 20,
    shadowColor: '#0F172A',
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
    color: '#58709A',
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
    color: '#4B5D79',
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
    color: '#1C3159',
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
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    padding: 14,
    shadowColor: '#0F172A',
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
    color: '#111827',
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
    backgroundColor: Colors.primary,
  },
  alertMessage: {
    color: '#34435E',
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
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  priorityPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityPillHigh: {
    backgroundColor: '#FFE7E5',
  },
  priorityPillMedium: {
    backgroundColor: '#FFF2DF',
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
