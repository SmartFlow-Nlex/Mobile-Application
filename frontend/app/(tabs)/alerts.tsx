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
import { useAlerts, type AlertItem, type AlertTone } from '../../alerts';
import { useTheme, useThemedStyles } from '../../theme';
import AvatarButton from '../../components/AvatarButton';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';

/** Alert tints come from the palette so they stay legible in both themes. */
function alertTone(tone: AlertTone, c: ThemePalette): { solid: string; background: string } {
  return tone === 'critical'
    ? { solid: c.statusHeavySolid, background: c.statusHeavyBg }
    : { solid: c.statusHighSolid, background: c.statusHighBg };
}

/**
 * Above this many maintenance notices the group starts collapsed, so a backlog
 * of scheduled works never pushes the unread alerts off the first screen.
 * Below it everything stays visible - collapsing a short list would hide
 * notices for no benefit.
 */
const MAINTENANCE_COLLAPSE_THRESHOLD = 4;

const alertFeatures = [
  'Predictive congestion alerts',
  'Event-driven traffic surges',
  'Maintenance schedules',
  'Incident clusters',
] as const;

export default function AlertsScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const { alerts, markAsRead, markAllAsRead } = useAlerts();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  // Independent of maintenance: a user may want either group out of the way.
  const [unreadCollapsed, setUnreadCollapsed] = useState<boolean>(false);
  // null until the user taps: the group follows the count rule on its own, and
  // stops the moment they express a preference. Deriving it rather than seeding
  // useState also means the rule still applies once these alerts come from the
  // API, where the first render has an empty list.
  const [maintenanceToggled, setMaintenanceToggled] = useState<boolean | null>(null);

  const maintenanceAlerts = useMemo(
    () => alerts.filter((item) => item.category === 'maintenance'),
    [alerts]
  );

  const otherAlerts = useMemo(
    () => alerts.filter((item) => item.category !== 'maintenance'),
    [alerts]
  );

  const maintenanceUnread = useMemo(
    () => maintenanceAlerts.filter((item) => item.unread).length,
    [maintenanceAlerts]
  );

  /** Counts only the list this heading sits above; maintenance has its own. */
  const unreadCount = useMemo(
    () => otherAlerts.filter((item) => item.unread).length,
    [otherAlerts]
  );

  // "Mark all as read" means all of them, so it stays available while anything
  // is unread - including a maintenance notice hidden inside a collapsed group.
  const totalUnread = unreadCount + maintenanceUnread;

  const maintenanceOpen =
    maintenanceToggled ?? maintenanceAlerts.length < MAINTENANCE_COLLAPSE_THRESHOLD;

  const handleMarkAllAsRead = (): void => {
    markAllAsRead();
  };

  const handleOpenAlert = (id: string): void => {
    markAsRead(id);
  };

  /** One alert card. Shared so a maintenance notice looks like any other. */
  const renderAlert = (item: AlertItem): React.ReactElement => (
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
        <Ionicons name={item.icon} size={20} color={alertTone(item.tone, colors).solid} />
      </View>

      <View style={styles.alertContent}>
        <View style={styles.alertTopRow}>
          <Text style={styles.alertTitle}>{item.title}</Text>
          <View style={styles.alertActions}>
            {item.unread ? <View style={styles.unreadDot} /> : null}
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
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
  );

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

            {maintenanceAlerts.length > 0 ? (
              <View style={styles.maintenanceSection}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: maintenanceOpen }}
                  accessibilityLabel={`Maintenance, ${maintenanceAlerts.length} notice${
                    maintenanceAlerts.length === 1 ? '' : 's'
                  }${maintenanceUnread > 0 ? `, ${maintenanceUnread} unread` : ''}`}
                  onPress={() => setMaintenanceToggled(!maintenanceOpen)}
                  style={({ pressed }) => [
                    styles.maintenanceHeader,
                    pressed && styles.maintenanceHeaderPressed,
                  ]}
                >
                  <View style={styles.maintenanceHeaderLeft}>
                    <Text style={styles.maintenanceTitle}>Maintenance</Text>
                    <View style={styles.maintenanceCountPill}>
                      <Text style={styles.maintenanceCountText}>
                        {maintenanceAlerts.length}
                      </Text>
                    </View>
                    {/* Survives collapsing, so a new notice is never hidden. */}
                    {maintenanceUnread > 0 ? <View style={styles.unreadDot} /> : null}
                    {/* Last, so the row ends on its control rather than a dot. */}
                    <Ionicons
                      name={maintenanceOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                </Pressable>

                {maintenanceOpen ? (
                  <View style={styles.maintenanceList}>
                    {maintenanceAlerts.map(renderAlert)}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.unreadHeader}>
              {/* Two sibling Pressables rather than one nested inside the
                  other: nesting makes the outer row swallow taps meant for
                  "Mark all as read". */}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: !unreadCollapsed }}
                accessibilityLabel={`${unreadCount} unread alert${
                  unreadCount === 1 ? '' : 's'
                }`}
                onPress={() => setUnreadCollapsed((collapsed) => !collapsed)}
                style={({ pressed }) => [
                  styles.unreadTitleGroup,
                  pressed && styles.maintenanceHeaderPressed,
                ]}
              >
                <Text style={styles.unreadTitle}>
                  {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                </Text>
                <Ionicons
                  name={unreadCollapsed ? 'chevron-down' : 'chevron-up'}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>

              <Pressable disabled={totalUnread === 0} onPress={handleMarkAllAsRead}>
                <Text
                  style={[
                    styles.markReadText,
                    totalUnread === 0 && styles.markReadTextDisabled,
                  ]}
                >
                  Mark all as read
                </Text>
              </Pressable>
            </View>

            {unreadCollapsed ? null : (
              <View style={styles.alertList}>{otherAlerts.map(renderAlert)}</View>
            )}
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
    // Was hardcoded black, which is invisible on the dark theme's card. Every
    // other title on this screen already uses the palette.
    color: c.text,
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
  maintenanceSection: {
    marginBottom: 20,
  },
  // Deliberately a plain heading, not a card: it is the sibling of the
  // "N unread alerts" heading below and should carry the same weight.
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  maintenanceHeaderPressed: {
    opacity: 0.6,
  },
  maintenanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  maintenanceTitle: {
    color: c.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  maintenanceCountPill: {
    minWidth: 24,
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  maintenanceCountText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  maintenanceList: {
    gap: 12,
  },
  unreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  unreadTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
