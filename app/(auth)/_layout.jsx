import { Platform, View, useColorScheme } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import useThemeBear from '../../store/theme.store'

export default function AuthLayout() {
    const { themePreference } = useThemeBear((state) => state)
    const systemColorScheme = useColorScheme()

    const resolvedTheme = themePreference === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themePreference
    const isDarkMode = resolvedTheme === 'dark'

    const activeTintColor = isDarkMode ? '#f87171' : '#dc2626'
    const inactiveTintColor = isDarkMode ? '#6b7280' : '#9ca3af'
    const tabBackgroundColor = isDarkMode ? '#111827' : '#ffffff'
    const tabShadowColor = isDarkMode ? '#000000' : '#111827'
    const sceneBackgroundColor = isDarkMode ? '#0b1220' : '#f8fafc'

    const buildTabIcon = (iconName) => ({ size, color, focused }) => (
        <View
            style={{
                width: 32,
                height: 28,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused
                    ? (isDarkMode ? 'rgba(248, 113, 113, 0.25)' : 'rgba(220, 38, 38, 0.12)')
                    : 'transparent',
            }}
        >
            <Ionicons size={focused ? size + 1 : size} color={color} name={iconName} />
        </View>
    )

  return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: activeTintColor,
                tabBarInactiveTintColor: inactiveTintColor,
                tabBarHideOnKeyboard: true,
                sceneStyle: {
                    backgroundColor: sceneBackgroundColor,
                    paddingBottom: Platform.OS === 'ios' ? 90 : 76,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 0.5,
                    marginTop: 2,
                },
                tabBarItemStyle: {
                    paddingTop: 8,
                },
                tabBarStyle: {
                    position: 'absolute',
                    left: 14,
                    right: 14,
                    height: Platform.OS === 'ios' ? 82 : 68,
                    paddingTop: 4,
                    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
                    borderRadius: 22,
                    borderTopWidth: 0,
                    backgroundColor: tabBackgroundColor,
                    elevation: 10,
                    shadowColor: tabShadowColor,
                    shadowOpacity: isDarkMode ? 0.34 : 0.08,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 12,
                },
            }}
        >
            <Tabs.Screen
                name='(login)'
                options={{
                    tabBarLabel: 'Log In',
                    tabBarIcon: buildTabIcon('log-in-outline'),
                }}
            />
            <Tabs.Screen
                name='(signup)'
                options={{
                    tabBarLabel: 'Sign Up',
                    tabBarIcon: buildTabIcon('person-add-outline'),
                }}
            />

        </Tabs>
  )
}