import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export default function TabLayout(): React.ReactElement {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					height: 64,
					backgroundColor: Colors.surface,
					borderTopWidth: 1,
					borderTopColor: Colors.border,
					paddingTop: 6,
					paddingBottom: 8,
					paddingHorizontal: 8,
				},
				tabBarActiveTintColor: Colors.primary,
				tabBarInactiveTintColor: Colors.textSecondary,
				tabBarActiveBackgroundColor: '#EAF2FF',
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
	);
}
