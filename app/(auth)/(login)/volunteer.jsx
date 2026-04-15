import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { Link } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import useVolunteerBear from '../../../store/volunteer.store'
import useThemeBear from '../../../store/theme.store'

export default function Volunteer() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false)
  const { themePreference } = useThemeBear((state) => state)
  const systemColorScheme = useColorScheme()

  const resolvedTheme = themePreference === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : themePreference
  const isDarkMode = resolvedTheme === 'dark'

  const colors = {
    page: isDarkMode ? '#0b1220' : '#f8fafc',
    surface: isDarkMode ? '#111827' : '#ffffff',
    border: isDarkMode ? '#263244' : '#e5e7eb',
    text: isDarkMode ? '#f8fafc' : '#111827',
    textSoft: isDarkMode ? '#94a3b8' : '#6b7280',
    accent: isDarkMode ? '#f87171' : '#dc2626',
    accentSoftBg: isDarkMode ? 'rgba(248, 113, 113, 0.18)' : '#fee2e2',
    accentSoftBorder: isDarkMode ? 'rgba(248, 113, 113, 0.35)' : '#fecaca',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBorder: isDarkMode ? '#334155' : '#d1d5db',
    placeholder: isDarkMode ? '#64748b' : '#9ca3af',
    disabledPrimary: isDarkMode ? '#475569' : '#fca5a5',
  }
  const {loginVolunteer} = useVolunteerBear(state=>state);

  const loginHandler = async()=>{
    if (loggingIn) return

    try {
      setLoggingIn(true)
      const res = await loginVolunteer({email,password});
      if(res.success){
      }
    } catch (error) {
      Alert.alert("Error ",error?.message || "Error while logging in");
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <View className='flex-1' style={{ backgroundColor: colors.page }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.page} />
      <View className='absolute top-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
      <View style={{ position: 'absolute', top: -40, right: -24, width: 170, height: 170, borderRadius: 999, backgroundColor: isDarkMode ? '#1e293b' : '#fee2e2' }} />

      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 52 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >

            <View className='mb-6 border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-4xl font-black tracking-tight leading-none' style={{ color: colors.text }}>
                Volunteer{'\n'}Portal.
              </Text>
              <Text className='text-xs mt-3 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
                Access your volunteer dashboard
              </Text>
              <View className='self-start mt-4 border px-3 py-2 rounded-full' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
                <Text className='text-[11px] font-black tracking-widest uppercase' style={{ color: colors.accent }}>Responder Login</Text>
              </View>
            </View>

            <View className='border rounded-2xl p-5 mb-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <View className='mb-4'>
                <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                  Email
                </Text>
                <View className='border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder='you@example.com'
                    placeholderTextColor={colors.placeholder}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    className='py-3 text-base font-medium'
                    style={{ color: colors.text }}
                  />
                </View>
              </View>

              <View>
                <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                  Password
                </Text>
                <View className='flex-row items-center border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder='Enter password'
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPass}
                    autoCapitalize='none'
                    autoCorrect={false}
                    autoComplete='password'
                    textContentType='password'
                    className='flex-1 py-3 text-base font-medium'
                    style={{ color: colors.text }}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} className='py-3 pl-3'>
                    <Text className='text-xs font-black tracking-wider' style={{ color: colors.accent }}>
                      {showPass ? 'HIDE' : 'SHOW'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className='py-4 items-center rounded-xl mb-4'
              style={{ backgroundColor: loggingIn ? colors.disabledPrimary : colors.accent }}
              activeOpacity={0.85}
              disabled={loggingIn}
              onPress={loginHandler}
            >
              <View className='flex-row items-center gap-2'>
                {loggingIn ? <ActivityIndicator color='#fff' size='small' /> : null}
                <Text className='text-white font-black text-sm tracking-widest uppercase'>
                  {loggingIn ? 'Logging In...' : 'Login as Volunteer'}
                </Text>
              </View>
            </TouchableOpacity>

            <Link href='./' asChild>
              <TouchableOpacity className='items-center mt-1' activeOpacity={0.8}>
                <Text className='text-sm font-medium tracking-wide' style={{ color: colors.textSoft }}>
                  <Ionicons name='arrow-back' size={14} /> Back to main login
                </Text>
              </TouchableOpacity>
            </Link>

            <Text className='text-center text-xs mt-4 font-medium tracking-wide' style={{ color: colors.textSoft }}>
              Keep your location access enabled for faster alerts
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}
