import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../frontend/auth';
import AuthField from '../frontend/components/auth/AuthField';
import { useTheme, useThemedStyles } from '../frontend/theme';
import type { ThemePalette } from '../frontend/theme';
import { Typography } from './constants/typography';

export default function SignInScreen(): React.ReactElement {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /** Drop a stale complaint as soon as the user starts fixing the field. */
  const edit =
    (setter: (value: string) => void) =>
    (value: string): void => {
      setter(value);
      setError(null);
    };

  const handleSignIn = async (): Promise<void> => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn({ email, password, remember });
      router.replace('/(tabs)/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (): void => {
    Alert.alert(
      'Password reset',
      'Password reset is not available yet. Ask the SmartFlow team to reset it for you.',
    );
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
          <View style={styles.brandBlock}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../frontend/assets/smartflow-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>SmartFlow NLEX</Text>
            <Text style={styles.brandTagline}>Decision-Intelligence System</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            <AuthField
              testID="sign-in-email"
              autoComplete="email"
              icon="person-outline"
              keyboardType="email-address"
              label="Username / Email"
              onChangeText={edit(setEmail)}
              placeholder="Enter your email"
              value={email}
            />

            <AuthField
              testID="sign-in-password"
              autoComplete="password"
              icon="lock-closed-outline"
              label="Password"
              onChangeText={edit(setPassword)}
              placeholder="Enter your password"
              secure
              value={password}
            />

            {error !== null ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.dangerRed} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.optionsRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: remember }}
                hitSlop={6}
                onPress={() => setRemember((current) => !current)}
                style={styles.rememberGroup}
              >
                <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                  {remember ? (
                    <Ionicons name="checkmark" size={13} color={colors.textInverse} />
                  ) : null}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </Pressable>

              <Pressable hitSlop={6} onPress={handleForgotPassword}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => void handleSignIn()}
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonBusy]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don&apos;t have an account? </Text>
              <Pressable hitSlop={6} onPress={() => router.push('/sign-up')}>
                <Text style={styles.linkText}>Create account</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.copyright}>
            © {new Date().getFullYear()} SmartFlow NLEX. All rights reserved.
          </Text>
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
      paddingTop: 32,
      paddingBottom: 40,
      flexGrow: 1,
      justifyContent: 'center',
    },
    brandBlock: {
      alignItems: 'center',
      marginBottom: 26,
    },
    logoWrap: {
      width: 72,
      height: 72,
      borderRadius: 22,
      // Deliberately white in both themes: the logo's dark navy strokes
      // disappear against a navy or dark tile.
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.hairline,
    },
    logo: {
      width: 48,
      height: 48,
    },
    brandTitle: {
      color: c.text,
      fontSize: Typography.fontSize['2xl'],
      fontWeight: Typography.fontWeight.bold,
    },
    brandTagline: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
      marginTop: 4,
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
    cardTitle: {
      color: c.text,
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
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
      color: c.dangerRed,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.semibold,
      flex: 1,
    },
    optionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
      marginTop: 2,
    },
    rememberGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    rememberText: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
    },
    linkText: {
      color: c.accent,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.bold,
    },
    primaryButton: {
      height: 50,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
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
    copyright: {
      color: c.textTertiary,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.normal,
      textAlign: 'center',
      marginTop: 22,
    },
  });
