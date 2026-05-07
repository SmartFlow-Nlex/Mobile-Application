import React, { useState } from 'react';
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
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

const quickQuestions = [
  'What time should I leave tomorrow?',
  'Will there be traffic at Bocaue?',
  'Best alternate route tonight?',
] as const;

export default function AssistantScreen(): React.ReactElement {
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
                <Text style={styles.headerSubtitle}>Predictive Traffic Intelligence</Text>
              </View>
            </View>

            <Pressable style={styles.headerIconButton}>
              <Ionicons name="notifications-outline" size={21} color={Colors.textInverse} />
            </Pressable>
          </View>

          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderIcon}>
              <Ionicons name="hardware-chip-outline" size={18} color={Colors.textInverse} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Traffic Assistant</Text>
              <View style={styles.pageSubtitleRow}>
                <Ionicons name="sparkles-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.pageSubtitle}>ML-Powered Predictions</Text>
              </View>
            </View>
          </View>

          <View style={styles.chatRow}>
            <View style={styles.assistantBadge}>
              <Ionicons name="hardware-chip-outline" size={16} color={Colors.textInverse} />
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
            <Ionicons name="caret-back" size={14} color={Colors.textSecondary} />
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
            <Ionicons name="caret-forward" size={14} color={Colors.textSecondary} />
          </View>

          <View style={styles.inputRow}>
            <TextInput
              onChangeText={setMessage}
              placeholder="Ask about traffic, routes, or departure"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              value={message}
            />
            <Pressable style={styles.sendButton}>
              <Ionicons name="paper-plane-outline" size={20} color={Colors.textInverse} />
            </Pressable>
          </View>
        </View>
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
    paddingBottom: 24,
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#111827',
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
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  chatText: {
    color: '#111827',
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
  },
  timeText: {
    color: '#94A3B8',
    fontSize: Typography.fontSize.xs,
    marginTop: 8,
    marginLeft: 8,
  },
  composerShell: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  quickLabel: {
    color: Colors.textSecondary,
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  quickChipText: {
    color: '#111827',
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
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    color: '#111827',
    fontSize: Typography.fontSize.base,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B9C7DB',
  },
});
