import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, StyleSheet, Text, Pressable, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import AvatarButton from '../../components/AvatarButton';

interface EventCardData {
  title: string;
  venue: string;
  dateTime: string;
  severityLabel: string;
  severityColor: string;
  affected: string[];
  attendance: string;
}

const filterOptions = ['Right Now', 'Today', 'This Week'] as const;
const forecastTimes = ['Now', '+1h', '+3h', '+6h', '+12h', '+24h'] as const;

export default function DashboardScreen(): React.ReactElement {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]>('Right Now');
  const [activeForecast, setActiveForecast] = useState<(typeof forecastTimes)[number]>('Now');

  const forecastStamp = useMemo(() => '4/29/2026 12:06 AM', []);

  const eventCards: EventCardData[] = [
    {
      title: 'Concert at Philippine Arena',
      venue: 'Philippine Arena',
      dateTime: '3/21/2026 at 07:00 PM',
      severityLabel: 'Severe',
      severityColor: Colors.danger,
      affected: ['Bocaue', 'Marilao'],
      attendance: '45,000',
    },
    {
      title: 'Basketball Championship Finals',
      venue: 'Smart Araneta Coliseum',
      dateTime: '3/20/2026 at 06:00 PM',
      severityLabel: 'High',
      severityColor: Colors.warning,
      affected: ['Balintawak Cloverleaf', 'Novaliches'],
      attendance: '20,000',
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBar}>
            <View style={styles.brandGroup}>
              <View style={styles.brandIcon}>
                <Image
                  source={require('../../assets/smartflow-logo.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.brandTitle}>SmartFlow NLEX</Text>
                <Text style={styles.brandSubtitle}>Predictive Traffic Intelligence</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable style={styles.bellButton} onPress={() => router.push('/notifications')}>
                <Ionicons name="notifications-outline" size={20} color={Colors.surface} />
              </Pressable>
              <AvatarButton initials="NT" onPress={() => router.push('/profile')} />
            </View>
          </View>

          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderIcon}>
              <Ionicons name="grid-outline" size={18} color={Colors.textInverse} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Dashboard</Text>
              <Text style={styles.pageSubtitle}>Live traffic overview and predictive insights</Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.filterRow}>
              {filterOptions.map((item) => (
                <Pill
                  key={item}
                  label={item}
                  active={item === activeFilter}
                  onPress={() => setActiveFilter(item)}
                />
              ))}
            </View>

            <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryLabel}>Current Status</Text>
              <Text style={styles.summaryTitle}>NLEX Traffic</Text>
            </View>
            <Ionicons name="pulse-outline" size={24} color={Colors.surface} />
          </View>

          <View style={styles.updatedRow}>
            <Ionicons name="time-outline" size={15} color={Colors.surface} />
            <Text style={styles.updatedText}>Updated 12:06:47 AM</Text>
          </View>

          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Active Incidents</Text>
              <Text style={styles.metricValue}>3</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Avg Delay</Text>
              <Text style={styles.metricValue}>12 min</Text>
            </View>
          </View>
            </View>

            <Text style={styles.sectionTitle}>Traffic Forecast</Text>
            <View style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <View>
              <Text style={styles.forecastLabel}>Forecast Time</Text>
              <Text style={styles.forecastStamp}>{forecastStamp}</Text>
              <Text style={styles.forecastSubtext}>Right now</Text>
            </View>
            <Pressable style={styles.resetPill}>
              <Text style={styles.resetPillText}>Reset</Text>
            </Pressable>
          </View>

          <View style={styles.chipRow}>
            {forecastTimes.map((item) => (
              <ForecastChip
                key={item}
                label={item}
                active={item === activeForecast}
                onPress={() => setActiveForecast(item)}
              />
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.selectRow}>
            <View>
              <Text style={styles.forecastLabel}>Select specific time (hours ahead)</Text>
              <Text style={styles.selectValue}>Now - 12:06 AM 4/29/2026</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
          </View>
            </View>

            <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="swap-horizontal-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Segment Status</Text>
          </View>
            </View>

            <View style={styles.segmentCard}>
          <Text style={styles.fieldLabel}>Direction</Text>
          <View style={styles.fieldRow}>
            <View style={styles.directionBadge}>
              <Ionicons name="caret-up-circle" size={15} color={Colors.primary} />
              <Text style={styles.directionBadgeText}>Northbound</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={Colors.textTertiary} />
          </View>

          <Text style={styles.fieldLabel}>From</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.placeholderText}>Starting point</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.textTertiary} />
          </View>

          <Text style={styles.fieldLabel}>To</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.placeholderText}>Destination</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.textTertiary} />
          </View>
            </View>

            <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Event-Triggered Forecasts</Text>
          </View>
            </View>

            <View style={styles.eventsList}>
              {eventCards.map((event) => (
                <View key={event.title} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventTextGroup}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventVenue}>{event.venue}</Text>
                      <Text style={styles.eventDate}>{event.dateTime}</Text>
                    </View>

                    <View
                      style={[styles.severityPill, { backgroundColor: event.severityColor + '18' }]}
                    >
                      <Text style={[styles.severityPillText, { color: event.severityColor }]}>
                        {event.severityLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventMetaRow}>
                    <Text style={styles.affectedLabel}>Affected:</Text>
                    <View style={styles.affectedChipRow}>
                      {event.affected.map((item) => (
                        <View key={item} style={styles.affectedChip}>
                          <Text style={styles.affectedChipText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Text style={styles.expectedText}>Expected attendance: {event.attendance}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.fab}>
          <Ionicons name="chatbubble-ellipses" size={22} color={Colors.surface} />
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface PillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

const Pill: React.FC<PillProps> = ({ label, active, onPress }) => (
  <Pressable onPress={onPress} style={[styles.filterPill, active && styles.filterPillActive]}>
    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
  </Pressable>
);

interface ForecastChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

const ForecastChip: React.FC<ForecastChipProps> = ({ label, active, onPress }) => (
  <Pressable onPress={onPress} style={[styles.forecastChip, active && styles.forecastChipActive]}>
    <Text style={[styles.forecastChipText, active && styles.forecastChipTextActive]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 128,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandLogo: {
    width: 22,
    height: 22,
  },
  brandTitle: {
    color: Colors.surface,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    lineHeight: 20,
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    backgroundColor: Colors.primary,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    marginTop: 4,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: Colors.surface,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: 6,
  },
  summaryTitle: {
    color: Colors.surface,
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 14,
  },
  updatedText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    marginBottom: 6,
  },
  metricValue: {
    color: Colors.surface,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  forecastCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  forecastLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  forecastStamp: {
    color: Colors.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  forecastSubtext: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  resetPill: {
    backgroundColor: '#EDF4FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  resetPillText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  forecastChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  forecastChipActive: {
    backgroundColor: Colors.primary,
  },
  forecastChipText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  forecastChipTextActive: {
    color: Colors.surface,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  selectValue: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionHeaderRow: {
    marginTop: 4,
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    marginBottom: 16,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 8,
  },
  fieldRow: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FBFCFE',
    paddingHorizontal: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directionBadgeText: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  placeholderText: {
    color: Colors.textTertiary,
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  eventTextGroup: {
    flex: 1,
  },
  eventTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    marginBottom: 3,
  },
  eventVenue: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 3,
  },
  eventDate: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  severityPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  severityPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
  },
  eventMetaRow: {
    marginTop: 12,
    gap: 8,
  },
  affectedLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  affectedChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  affectedChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EDF4FF',
  },
  affectedChipText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  expectedText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 98,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  aiBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  aiBadgeText: {
    color: Colors.surface,
    fontSize: 9,
    fontWeight: '800',
  },
});
