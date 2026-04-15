import { View, useColorScheme } from 'react-native'
import React from 'react'
import { Redirect, Stack } from 'expo-router'
import EmergencyLoader from '../../components/common/EmergencyLoader'
import useUserBear from '../../store/user.store'
import useVolunteerBear from '../../store/volunteer.store'
import useThemeBear from '../../store/theme.store'

export default function AppLayout() {
  const { user, userLoader } = useUserBear((state) => state)
  const { volunteer, volunteerLoader } = useVolunteerBear((state) => state)
  const { themePreference } = useThemeBear((state) => state)
  const systemColorScheme = useColorScheme()

  const resolvedTheme = themePreference === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : themePreference
  const appBackgroundColor = resolvedTheme === 'dark' ? '#0b1220' : '#ffffff'
  const isSessionHydrating = userLoader || volunteerLoader
  const isAuthenticated = Boolean(user?._id || volunteer?._id)

  if (isSessionHydrating) {
    return (
      <View style={{ flex: 1, backgroundColor: appBackgroundColor }}>
        <EmergencyLoader
          fullScreen
          size='large'
          label='Preparing Emergency Guardian'
        />
      </View>
    )
  }

  if (!isAuthenticated) {
    return <Redirect href='/(auth)/(login)' />
  }

  return (
    <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name='(tabs)'/>
    </Stack>
  )
}