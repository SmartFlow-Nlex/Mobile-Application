import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AIAssistantFAB from '../../../components/community/AIAssistantFAB';
import { Colors } from '../../../constants/colors';
import { NlexDirection, northboundExits, southboundExits } from '../../../constants/nlexExits';
import { Typography } from '../../../constants/typography';

type ForecastStep = 'Now' | '+6h' | '+12h' | '+24h' | '+48h';
type TrafficLevel = 'smooth' | 'moderate' | 'heavy' | 'congestion';

interface MapStop {
  name: string;
  traffic: TrafficLevel;
  km: string;
  speed: number;
  side: 'left' | 'right';
}

const forecastSteps: ForecastStep[] = ['Now', '+6h', '+12h', '+24h', '+48h'];

const trafficStyles: Record<
  TrafficLevel,
  { borderColor: string; textColor: string; dotColor: string; label: string }
> = {
  smooth: {
    borderColor: '#22C55E',
    textColor: '#16A34A',
    dotColor: '#22C55E',
    label: 'Smooth Traffic',
  },
  moderate: {
    borderColor: '#FACC15',
    textColor: '#CA8A04',
    dotColor: '#EAB308',
    label: 'Moderate Traffic',
  },
  heavy: {
    borderColor: '#FB923C',
    textColor: '#EA580C',
    dotColor: '#F97316',
    label: 'Heavy Traffic',
  },
  congestion: {
    borderColor: '#F43F5E',
    textColor: '#E11D48',
    dotColor: '#EF4444',
    label: 'Congestion',
  },
};

const createStops = (direction: NlexDirection, step: ForecastStep): MapStop[] => {
  const exits = direction === 'northbound' ? northboundExits : southboundExits;
  const selectedExits =
    direction === 'northbound'
      ? [
          exits[0],
          exits[6],
          exits[17],
          exits[19],
          exits[21],
        ]
      : [
          exits[0],
          exits[5],
          exits[12],
          exits[16],
          exits[22],
        ];

  return selectedExits.map((exit, index) => {
    const sequence = (index + forecastSteps.indexOf(step)) % 4;
    const traffic: TrafficLevel =
      sequence === 0 ? 'moderate' : sequence === 1 ? 'heavy' : sequence === 2 ? 'smooth' : 'congestion';

    return {
      name: exit.name,
      traffic,
      km: `${(index * 17.8 + (direction === 'northbound' ? 0 : 6.3)).toFixed(1)} - ${(
        (index + 1) * 12.4 +
        forecastSteps.indexOf(step) * 1.3
      ).toFixed(0)}`,
      speed: 31 + index * 8 + forecastSteps.indexOf(step) * 2,
      side: index % 2 === 0 ? 'left' : 'right',
    };
  });
};

export default function MapScreen(): React.ReactElement {
  const [selectedStep, setSelectedStep] = useState<ForecastStep>('Now');
  const [direction, setDirection] = useState<NlexDirection>('northbound');

  const selectedIndex = forecastSteps.indexOf(selectedStep);
  const selectedStops = useMemo(
    () => createStops(direction, selectedStep),
    [direction, selectedStep]
  );

  const timestampLabel = useMemo(() => {
    const offsets: Record<ForecastStep, string> = {
      Now: '4/30/2026 07:10 AM',
      '+6h': '4/30/2026 01:10 PM',
      '+12h': '4/30/2026 07:10 PM',
      '+24h': '5/1/2026 07:10 AM',
      '+48h': '5/2/2026 07:10 AM',
    };

    return offsets[selectedStep];
  }, [selectedStep]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              <Ionicons name="map-outline" size={18} color={Colors.textInverse} />
            </View>
            <View style={styles.pageHeaderText}>
              <Text style={styles.pageTitle}>Map</Text>
              <Text style={styles.pageSubtitle}>
                Visualize predicted congestion up to 48 hours ahead
              </Text>
            </View>
          </View>

          <View style={styles.forecastCard}>
            <View style={styles.forecastTopRow}>
              <View>
                <Text style={styles.forecastCaption}>Viewing forecast for</Text>
                <Text style={styles.forecastTime}>{timestampLabel}</Text>
                <Text style={styles.forecastStatus}>Right now</Text>
              </View>

              <Pressable onPress={() => setSelectedStep('Now')} style={styles.resetButton}>
                <Ionicons name="refresh-outline" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${selectedIndex * 25}%` }]} />
              {forecastSteps.map((step, index) => (
                <Pressable
                  key={step}
                  onPress={() => setSelectedStep(step)}
                  style={[
                    styles.sliderDot,
                    {
                      left: `${index * 25}%`,
                      backgroundColor:
                        index <= selectedIndex ? Colors.primary : '#D1D5DB',
                    },
                    index === selectedIndex && styles.sliderDotActive,
                  ]}
                />
              ))}
            </View>

            <View style={styles.timeChipRow}>
              {forecastSteps.map((step) => (
                <Pressable
                  key={step}
                  onPress={() => setSelectedStep(step)}
                  style={[styles.timeChip, step === selectedStep && styles.timeChipActive]}
                >
                  <Text
                    style={[styles.timeChipText, step === selectedStep && styles.timeChipTextActive]}
                  >
                    {step}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.mapCard}>
            <View style={styles.directionToggle}>
              <Pressable
                onPress={() => setDirection('northbound')}
                style={[
                  styles.directionButton,
                  direction === 'northbound' && styles.directionButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.directionButtonText,
                    direction === 'northbound' && styles.directionButtonTextActive,
                  ]}
                >
                  ↑ Northbound
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setDirection('southbound')}
                style={[
                  styles.directionButton,
                  direction === 'southbound' && styles.directionButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.directionButtonText,
                    direction === 'southbound' && styles.directionButtonTextActive,
                  ]}
                >
                  ↓ Southbound
                </Text>
              </Pressable>
            </View>

            <View style={styles.directionPill}>
              <Text style={styles.directionPillText}>
                {direction === 'northbound' ? '↑ Going North' : '↓ Going South'}
              </Text>
            </View>

            <View style={styles.timeline}>
              <View style={styles.verticalLine} />

              {selectedStops.map((stop, index) => {
                const trafficStyle = trafficStyles[stop.traffic];
                return (
                  <View key={`${direction}-${stop.name}`} style={styles.timelineRow}>
                    {stop.side === 'left' ? (
                      <View style={[styles.exitCard, { borderColor: trafficStyle.borderColor }]}>
                        <Text style={styles.exitTitle}>{stop.name}</Text>
                        <Text style={[styles.exitTraffic, { color: trafficStyle.textColor }]}>
                          {trafficStyle.label}
                        </Text>
                        <Text style={styles.exitMeta}>KM {stop.km} km/h</Text>
                        <Text style={styles.exitMeta}>{selectedStops[index].speed} km/h</Text>
                      </View>
                    ) : (
                      <View style={styles.cardSpacer} />
                    )}

                    <View style={styles.dotColumn}>
                      <View style={[styles.exitDot, { backgroundColor: trafficStyle.dotColor }]} />
                    </View>

                    {stop.side === 'right' ? (
                      <View style={[styles.exitCard, { borderColor: trafficStyle.borderColor }]}>
                        <Text style={styles.exitTitle}>{stop.name}</Text>
                        <Text style={[styles.exitTraffic, { color: trafficStyle.textColor }]}>
                          {trafficStyle.label}
                        </Text>
                        <Text style={styles.exitMeta}>KM {stop.km} km/h</Text>
                        <Text style={styles.exitMeta}>{selectedStops[index].speed} km/h</Text>
                      </View>
                    ) : (
                      <View style={styles.cardSpacer} />
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.legend}>
              <Text style={styles.legendTitle}>Traffic Legend</Text>
              <View style={styles.legendRow}>
                {(['smooth', 'moderate', 'heavy', 'congestion'] as TrafficLevel[]).map((item) => (
                  <View key={item} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: trafficStyles[item].dotColor },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {item === 'smooth'
                        ? 'Smooth Flow'
                        : item.charAt(0).toUpperCase() + item.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
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
    backgroundColor: Colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 120,
  },
  headerBar: {
    backgroundColor: '#2563EB',
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
  pageHeaderText: {
    flex: 1,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  pageSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginTop: 4,
  },
  forecastCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  forecastTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  forecastCaption: {
    color: '#64748B',
    fontSize: Typography.fontSize.xs,
    marginBottom: 4,
  },
  forecastTime: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  forecastStatus: {
    color: '#64748B',
    fontSize: Typography.fontSize.xs,
  },
  resetButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 18,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  sliderDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
  sliderDotActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    top: 3,
  },
  timeChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    flex: 1,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F7',
  },
  timeChipActive: {
    backgroundColor: Colors.primary,
  },
  timeChipText: {
    color: '#334155',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  timeChipTextActive: {
    color: Colors.textInverse,
  },
  mapCard: {
    marginHorizontal: 10,
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D9E6F7',
  },
  directionToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 24,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  directionButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionButtonActive: {
    backgroundColor: Colors.primary,
  },
  directionButtonText: {
    color: '#334155',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  directionButtonTextActive: {
    color: Colors.textInverse,
  },
  directionPill: {
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 18,
  },
  directionPillText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  timeline: {
    position: 'relative',
    paddingTop: 8,
  },
  verticalLine: {
    position: 'absolute',
    top: 8,
    bottom: 56,
    left: '50%',
    marginLeft: -1.5,
    width: 3,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 146,
  },
  cardSpacer: {
    flex: 1,
  },
  dotColumn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  exitCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  exitTitle: {
    color: '#111827',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  exitTraffic: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: 6,
  },
  exitMeta: {
    color: '#64748B',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  legend: {
    borderTopWidth: 1,
    borderTopColor: '#D6E1EF',
    marginTop: 10,
    paddingTop: 16,
  },
  legendTitle: {
    color: '#334155',
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#475569',
    fontSize: Typography.fontSize.xs,
  },
});
