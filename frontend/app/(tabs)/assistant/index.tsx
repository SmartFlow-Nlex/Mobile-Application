import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme, useThemedStyles } from '../../../theme';
import AvatarButton from '../../../components/AvatarButton';
import type { ThemePalette } from '../../../theme';
import { Typography } from '../../../constants/typography';
import { AssistantError, ChatMessage, askAssistant } from '../../../lib/assistantApi';

const quickQuestions = [
  'How is NLEX right now?',
  'May traffic ba sa Bocaue?',
  'Is Balintawak clear southbound?',
] as const;

/**
 * Shown before the first question, as a panel rather than a chat bubble.
 *
 * It used to be seeded into the message list as an assistant message, which
 * made it look like the model had spoken when it had not. Every bubble in this
 * screen is now the model's own words and nothing else.
 */
const INTRO_TEXT =
  "Ask about traffic, exits or travel times along the NLEX corridor.";

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function AssistantScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const [draft, setDraft] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const send = useCallback(
    async (text: string): Promise<void> => {
      const question = text.trim();
      if (question.length === 0 || isThinking) {
        return;
      }

      const userMessage: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: question,
        at: Date.now(),
      };

      // History is what came before this question - the new one is sent
      // separately, so including it here would duplicate it.
      const history = messages;

      setMessages((current) => [...current, userMessage]);
      setDraft('');
      setError(null);
      setIsThinking(true);

      try {
        const { reply } = await askAssistant(question, history);
        setMessages((current) => [
          ...current,
          { id: `a-${Date.now()}`, role: 'assistant', text: reply, at: Date.now() },
        ]);
      } catch (caught) {
        setError(
          caught instanceof AssistantError
            ? caught.message
            : 'Something went wrong. Please try again.',
        );
      } finally {
        setIsThinking(false);
      }
    },
    [isThinking, messages],
  );

  const canSend = draft.trim().length > 0 && !isThinking;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
        >
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

          {messages.length === 0 ? (
            <View style={styles.intro}>
              <Ionicons name="chatbubbles-outline" size={26} color={colors.textSecondary} />
              <Text style={styles.introText}>{INTRO_TEXT}</Text>
            </View>
          ) : null}

          {messages.map((message) =>
            message.role === 'assistant' ? (
              <View key={message.id} style={styles.chatRow}>
                <View style={styles.assistantBadge}>
                  <Ionicons
                    name="hardware-chip-outline"
                    size={16}
                    color={colors.textInverse}
                  />
                </View>
                <View style={styles.chatColumn}>
                  <View style={styles.chatBubble}>
                    <Text style={styles.chatText}>{message.text}</Text>
                  </View>
                  <Text style={styles.timeText}>{formatTime(message.at)}</Text>
                </View>
              </View>
            ) : (
              <View key={message.id} style={styles.userRow}>
                <View style={styles.userColumn}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{message.text}</Text>
                  </View>
                  <Text style={styles.userTimeText}>{formatTime(message.at)}</Text>
                </View>
              </View>
            ),
          )}

          {isThinking ? (
            <View style={styles.chatRow}>
              <View style={styles.assistantBadge}>
                <Ionicons name="hardware-chip-outline" size={16} color={colors.textInverse} />
              </View>
              <View style={styles.chatColumn}>
                <View style={[styles.chatBubble, styles.thinkingBubble]}>
                  <ActivityIndicator color={colors.textSecondary} size="small" />
                  <Text style={styles.thinkingText}>Checking live NLEX data...</Text>
                </View>
              </View>
            </View>
          ) : null}

          {error !== null ? (
            <View style={styles.errorBanner}>
              <Ionicons name="cloud-offline-outline" size={16} color={colors.dangerRed} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
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
                <Pressable
                  disabled={isThinking}
                  key={item}
                  onPress={() => void send(item)}
                  style={({ pressed }) => [
                    styles.quickChip,
                    pressed && styles.quickChipPressed,
                    isThinking && styles.quickChipDisabled,
                  ]}
                >
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
              editable={!isThinking}
              onChangeText={setDraft}
              onSubmitEditing={() => void send(draft)}
              placeholder="Ask about traffic, routes, or departure"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="send"
              style={styles.input}
              testID="assistant-input"
              value={draft}
            />
            <Pressable
              accessibilityLabel="Send message"
              accessibilityRole="button"
              disabled={!canSend}
              onPress={() => void send(draft)}
              style={[styles.sendButton, canSend && styles.sendButtonActive]}
              testID="assistant-send"
            >
              <Ionicons
                name="paper-plane-outline"
                size={20}
                color={canSend ? colors.textInverse : colors.textTertiary}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    // Same reason as the Community tab: the chat bubbles are c.surface, so a
    // c.surface page made them invisible in dark mode.
    flex: 1,
    backgroundColor: c.background,
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
  intro: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 30,
    paddingVertical: 28,
  },
  introText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
    textAlign: 'center',
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
    maxWidth: '90%',
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
  },
  thinkingText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
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
  userRow: {
    paddingHorizontal: 16,
    paddingTop: 18,
    alignItems: 'flex-end',
  },
  userColumn: {
    maxWidth: '86%',
    alignItems: 'flex-end',
  },
  userBubble: {
    backgroundColor: c.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userText: {
    color: c.textInverse,
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
  },
  userTimeText: {
    color: c.textTertiary,
    fontSize: Typography.fontSize.xs,
    marginTop: 6,
    marginRight: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: c.statusHeavyBg,
  },
  errorText: {
    color: c.dangerRed,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
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
  quickChipPressed: {
    backgroundColor: c.pressed,
  },
  quickChipDisabled: {
    opacity: 0.5,
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
  sendButtonActive: {
    backgroundColor: c.primary,
  },
});
