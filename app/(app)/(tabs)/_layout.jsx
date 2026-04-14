import { Platform, View, useColorScheme } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import useVolunteerBear from '../../../store/volunteer.store'
import useThemeBear from '../../../store/theme.store'

export default function TabsLayout() {
    const { volunteer } = useVolunteerBear(state=>state)
    const { themePreference } = useThemeBear(state=>state)
    const systemColorScheme = useColorScheme()

    const resolvedTheme = themePreference === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themePreference
    const isDarkMode = resolvedTheme === 'dark'

    const tabBarBackgroundColor = isDarkMode ? '#111827' : '#ffffff'
    const tabBarShadowColor = isDarkMode ? '#000000' : '#111827'
    const activeTintColor = isDarkMode ? '#f87171' : '#dc2626'
    const inactiveTintColor = isDarkMode ? '#6b7280' : '#9ca3af'

    const buildTabIcon = (iconName) => ({ size, color, focused }) => (
        <View
            style={{
                width: focused ? 38 : 32,
                height: focused ? 28 : 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused
                    ? (isDarkMode ? 'rgba(248, 113, 113, 0.25)' : 'rgba(220, 38, 38, 0.12)')
                    : 'transparent',
            }}
        >
            <Ionicons name={iconName} size={focused ? size + 1 : size} color={color} />
        </View>
    )

  return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: activeTintColor,
                tabBarInactiveTintColor: inactiveTintColor,
                tabBarHideOnKeyboard: true,
                sceneStyle: {
                    paddingBottom: Platform.OS === 'ios' ? 92 : 78,
                    backgroundColor: isDarkMode ? '#0b1220' : '#f8fafc',
                },
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.35,
                    marginBottom: 1,
                },
                tabBarItemStyle: {
                    paddingVertical: 2,
                    borderRadius: 14,
                },
                tabBarStyle: {
                    position: 'absolute',
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
                    paddingHorizontal: 12,
                    marginHorizontal: 14,
                    marginBottom: Platform.OS === 'ios' ? 12 : 8,
                    borderRadius: 22,
                    backgroundColor: tabBarBackgroundColor,
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: tabBarShadowColor,
                    shadowOpacity: isDarkMode ? 0.32 : 0.08,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 12,
                },
            }}
        >
            <Tabs.Screen
                name='(home)'
                options={{
                    title: volunteer ? 'Alerts' : 'Home',
                    tabBarLabel: volunteer ? 'Alerts' : 'Home',
                    tabBarIcon: buildTabIcon('home'),
                }}
            />

            <Tabs.Screen
                name='history'
                options={{
                    href: volunteer ? null : '/history',
                    title: 'History',
                    tabBarLabel: 'History',
                    lazy: false,
                    tabBarIcon: buildTabIcon('time'),
                }}
            />

            <Tabs.Screen
                name='account'
                options={{
                    title: 'Account',
                    tabBarLabel: 'Account',
                    tabBarIcon: buildTabIcon('person'),
                }}
            />
    </Tabs>
  )
}