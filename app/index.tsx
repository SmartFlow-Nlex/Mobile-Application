import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../frontend/auth';
import { useTheme, useThemedStyles } from '../frontend/theme';
import type { ThemePalette } from '../frontend/theme';

export default function Index(): React.ReactElement {
	const { status } = useAuth();
	const { colors } = useTheme();
	const styles = useThemedStyles(makeStyles);

	// Hold the launch route until the stored session has been read back, so a
	// returning user is not flashed the sign-in screen before landing.
	if (status === 'loading') {
		return (
			<View style={styles.screen}>
				<ActivityIndicator color={colors.accent} size="large" />
			</View>
		);
	}

	return <Redirect href={status === 'signedIn' ? '/(tabs)/dashboard' : '/sign-in'} />;
}

const makeStyles = (c: ThemePalette) =>
	StyleSheet.create({
		screen: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: c.background,
		},
	});
