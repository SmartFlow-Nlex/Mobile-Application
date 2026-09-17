import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MIN_PASSWORD_LENGTH, useAuth } from '../frontend/auth';
import AuthField from '../frontend/components/auth/AuthField';
import { useTheme, useThemedStyles } from '../frontend/theme';
import type { ThemePalette } from '../frontend/theme';
import { Typography } from '../frontend/constants/typography';

export default function SignUpScreen(): React.ReactElement {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /** Drop a stale complaint as soon as the user starts fixing the field. */
  const edit =
    (setter: (value: string) => void) =>
    (value: string): void => {
      setter(value);
      setError(null);
    };

  const handleCreateAccount = async (): Promise<void> => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signUp({ fullName, email, password });
      router.replace('/(tabs)/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSignIn = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/sign-in');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              hitSlop={6}
              onPress={handleBackToSignIn}
              style={styles.backRow}
            >
              <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
              <Text style={styles.backText}>Back to sign in</Text>
            </Pressable>

            <Text style={styles.cardTitle}>Create your account</Text>
            <Text style={styles.cardSubtitle}>Fill in your details to get started.</Text>

            <AuthField
              testID="sign-up-name"
              autoCapitalize="words"
              autoComplete="name"
              icon="person-outline"
              label="Full Name"
              onChangeText={edit(setFullName)}
              placeholder="Enter your full name"
              value={fullName}
            />

            <AuthField
              testID="sign-up-email"
              autoComplete="email"
              icon="mail-outline"
              keyboardType="email-address"
              label="Email Address"
              onChangeText={edit(setEmail)}
              placeholder="Enter your email"
              value={email}
            />

            <AuthField
              testID="sign-up-password"
              autoComplete="new-password"
              icon="lock-closed-outline"
              label="Password"
              onChangeText={edit(setPassword)}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              secure
              value={password}
            />

            {error !== null ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
              disabled={isSubmitting}
              onPress={() => void handleCreateAccount()}
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonBusy]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable accessibilityRole="link" hitSlop={6} onPress={handleBackToSignIn}>
                <Text style={styles.linkText}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.primary,
    },
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 40,
      flexGrow: 1,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 20,
      shadowColor: c.cardShadow,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    backText: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
    },
    cardTitle: {
      color: c.text,
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
    },
    cardSubtitle: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.normal,
      marginTop: 6,
      marginBottom: 18,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.statusHeavyBg,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    errorBannerText: {
      color: c.danger,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.semibold,
      flex: 1,
    },
    primaryButton: {
      height: 50,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    primaryButtonBusy: {
      opacity: 0.75,
    },
    primaryButtonText: {
      color: c.textInverse,
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.bold,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: 16,
    },
    footerText: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.normal,
    },
    linkText: {
      color: c.accent,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.bold,
    },
  });
