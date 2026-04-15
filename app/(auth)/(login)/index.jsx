import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { Link } from 'expo-router'
import useUserBear from "../../../store/user.store"
import useThemeBear from '../../../store/theme.store'

export default function Index() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [guestLoggingIn, setGuestLoggingIn] = useState(false)
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
    textMuted: isDarkMode ? '#cbd5e1' : '#4b5563',
    textSoft: isDarkMode ? '#94a3b8' : '#6b7280',
    accent: isDarkMode ? '#f87171' : '#dc2626',
    accentSoftBg: isDarkMode ? 'rgba(248, 113, 113, 0.18)' : '#fee2e2',
    accentSoftBorder: isDarkMode ? 'rgba(248, 113, 113, 0.35)' : '#fecaca',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBorder: isDarkMode ? '#334155' : '#d1d5db',
    placeholder: isDarkMode ? '#64748b' : '#9ca3af',
    divider: isDarkMode ? '#334155' : '#d1d5db',
    secondaryBg: isDarkMode ? '#0f172a' : '#ffffff',
    secondaryText: isDarkMode ? '#e5e7eb' : '#111827',
    disabledPrimary: isDarkMode ? '#475569' : '#fca5a5',
    disabledSecondary: isDarkMode ? '#1f2937' : '#f3f4f6',
  }

  const {loginAsGuest, loginUser} = useUserBear(state=>state);
  const normalizedEmail = String(email || '').trim()
  const normalizedPassword = String(password || '').trim()
  const isLoginFormValid = Boolean(normalizedEmail && normalizedPassword)
  const isLoginDisabled = loggingIn || guestLoggingIn || !isLoginFormValid

  const guestLogin = async()=>{
    if (guestLoggingIn || loggingIn) return

    try {
      setGuestLoggingIn(true)
      const res = await loginAsGuest({as_guest:true});
      if(res.success){
      }
    } catch (error) {
      Alert.alert("Error ",error.message)
    } finally {
      setGuestLoggingIn(false)
    }
  }

  const loginHandler = async()=>{
    if (loggingIn || guestLoggingIn || !isLoginFormValid) return

    try {
      setLoggingIn(true)
      const res = await loginUser({email: normalizedEmail,password: normalizedPassword});
      if(res.success){
      }
    } catch (error) {
      Alert.alert("Error ",error?.message || "Error while logging in")
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
                Welcome{'\n'}Back.
              </Text>
              <Text className='text-xs mt-3 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
                Sign in to continue
              </Text>
              <View className='self-start mt-4 border px-3 py-2 rounded-full' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
                <Text className='text-[11px] font-black tracking-widest uppercase' style={{ color: colors.accent }}>Emergency Access</Text>
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
                    <Text className='text-xs font-bold tracking-wider' style={{ color: colors.accent }}>
                      {showPass ? 'HIDE' : 'SHOW'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className='py-4 items-center rounded-xl'
              style={{ backgroundColor: isLoginDisabled ? colors.disabledPrimary : colors.accent }}
              activeOpacity={0.85}
              disabled={isLoginDisabled}
              onPress={loginHandler}
            >
              <View className='flex-row items-center gap-2'>
                {loggingIn ? <ActivityIndicator color='#fff' size='small' /> : null}
                <Text className='text-white font-black text-sm tracking-widest uppercase'>
                  {loggingIn ? 'Logging In...' : 'Login'}
                </Text>
              </View>
            </TouchableOpacity>

            <View className='flex-row justify-between items-center my-4'>
              <View className='w-[44%] h-px' style={{ backgroundColor: colors.divider }} />
              <Text className='text-xs font-black tracking-widest uppercase' style={{ color: colors.textSoft }}>or</Text>
              <View className='w-[44%] h-px' style={{ backgroundColor: colors.divider }} />
            </View>

            <TouchableOpacity
              className='border rounded-xl py-4 items-center'
              style={{
                borderColor: colors.inputBorder,
                backgroundColor: guestLoggingIn || loggingIn ? colors.disabledSecondary : colors.secondaryBg,
              }}
              activeOpacity={0.65}
              disabled={guestLoggingIn || loggingIn}
              onPress={guestLogin}
            >
              <View className='flex-row items-center gap-2'>
                {guestLoggingIn ? <ActivityIndicator color={colors.secondaryText} size='small' /> : null}
                <Text className='text-center font-black text-sm tracking-widest uppercase' style={{ color: colors.secondaryText }}>
                  {guestLoggingIn ? 'Logging In As Guest...' : 'Login as Guest'}
                </Text>
              </View>
            </TouchableOpacity>

            <View className='flex-row justify-between items-center my-4'>
              <View className='w-[44%] h-px' style={{ backgroundColor: colors.divider }} />
              <Text className='text-xs font-black tracking-widest uppercase' style={{ color: colors.textSoft }}>or</Text>
              <View className='w-[44%] h-px' style={{ backgroundColor: colors.divider }} />
            </View>

            <Link href='./volunteer' asChild>
              <TouchableOpacity className='border rounded-xl py-4 items-center mb-7' style={{ borderColor: colors.accent, backgroundColor: colors.accentSoftBg }} activeOpacity={0.85}>
                <Text className='text-center font-black text-sm tracking-widest uppercase' style={{ color: colors.accent }}>
                  Login as Volunteer
                </Text>
              </TouchableOpacity>
            </Link>

            <View className='flex-row justify-center items-center'>
              <Text className='text-sm font-medium' style={{ color: colors.textSoft }}>
                Don&apos;t have an account?{' '}
              </Text>
              <Link href='../(signup)'>
                <Text className='text-sm font-black tracking-wide' style={{ color: colors.accent }}>
                  Sign Up
                </Text>
              </Link>
            </View>

            <Text className='text-center text-xs mt-4 font-medium tracking-wide' style={{ color: colors.textSoft }}>
              Emergency support is available 24x7
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}
