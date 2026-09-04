import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { useTheme, useThemedStyles } from '../../../theme';
import AvatarButton from '../../../components/AvatarButton';
import type { ThemePalette } from '../../../theme';
import { Typography } from '../../../constants/typography';

const quickQuestions = [
  'What time should I leave tomorrow?',
  'Will there be traffic at Bocaue?',
  'Best alternate route tonight?',
] as const;

export default function AssistantScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const [message, setMessage] = useState<string>('');

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
              <Ionicons name="hardware-chip-outline" size={18} color={colors.textInverse} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Traffic Assistant</Text>
              <View style={styles.pageSubtitleRow}>
                <Ionicons name="sparkles-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.pageSubtitle}>ML-Powered Predictions</Text>
              </View>
            </View>
          </View>

          <View style={styles.chatRow}>
            <View style={styles.assistantBadge}>
              <Ionicons name="hardware-chip-outline" size={16} color={colors.textInverse} />
            </View>

            <View style={styles.chatColumn}>
              <View style={styles.chatBubble}>
                <Text style={styles.chatText}>
                  Hello! I&apos;m your SmartFlow NLEX Assistant. How can I help you plan your
                  journey today?
                </Text>
              </View>
              <Text style={styles.timeText}>12:22 AM</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.composerShell}>
          <Text style={styles.quickLabel}>Quick questions:</Text>
          <View style={styles.quickRow}>
            <Ionicons name="caret-back" size={14} color={colors.textSecondary} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickQuestionsRow}
            >
              {quickQuestions.map((item) => (
                <Pressable key={item} style={styles.quickChip}>
                  <Text numberOfLines={1} style={styles.quickChipText}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Ionicons name="caret-forward" size={14} color={colors.textSecondary} />
          </View>

          <View style={styles.inputRow}>
            <TextInput
              onChangeText={setMessage}
              placeholder="Ask about traffic, routes, or departure"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={message}
            />
            <Pressable style={styles.sendButton}>
              <Ionicons name="paper-plane-outline" size={20} color={colors.textInverse} />
            </Pressable>
          </View>
        </View>
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
    backgroundColor: c.surface,
  },
  content: {
    paddingBottom: 24,
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
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  pageHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C5CFA',
  },
  pageTitle: {
    color: c.text,
    fontSize: 18,
    fontWeight: Typography.fontWeight.bold,
  },
  pageSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  pageSubtitle: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  assistantBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C5CFA',
    marginRight: 10,
  },
  chatColumn: {
    flex: 1,
  },
  chatBubble: {
    maxWidth: '84%',
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  chatText: {
    color: c.text,
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
  },
  timeText: {
    color: c.textTertiary,
    fontSize: Typography.fontSize.xs,
    marginTop: 8,
    marginLeft: 8,
  },
  composerShell: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 16,
    backgroundColor: c.surface,
  },
  quickLabel: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: 10,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  quickQuestionsRow: {
    gap: 8,
    paddingHorizontal: 6,
  },
  quickChip: {
    height: 30,
    borderRadius: 12,
    backgroundColor: c.surfaceMuted,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  quickChipText: {
    color: c.text,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    color: c.text,
    fontSize: Typography.fontSize.base,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.borderLight,
  },
});
