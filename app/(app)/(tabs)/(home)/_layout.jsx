import { View, Text, } from 'react-native'
import React from 'react'
import {Stack} from "expo-router"

export default function _layout() {
  return (
    <Stack
        screenOptions={{
            headerShown:false
        }}
    >
        <Stack.Screen name='index'/>
        <Stack.Screen name='sendedAlert'/>
        <Stack.Screen name='hireVolunteer'/>
        <Stack.Screen name='alertMap'/>
    </Stack>
  )
}