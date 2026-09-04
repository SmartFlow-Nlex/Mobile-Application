import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../frontend/theme';

export default function TabLayout(): React.ReactElement {
	const { colors } = useTheme();

	return (
		<>
			{/*
			 * Every tab screen tops out in the brand navy, in both themes, so the
			 * clock and battery need light icons here whichever style the root
			 * layout picked for the rest of the app. Declared once for the whole
			 * tab section rather than per screen, so it does not depend on which
			 * tab happens to be mounted.
			 */}
			<StatusBar style="light" />

			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarStyle: {
						height: 64,
						backgroundColor: colors.surface,
						borderTopWidth: 1,
						borderTopColor: colors.border,
						paddingTop: 6,
						paddingBottom: 8,
						paddingHorizontal: 8,
					},
					tabBarActiveTintColor: colors.accent,
					tabBarInactiveTintColor: colors.textSecondary,
					tabBarActiveBackgroundColor: colors.primarySoft,
					tabBarInactiveBackgroundColor: 'transparent',
					tabBarItemStyle: {
						marginHorizontal: 3,
						borderRadius: 14,
						paddingVertical: 5,
					},
					tabBarLabelStyle: {
						fontSize: 10,
						fontWeight: '600',
						marginBottom: 0,
					},
				}}
			>
				<Tabs.Screen
					name="dashboard"
					options={{
						title: 'Dashboard',
						tabBarLabel: 'Dashboard',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name="home-outline" size={20} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="map"
					options={{
						title: 'Map',
						tabBarLabel: 'Map',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name="map-outline" size={20} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="community"
					options={{
						title: 'Community',
						tabBarLabel: 'Community',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name="people-outline" size={20} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="assistant"
					options={{
						title: 'Assistant',
						tabBarLabel: 'Assistant',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name="sparkles-outline" size={20} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="alerts"
					options={{
						title: 'Alerts',
						tabBarLabel: 'Alerts',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name="notifications-outline" size={20} color={color} />
						),
					}}
				/>
			</Tabs>
		</>
	);
}
