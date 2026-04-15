import React from 'react'
import { Stack } from 'expo-router'

export default function LoginLayout() {
  return (
    <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name='index'/>
        <Stack.Screen name='volunteer'/>
        <Stack.Screen name='volunteerOtp'/>
        <Stack.Screen name='volunteerForgotPassword'/>
    </Stack>
  )
}