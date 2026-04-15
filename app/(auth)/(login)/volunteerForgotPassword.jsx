import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import useVolunteerBear from '../../../store/volunteer.store'
import useThemeBear from '../../../store/theme.store'

const STEPS = {
  SEND_OTP: 1,
  VERIFY_OTP: 2,
  RESET_PASSWORD: 3,
}

export default function VolunteerForgotPassword() {
  const routes = useRouter()

  const [step, setStep] = useState(STEPS.SEND_OTP)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [resetSessionToken, setResetSessionToken] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  const {
    sendVolunteerForgotPasswordOtp,
    verifyVolunteerForgotPasswordOtp,
    resetVolunteerForgotPassword,
  } = useVolunteerBear((state) => state)

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
    secondaryBg: isDarkMode ? '#0f172a' : '#ffffff',
  }

  const normalizedEmail = useMemo(() => String(email || '').trim().toLowerCase(), [email])
  const normalizedOtp = useMemo(() => String(otp || '').trim(), [otp])
  const normalizedNewPassword = useMemo(() => String(newPassword || '').trim(), [newPassword])
  const normalizedConfirmPassword = useMemo(() => String(confirmPassword || '').trim(), [confirmPassword])
  const canSendOtp = Boolean(normalizedEmail)
  const canVerifyOtp = Boolean(normalizedEmail && normalizedOtp.length === 6)
  const canResetPassword = Boolean(
    normalizedEmail
    && resetSessionToken
    && normalizedNewPassword
    && normalizedConfirmPassword
    && normalizedNewPassword === normalizedConfirmPassword
  )

  const sendOtpHandler = async () => {
    if (!canSendOtp) {
      Alert.alert('Missing email', 'Please enter your volunteer email.')
      return
    }

    try {
      setSendingOtp(true)
      const response = await sendVolunteerForgotPasswordOtp({ email: normalizedEmail })
      if (response?.success) {
        Alert.alert('OTP Sent', response?.message || 'Password reset OTP sent to your email.')
        setStep(STEPS.VERIFY_OTP)
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to send OTP right now.')
    } finally {
      setSendingOtp(false)
    }
  }

  const verifyOtpHandler = async () => {
    if (!normalizedEmail || !normalizedOtp) {
      Alert.alert('Missing fields', 'Please enter email and OTP.')
      return
    }

    try {
      setVerifyingOtp(true)
      const response = await verifyVolunteerForgotPasswordOtp({
        email: normalizedEmail,
        otp: normalizedOtp,
      })

      if (response?.success && response?.resetSessionToken) {
        setResetSessionToken(response.resetSessionToken)
        setStep(STEPS.RESET_PASSWORD)
        Alert.alert('Verified', response?.message || 'OTP verified successfully.')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Invalid OTP or OTP expired.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const resetPasswordHandler = async () => {
    if (!normalizedEmail || !resetSessionToken) {
      Alert.alert('Session expired', 'Please verify OTP again.')
      setStep(STEPS.VERIFY_OTP)
      return
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing fields', 'Please enter new password and confirm password.')
      return
    }

    if (normalizedNewPassword !== normalizedConfirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.')
      return
    }

    try {
      setResettingPassword(true)
      const response = await resetVolunteerForgotPassword({
        email: normalizedEmail,
        newPassword: normalizedNewPassword,
        resetSessionToken,
      })

      if (response?.success) {
        Alert.alert('Password Updated', response?.message || 'Password reset successful. Please login again.')
        routes.replace('/(auth)/(login)/volunteer')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to reset password right now.')
    } finally {
      setResettingPassword(false)
    }
  }

  const stepLabel = step === STEPS.SEND_OTP
    ? 'Step 1/3 • Send OTP'
    : step === STEPS.VERIFY_OTP
      ? 'Step 2/3 • Verify OTP'
      : 'Step 3/3 • Set New Password'

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
                Forgot{'\n'}Password.
              </Text>
              <Text className='text-xs mt-3 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
                Volunteer password recovery
              </Text>
              <View className='self-start mt-4 border px-3 py-2 rounded-full' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
                <Text className='text-[11px] font-black tracking-widest uppercase' style={{ color: colors.accent }}>{stepLabel}</Text>
              </View>
            </View>

            <View className='border rounded-2xl p-5 mb-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                Email
              </Text>
              <View className='border rounded-xl px-3 mb-4' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder='you@example.com'
                  placeholderTextColor={colors.placeholder}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  autoCorrect={false}
                  className='py-3 text-base font-medium'
                  style={{ color: colors.text }}
                  editable={step === STEPS.SEND_OTP}
                />
              </View>

              {step >= STEPS.VERIFY_OTP ? (
                <>
                  <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                    OTP
                  </Text>
                  <View className='border rounded-xl px-3 mb-4' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder='Enter 6-digit OTP'
                      placeholderTextColor={colors.placeholder}
                      keyboardType='number-pad'
                      autoCapitalize='none'
                      autoCorrect={false}
                      maxLength={6}
                      className='py-3 text-base font-medium'
                      style={{ color: colors.text }}
                      editable={step === STEPS.VERIFY_OTP}
                    />
                  </View>
                </>
              ) : null}

              {step >= STEPS.RESET_PASSWORD ? (
                <>
                  <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                    New Password
                  </Text>
                  <View className='flex-row items-center border rounded-xl px-3 mb-4' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder='Enter new password'
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!showNewPass}
                      autoCapitalize='none'
                      autoCorrect={false}
                      autoComplete='new-password'
                      textContentType='newPassword'
                      className='flex-1 py-3 text-base font-medium'
                      style={{ color: colors.text }}
                    />
                    <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} className='py-3 pl-3'>
                      <Text className='text-xs font-black tracking-wider' style={{ color: colors.accent }}>
                        {showNewPass ? 'HIDE' : 'SHOW'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                    Confirm Password
                  </Text>
                  <View className='flex-row items-center border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder='Confirm new password'
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!showConfirmPass}
                      autoCapitalize='none'
                      autoCorrect={false}
                      autoComplete='new-password'
                      textContentType='newPassword'
                      className='flex-1 py-3 text-base font-medium'
                      style={{ color: colors.text }}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} className='py-3 pl-3'>
                      <Text className='text-xs font-black tracking-wider' style={{ color: colors.accent }}>
                        {showConfirmPass ? 'HIDE' : 'SHOW'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>

            {step === STEPS.SEND_OTP ? (
              <TouchableOpacity
                className='py-4 items-center rounded-xl mb-4'
                style={{ backgroundColor: (sendingOtp || !canSendOtp) ? colors.disabledPrimary : colors.accent }}
                activeOpacity={0.85}
                disabled={sendingOtp || !canSendOtp}
                onPress={sendOtpHandler}
              >
                <View className='flex-row items-center gap-2'>
                  {sendingOtp ? <ActivityIndicator color='#fff' size='small' /> : null}
                  <Text className='text-white font-black text-sm tracking-widest uppercase'>
                    {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            {step === STEPS.VERIFY_OTP ? (
              <View className='flex-row gap-3 mb-4'>
                <TouchableOpacity
                  className='flex-1 border rounded-xl py-4 items-center'
                  style={{
                    borderColor: (sendingOtp || verifyingOtp || !canSendOtp) ? colors.inputBorder : colors.accent,
                    backgroundColor: (sendingOtp || verifyingOtp || !canSendOtp) ? colors.inputBg : colors.secondaryBg,
                  }}
                  activeOpacity={0.85}
                  disabled={sendingOtp || verifyingOtp || !canSendOtp}
                  onPress={sendOtpHandler}
                >
                  <Text
                    className='font-black text-xs tracking-widest uppercase'
                    style={{ color: (sendingOtp || verifyingOtp || !canSendOtp) ? colors.textSoft : colors.accent }}
                  >
                    Resend OTP
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className='flex-1 py-4 items-center rounded-xl'
                  style={{ backgroundColor: (verifyingOtp || sendingOtp || !canVerifyOtp) ? colors.disabledPrimary : colors.accent }}
                  activeOpacity={0.85}
                  disabled={verifyingOtp || sendingOtp || !canVerifyOtp}
                  onPress={verifyOtpHandler}
                >
                  <View className='flex-row items-center gap-2'>
                    {verifyingOtp ? <ActivityIndicator color='#fff' size='small' /> : null}
                    <Text className='text-white font-black text-xs tracking-widest uppercase'>
                      {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : null}

            {step === STEPS.RESET_PASSWORD ? (
              <TouchableOpacity
                className='py-4 items-center rounded-xl mb-4'
                style={{ backgroundColor: (resettingPassword || !canResetPassword) ? colors.disabledPrimary : colors.accent }}
                activeOpacity={0.85}
                disabled={resettingPassword || !canResetPassword}
                onPress={resetPasswordHandler}
              >
                <View className='flex-row items-center gap-2'>
                  {resettingPassword ? <ActivityIndicator color='#fff' size='small' /> : null}
                  <Text className='text-white font-black text-sm tracking-widest uppercase'>
                    {resettingPassword ? 'Updating...' : 'Set New Password'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              className='items-center mt-1'
              activeOpacity={0.8}
              onPress={() => routes.replace('/(auth)/(login)/volunteer')}
            >
              <Text className='text-sm font-medium tracking-wide' style={{ color: colors.textSoft }}>
                <Ionicons name='arrow-back' size={14} /> Back to volunteer login
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}
