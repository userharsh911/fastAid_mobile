import { View, Text, TextInput, TouchableOpacity, StatusBar, ScrollView, KeyboardAvoidingView, Platform, TouchableNativeFeedback, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native'
import React, { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import useUserBear from '../../../store/user.store'

export default function Index() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const routes = useRouter();
  const {signupUser} = useUserBear(state=>state);


  const signupHandler = async()=>{
    try {
      const res = await signupUser({email,password,phone})
      if(res.success){
        routes.replace('/(app)/(tabs)');
      }
    } catch (error) {
      Alert.alert("Error ",error?.message || "Error while signing up");
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top accent bar */}
      <View className="absolute top-0 left-0 right-0 h-1 bg-red-600 z-10" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS==='ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
        >

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-10">
          <View className="w-10 h-10 bg-red-600 rounded-sm mb-6" />
          <Text className="text-4xl font-black text-black tracking-tight leading-none">
            Create{'\n'}Account.
          </Text>
          <Text className="text-xs text-gray-400 mt-3 font-medium tracking-widest uppercase">
            Join us today
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

        {/* Phone Number Field */}
        <View className="mb-5">
          <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
            Phone Number
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 00000 00000"
            placeholderTextColor="#d1d5db"
            keyboardType="phone-pad"
            className="border-b-2 border-gray-200 py-3 text-base text-black font-medium"
          />
        </View>

        {/* Password Field */}
        <View className="mb-5">
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

        {/* Confirm Password Field */}
        <View className="mb-10">
          <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
            Confirm Password
          </Text>
          <View className="flex-row items-center border-b-2 border-gray-200">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#d1d5db"
              secureTextEntry={!showConfirm}
              className="flex-1 py-3 text-base text-black font-medium"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="py-3 pl-3">
              <Text className="text-xs font-black text-red-600 tracking-wider">
                {showConfirm ? 'HIDE' : 'SHOW'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password mismatch warning */}
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <Text className="text-xs text-red-500 mt-2 font-medium">
              Passwords do not match
            </Text>
          )}
        </View>

        {/* Signup Button */}
        <TouchableOpacity
          className="bg-red-600 py-4 items-center"
          activeOpacity={0.85}
          onPress={signupHandler}
        >
          <Text className="text-white font-black text-sm tracking-widest uppercase">
            Create Account
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center my-4">
          <View className="w-[45%] h-0.5 bg-black"></View>
          <View>
            <Text className="font-bold" >OR</Text>
          </View>
          <View className="w-[45%] h-0.5 bg-black"></View>
        </View>

        <Link
          href={"./volunteer"}
          className="border-2 border-black py-4 items-center mb-8"
          activeOpacity={0.85}
        >
          <Text className="text-black text-center font-black text-sm tracking-widest uppercase">
            Apply as Volunteer
          </Text>
        </Link>

        {/* Login Link */}
        <View className="flex-row justify-center items-center mt-4">
          <Text className="text-gray-400 text-sm font-medium">
            Already have an account?{' '}
          </Text>
          <Link href={"../(login)"}>
            <Text className="text-red-600 text-center text-sm font-black tracking-wide">
              Login
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