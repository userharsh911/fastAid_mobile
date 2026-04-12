import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function AuthLayout() {
  return (
    <Tabs screenOptions={{
        headerShown:false,
        tabBarActiveTintColor:"red",
        tabBarStyle:{
            height:50
        }
    }}>
        <Tabs.Screen name='(login)'  options={{
            tabBarLabel:'Login',
            tabBarIcon:({size,color})=><Ionicons size={size} color={color} name='person'/>
        }}/>
        <Tabs.Screen name='(signup)' options={{
            tabBarLabel:'Sign Up',
            tabBarIcon:({size,color})=><Ionicons size={size} color={color} name='person-add'/>
        }}/>

    </Tabs>
  )
}