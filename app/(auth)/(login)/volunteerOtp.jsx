import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useMemo, useState } from 'react'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import useVolunteerBear from '../../../store/volunteer.store'
import useThemeBear from '../../../store/theme.store'

export default function VolunteerOtp() {
  const routes = useRouter()
  const { email: emailParam } = useLocalSearchParams()

  const [otp, setOtp] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)

  const {
    pendingVolunteerOtpSession,
    verifyVolunteerOtp,
    resendVolunteerOtp,
    clearPendingVolunteerOtpSession,
  } = useVolunteerBear((state) => state)

  const { themePreference } = useThemeBear((state) => state)
  const systemColorScheme = useColorScheme()

  const resolvedTheme = themePreference === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : themePreference
  const isDarkMode = resolvedTheme === 'dark'

  const normalizedEmailFromParam = useMemo(() => {
    if (Array.isArray(emailParam)) {
      return String(emailParam[0] || '').trim().toLowerCase()
    }

    return String(emailParam || '').trim().toLowerCase()
  }, [emailParam])

  const targetEmail = pendingVolunteerOtpSession?.email || normalizedEmailFromParam
  const targetPassword = pendingVolunteerOtpSession?.password || ''

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
    secondaryBg: isDarkMode ? '#0f172a' : '#ffffff',
  }

  const submitOtpHandler = async () => {
    if (!targetEmail) {
      Alert.alert('Session expired', 'Please login again to request a new OTP.')
      routes.replace('/(auth)/(login)/volunteer')
      return
    }

    const normalizedOtp = String(otp || '').trim()
    if (!normalizedOtp) {
      Alert.alert('Missing OTP', 'Please enter the OTP sent to your email.')
      return
    }

    try {
      setVerifyingOtp(true)
      const response = await verifyVolunteerOtp({
        email: targetEmail,
        otp: normalizedOtp,
      })

      if (response?.success) {
        Alert.alert('Verified', response?.message || 'Email verified successfully.')
        routes.replace('/(app)/(tabs)')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Invalid OTP or OTP has expired.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const resendOtpHandler = async () => {
    if (!targetEmail) {
      Alert.alert('Session expired', 'Please login again to request OTP.')
      routes.replace('/(auth)/(login)/volunteer')
      return
    }

    if (!targetPassword) {
      Alert.alert('Password required', 'For security, login again with password to resend OTP.')
      routes.replace('/(auth)/(login)/volunteer')
      return
    }

    try {
      setResendingOtp(true)
      const response = await resendVolunteerOtp({
        email: targetEmail,
        password: targetPassword,
      })

      if (response?.success) {
        Alert.alert('OTP Sent', response?.message || 'A new OTP has been sent to your email.')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to resend OTP right now.')
    } finally {
      setResendingOtp(false)
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
                Verify{"\n"}Email.
              </Text>
              <Text className='text-xs mt-3 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
                Volunteer OTP verification
              </Text>
              <View className='self-start mt-4 border px-3 py-2 rounded-full' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
                <Text className='text-[11px] font-black tracking-widest uppercase' style={{ color: colors.accent }}>Secure Login Step</Text>
              </View>
            </View>

            <View className='border rounded-2xl p-5 mb-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                Email
              </Text>
              <Text className='text-sm mb-4' style={{ color: colors.text }}>
                {targetEmail || 'No email found'}
              </Text>

              <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                Enter OTP
              </Text>
              <View className='border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder='6-digit OTP'
                  placeholderTextColor={colors.placeholder}
                  keyboardType='number-pad'
                  autoCapitalize='none'
                  autoCorrect={false}
                  maxLength={6}
                  className='py-3 text-base font-medium'
                  style={{ color: colors.text }}
                />
              </View>
            </View>

            <TouchableOpacity
              className='py-4 items-center rounded-xl mb-4'
              style={{ backgroundColor: verifyingOtp ? colors.disabledPrimary : colors.accent }}
              activeOpacity={0.85}
              disabled={verifyingOtp || resendingOtp}
              onPress={submitOtpHandler}
            >
              <View className='flex-row items-center gap-2'>
                {verifyingOtp ? <ActivityIndicator color='#fff' size='small' /> : null}
                <Text className='text-white font-black text-sm tracking-widest uppercase'>
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className='border rounded-xl py-4 items-center mb-7'
              style={{ borderColor: colors.accent, backgroundColor: colors.secondaryBg }}
              activeOpacity={0.85}
              disabled={verifyingOtp || resendingOtp}
              onPress={resendOtpHandler}
            >
              <View className='flex-row items-center gap-2'>
                {resendingOtp ? <ActivityIndicator color={colors.accent} size='small' /> : null}
                <Text className='text-center font-black text-sm tracking-widest uppercase' style={{ color: colors.accent }}>
                  {resendingOtp ? 'Sending...' : 'Resend OTP'}
                </Text>
              </View>
            </TouchableOpacity>

            <Link href='/(auth)/(login)/volunteer' asChild>
              <TouchableOpacity
                className='items-center mt-1'
                activeOpacity={0.8}
                onPress={() => clearPendingVolunteerOtpSession()}
              >
                <Text className='text-sm font-medium tracking-wide' style={{ color: colors.textSoft }}>
                  Back to volunteer login
                </Text>
              </TouchableOpacity>
            </Link>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}
