import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
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
import { useTheme, useThemedStyles } from '../../../theme';
import AvatarButton from '../../../components/AvatarButton';
import type { ThemePalette } from '../../../theme';
import { addHours, describeHourOffset, formatDateTime } from '../../../lib/datetime';
import useNow from '../../../hooks/useNow';
import LiveCorridorStatus from '../../../components/map/LiveCorridorStatus';
import { Typography } from '../../../constants/typography';

type ForecastStep = 'Now' | '+6h' | '+12h' | '+24h' | '+48h';
const forecastSteps: ForecastStep[] = ['Now', '+6h', '+12h', '+24h', '+48h'];

/** Hours-ahead each forecast chip represents. */
const forecastHours: Record<ForecastStep, number> = {
  Now: 0,
  '+6h': 6,
  '+12h': 12,
  '+24h': 24,
  '+48h': 48,
};

export default function MapScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const [selectedStep, setSelectedStep] = useState<ForecastStep>('Now');

  const selectedIndex = forecastSteps.indexOf(selectedStep);

  // Coarse ticker: minute-level precision is plenty for a 6h/12h/24h/48h horizon.
  const now = useNow(30000);
  const forecastAt = useMemo(
    () => addHours(now, forecastHours[selectedStep]),
    [now, selectedStep],
  );
  const horizonLabel = describeHourOffset(forecastHours[selectedStep]);
  const timestampLabel = useMemo(() => formatDateTime(forecastAt), [forecastAt]);

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
              </View>
            </View>

            <AvatarButton initials="NT" onPress={() => router.push('/profile')} />
          </View>

          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderIcon}>
              <Ionicons name="map-outline" size={18} color={colors.textInverse} />
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
                <Text style={styles.forecastStatus}>{horizonLabel}</Text>
              </View>

              <Pressable onPress={() => setSelectedStep('Now')} style={styles.resetButton}>
                <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
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
                        index <= selectedIndex ? colors.accent : colors.border,
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
            <LiveCorridorStatus />
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
  pageHeaderText: {
    flex: 1,
  },
  pageTitle: {
    color: c.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  pageSubtitle: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginTop: 4,
  },
  forecastCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.cardShadow,
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
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginBottom: 4,
  },
  forecastTime: {
    color: c.accent,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  forecastStatus: {
    color: c.textSecondary,
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
    backgroundColor: c.primary,
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
    backgroundColor: c.hairline,
  },
  timeChipActive: {
    backgroundColor: c.primary,
  },
  timeChipText: {
    color: c.text,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  timeChipTextActive: {
    color: c.textInverse,
  },
  mapCard: {
    marginHorizontal: 10,
    backgroundColor: c.surfaceSubtle,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: c.primarySoft,
  },
});
