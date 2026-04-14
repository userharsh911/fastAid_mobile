import { View, Text, TextInput, TouchableOpacity, StatusBar, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Alert, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { Link } from 'expo-router'
import useUserBear from '../../../store/user.store'
import useThemeBear from '../../../store/theme.store'

export default function Index() {
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [signingUp, setSigningUp] = useState(false)
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
    divider: isDarkMode ? '#334155' : '#d1d5db',
    disabledPrimary: isDarkMode ? '#475569' : '#fca5a5',
  }
  const {signupUser} = useUserBear(state=>state);


  const signupHandler = async()=>{
    if (signingUp) return

    try {
      if (!fullname.trim() || !email.trim() || !phone.trim() || !password) {
        Alert.alert('Missing fields', 'Please fill all required fields.')
        return
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match')
        return
      }

      setSigningUp(true)

      const res = await signupUser({fullname,email,password,phone})
      if(res.success){
      }
    } catch (error) {
      Alert.alert("Error ",error?.message || "Error while signing up");
    } finally {
      setSigningUp(false)
    }
  }

  return (
    <View className='flex-1' style={{ backgroundColor: colors.page }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.page} />
      <View className='absolute top-0 left-0 right-0 h-1 z-10' style={{ backgroundColor: colors.accent }} />
      <View style={{ position: 'absolute', top: -40, right: -24, width: 170, height: 170, borderRadius: 999, backgroundColor: isDarkMode ? '#1e293b' : '#fee2e2' }} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS==='ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
        >

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 52 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View className='mb-6 border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className='text-4xl font-black tracking-tight leading-none' style={{ color: colors.text }}>
            Create{'\n'}Account.
          </Text>
          <Text className='text-xs mt-3 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
            Join us today
          </Text>
          <View className='self-start mt-4 border px-3 py-2 rounded-full' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
            <Text className='text-[11px] font-black tracking-widest uppercase' style={{ color: colors.accent }}>Quick Registration</Text>
          </View>
        </View>

        <View className='border rounded-2xl p-5 mb-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className='mb-4'>
            <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
              Full Name
            </Text>
            <View className='border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
              <TextInput
                value={fullname}
                onChangeText={setFullname}
                placeholder='Enter your full name'
                placeholderTextColor={colors.placeholder}
                className='py-3 text-base font-medium'
                style={{ color: colors.text }}
              />
            </View>
          </View>

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

          <View className='mb-4'>
            <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
              Phone Number
            </Text>
            <View className='border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder='+91 00000 00000'
                placeholderTextColor={colors.placeholder}
                keyboardType='phone-pad'
                className='py-3 text-base font-medium'
                style={{ color: colors.text }}
              />
            </View>
          </View>

          <View className='mb-4'>
            <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
              Password
            </Text>
            <View className='flex-row items-center border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder='â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPass}
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

          <View>
            <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
              Confirm Password
            </Text>
            <View className='flex-row items-center border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder='â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showConfirm}
                className='flex-1 py-3 text-base font-medium'
                style={{ color: colors.text }}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className='py-3 pl-3'>
                <Text className='text-xs font-black tracking-wider' style={{ color: colors.accent }}>
                  {showConfirm ? 'HIDE' : 'SHOW'}
                </Text>
              </TouchableOpacity>
            </View>

            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text className='text-xs mt-2 font-medium' style={{ color: '#ef4444' }}>
                Passwords do not match
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          className='py-4 items-center rounded-xl'
          style={{ backgroundColor: signingUp ? colors.disabledPrimary : colors.accent }}
          activeOpacity={0.85}
          disabled={signingUp}
          onPress={signupHandler}
        >
          <View className='flex-row items-center gap-2'>
            {signingUp ? <ActivityIndicator color='#fff' size='small' /> : null}
            <Text className="text-white font-black text-sm tracking-widest uppercase">
              {signingUp ? 'Creating Account...' : 'Create Account'}
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
              Apply as Volunteer
            </Text>
          </TouchableOpacity>
        </Link>

        <View className='flex-row justify-center items-center mt-1'>
          <Text className='text-sm font-medium' style={{ color: colors.textSoft }}>
            Already have an account?{' '}
          </Text>
          <Link href='../(login)'>
            <Text className='text-center text-sm font-black tracking-wide' style={{ color: colors.accent }}>
              Login
            </Text>
          </Link>
        </View>

        <Text className='text-center text-xs mt-4 font-medium tracking-wide' style={{ color: colors.textSoft }}>
          Emergency alerts work best with accurate phone details
        </Text>
      </ScrollView>

        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}
