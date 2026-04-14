import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import useVolunteerBear from '../../../store/volunteer.store'

export default function Volunteer() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false)
  const {loginVolunteer} = useVolunteerBear(state=>state);
  const routes = useRouter()

  const loginHandler = async()=>{
    if (loggingIn) return

    try {
      setLoggingIn(true)
      const res = await loginVolunteer({email,password});
      if(res.success){
        routes.replace("/(app)/(tabs)");
      }
    } catch (error) {
      Alert.alert("Error ",error?.message || "Error while logging in");
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top accent bar */}
      <View className="absolute top-0 left-0 right-0 h-1 bg-red-600" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

      {/* Header */}
      <View className="mb-12">
        <View className="w-10 h-10 bg-red-600 rounded-sm mb-6" />
        <Text className="text-4xl font-black text-black tracking-tight leading-none">
          Volunteer{'\n'}Portal.
        </Text>
        <Text className="text-xs text-gray-400 mt-3 font-medium tracking-widest uppercase">
          Access your volunteer dashboard
        </Text>
      </View>

      {/* Email Field */}
      <View className="mb-5">
        <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#d1d5db"
          keyboardType="email-address"
          autoCapitalize="none"
          className="border-b-2 border-gray-200 py-3 text-base text-black font-medium"
        />
      </View>

      {/* Password Field */}
      <View className="mb-10">
        <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
          Password
        </Text>
        <View className="flex-row items-center border-b-2 border-gray-200">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#d1d5db"
            secureTextEntry={!showPass}
            className="flex-1 py-3 text-base text-black font-medium"
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} className="py-3 pl-3">
            <Text className="text-xs font-black text-red-600 tracking-wider">
              {showPass ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        className={`py-4 items-center mb-4 ${loggingIn ? 'bg-red-400' : 'bg-red-600'}`}
        activeOpacity={0.85}
        disabled={loggingIn}
        onPress={loginHandler}
      >
        <View className='flex-row items-center gap-2'>
          {loggingIn ? <ActivityIndicator color='#fff' size='small' /> : null}
          <Text className="text-white font-black text-sm tracking-widest uppercase">
            {loggingIn ? 'Logging In...' : 'Login as Volunteer'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Back Link */}
      <Link href={"./"} className="items-center mt-4">
        <Text className="text-gray-400 text-center flex items-center text-sm font-medium tracking-wide">
          <Ionicons name="arrow-back" size={14} /> Back to main login
        </Text>
      </Link>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Bottom accent */}
      <View className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />
    </View>
  )
}