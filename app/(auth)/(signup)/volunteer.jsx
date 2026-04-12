import { View, Text, TextInput, TouchableOpacity, StatusBar, ScrollView, Image, Alert, KeyboardAvoidingView, Platform, TouchableNativeFeedback, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import IonIcons from "@expo/vector-icons/Ionicons"
import { Link, useRouter } from 'expo-router'
import useVolunteerBear from '../../../store/volunteer.store'

export default function Volunteer() {
  const [image, setImage] = useState(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false);
  const {applyVolunteer} = useVolunteerBear(state=>state);
  const routes = useRouter();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images',],
      // allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const applyHandler = async()=>{
    try {
      const res = await applyVolunteer({email,password,phone,coordinates:[70.34343,12.23434]}) // hardcoded coordinates for android emulator
      if(res.success){
        routes.replace("/(app)/(tabs)");
      }
    } catch (error) {
      
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top accent bar */}
      <View className="absolute top-0 left-0 right-0 h-1 bg-red-600 z-10" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS==='ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 52 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View className="mb-10">
              <View className="w-10 h-10 bg-red-600 rounded-sm mb-6" />
              <Text className="text-4xl font-black text-black tracking-tight leading-none">
                Become a{'\n'}Volunteer.
              </Text>
              <Text className="text-xs text-gray-400 mt-3 font-medium tracking-widest uppercase">
                Fill in your details to apply
              </Text>
            </View>

            {/* Image Picker */}
            <View className="items-center mb-10">
              <TouchableOpacity onPress={pickImage} activeOpacity={0.85} >
                {
                  image ? (
                    <View className="">
                    <Image
                      source={{ uri: image }}
                      className="w-24 h-24 rounded-sm"
                      style={{ borderWidth: 3, borderColor: '#dc2626' }}
                    />
                    <View className="absolute bottom-0 right-0 bg-red-600 px-2 py-1">
                      <Text className="text-white text-xs font-black tracking-wider">EDIT</Text>
                    </View>
                  </View>
                  ) : (
                    <View
                  className=" px-5 h-24 border-2 border-dashed border-red-400 items-center justify-center rounded-sm"
                >
                  <Text className="text-3xl text-red-400">+</Text>
                  <Text className="text-xs text-red-400 font-bold tracking-widest uppercase mt-1">
                    Add Document
                  </Text>
                </View>
                  )
                }
                
              </TouchableOpacity>

              {/*  */}
              
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

            {/* Phone Field */}
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
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text className="text-xs text-red-500 mt-2 font-medium">
                  Passwords do not match
                </Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-red-600 py-4 items-center mb-4"
              activeOpacity={0.85}
              onPress={applyHandler}
            >
              <Text className="text-white font-black text-sm tracking-widest uppercase">
                Submit Application
              </Text>
            </TouchableOpacity>

            {/* Back Link */}
            <Link href={"../(login)/volunteer"} className="items-center mt-4">
              <Text className="text-gray-400 text-sm font-medium tracking-wide">
                <IonIcons size={14} name='arrow-back'/> Back to login
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