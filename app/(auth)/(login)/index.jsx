import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { Link } from 'expo-router'
import useUserBear from "../../../store/user.store"

export default function Index() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [guestLoggingIn, setGuestLoggingIn] = useState(false)

  const {loginAsGuest, loginUser} = useUserBear(state=>state);

  const guestLogin = async()=>{
    if (guestLoggingIn || loggingIn) return

    try {
      setGuestLoggingIn(true)
      const res = await loginAsGuest({as_guest:true});
      if(res.success){
        console.log("login as guest sucess : ")
      }
    } catch (error) {
      Alert.alert("Error ",error.message)
    } finally {
      setGuestLoggingIn(false)
    }
  }

  const loginHandler = async()=>{
    if (loggingIn || guestLoggingIn) return

    try {
      setLoggingIn(true)
      const res = await loginUser({email,password});
      if(res.success){
        console.log("login sucess : ")
      }
    } catch (error) {
      console.log("err ",error)
      Alert.alert("Error ",error?.message || "Error while logging in")
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
          Welcome{'\n'}Back.
        </Text>
        <Text className="text-sm text-gray-400 mt-3 font-medium tracking-widest uppercase">
          Sign in to continue
        </Text>
      </View>

      {/* Email Field */}
      <View className="mb-4">
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
          className="border-b-2 border-gray-200 py-3 text-base text-black font-medium focus:border-red-600"
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
            <Text className="text-xs font-bold text-red-600 tracking-wider">
              {showPass ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        className={`py-4 items-center ${(loggingIn || guestLoggingIn) ? 'bg-red-400' : 'bg-red-600'}`}
        activeOpacity={0.85}
        disabled={loggingIn || guestLoggingIn}
        onPress={loginHandler}
      >
        <View className='flex-row items-center gap-2'>
          {loggingIn ? <ActivityIndicator color='#fff' size='small' /> : null}
          <Text className="text-white font-black text-sm tracking-widest uppercase">
            {loggingIn ? 'Logging In...' : 'Login'}
          </Text>
        </View>
      </TouchableOpacity>

      <View className="flex-row justify-between items-center my-4">
        <View className="w-[45%] h-0.5 bg-black"></View>
        <View>
          <Text className="font-bold" >OR</Text>
        </View>
        <View className="w-[45%] h-0.5 bg-black"></View>
      </View>

      {/* Login as Guest */}
      <TouchableOpacity
        className={`border-2 py-4 items-center ${guestLoggingIn || loggingIn ? 'border-gray-300 bg-gray-100' : 'border-black'}`}
        activeOpacity={0.55}
        disabled={guestLoggingIn || loggingIn}
        onPress={guestLogin}
      >
        <View className='flex-row items-center gap-2'>
          {guestLoggingIn ? <ActivityIndicator color='#111' size='small' /> : null}
          <Text className={`text-center font-black text-sm tracking-widest uppercase ${guestLoggingIn || loggingIn ? 'text-gray-500' : 'text-black'}`}>
            {guestLoggingIn ? 'Logging In As Guest...' : 'Login as Guest'}
          </Text>
        </View>
      </TouchableOpacity>
      <View className="flex-row justify-between items-center my-4">
        <View className="w-[45%] h-0.5 bg-black"></View>
        <View>
          <Text className="font-bold" >OR</Text>
        </View>
        <View className="w-[45%] h-0.5 bg-black"></View>
      </View>

      {/* Login as Volunteer */}
      <Link
        href={"./volunteer"}
        className="border-2 border-black py-4 items-center mb-8"
        activeOpacity={0.85}
      >
        <Text className="text-black text-center font-black text-sm tracking-widest uppercase">
          Login as Volunteer
        </Text>
      </Link>

      {/* Signup Link */}
      <View className="flex-row justify-center items-center">
        <Text className="text-gray-400 text-sm font-medium">
          Don&apos;t have an account?{' '}
        </Text>
        <Link href={"../(signup)"}>
          <Text className="text-red-600 text-sm font-black tracking-wide">
            Sign Up
          </Text>
        </Link>
      </View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Bottom accent */}
      <View className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />
    </View>
  )
}