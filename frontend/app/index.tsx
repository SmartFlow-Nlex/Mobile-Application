import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface SplashScreenProps {}

/**
 * Splash/Onboarding Screen
 * Entry point of the application
 */
const SplashScreen: React.FC<SplashScreenProps> = () => {
  const router = useRouter();

  useEffect(() => {
    // Auto-navigate to dashboard after 2 seconds
    // Comment out this line if you want to keep the splash screen visible
    // const timer = setTimeout(() => {
    //   router.replace('/(tabs)/dashboard');
    // }, 2000);
    // return () => clearTimeout(timer);
  }, [router]);

  const handleGetStarted = (): void => {
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Brand Name */}
        <Text style={styles.logo}>SmartFlow</Text>
        <Text style={styles.logoSubtitle}>NLEX</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Real-time Traffic Intelligence
        </Text>
        <Text style={styles.taglineSubtitle}>
          Navigate with confidence, always
        </Text>

        {/* Call to Action */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Secondary CTA */}
        <TouchableOpacity
          style={styles.secondaryCTA}
          onPress={handleGetStarted}
        >
          <Text style={styles.secondaryCTAText}>Or skip to dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </View>
  );
};

export default SplashScreen;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  logoSubtitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 32,
  },
  tagline: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  taglineSubtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  secondaryCTA: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryCTAText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '400',
    color: Colors.textTertiary,
  },
});
