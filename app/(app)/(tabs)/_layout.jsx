import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
        headerShown:false,
        tabBarActiveTintColor:'red',
        tabBarStyle:{
            height:50
        }
    }}>
        <Tabs.Screen name='(home)' options={{
            tabBarIcon:({size,color})=><Ionicons name='home' size={size} color={color}/>
        }}/>
        <Tabs.Screen name='account' options={{
            tabBarIcon:({size,color})=><Ionicons name='person' size={size} color={color}/>
        }}/>
    </Tabs>
  )
}