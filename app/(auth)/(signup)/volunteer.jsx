import { View, Text, TextInput, TouchableOpacity, StatusBar, ScrollView, Image, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import MapView, { Circle, Marker } from 'react-native-maps'
import IonIcons from "@expo/vector-icons/Ionicons"
import { Link, useRouter } from 'expo-router'
import useVolunteerBear from '../../../store/volunteer.store'
import EmergencyLoader from '../../../components/common/EmergencyLoader'

export default function Volunteer() {
  const [image, setImage] = useState(null)
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false);
  const [applying, setApplying] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState(null)
  const [mapRegion, setMapRegion] = useState(null)
  const signupMapRef = useRef(null)
  const [mapLoader, setMapLoader] = useState(true)
  const [refreshingCurrentLocation, setRefreshingCurrentLocation] = useState(false)
  const {applyVolunteer} = useVolunteerBear(state=>state);
  const routes = useRouter();

  const setMapPin = useCallback((latitude, longitude, keepZoom = true, recenterMap = false) => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return

    let nextRegion = null

    setMapRegion((prev) => {
      nextRegion = {
        latitude,
        longitude,
        latitudeDelta: keepZoom ? (prev?.latitudeDelta || 0.02) : 0.02,
        longitudeDelta: keepZoom ? (prev?.longitudeDelta || 0.02) : 0.02,
      }

      return nextRegion
    })

    setSelectedCoordinates({ latitude, longitude })

    if (recenterMap && signupMapRef.current && nextRegion) {
      signupMapRef.current.animateToRegion(nextRegion, 250)
    }
  }, [])

  const pickCurrentLocationForMap = useCallback(async () => {
    try {
      setRefreshingCurrentLocation(true)

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required to set volunteer location.')
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({})
      const latitude = currentLocation?.coords?.latitude
      const longitude = currentLocation?.coords?.longitude

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        Alert.alert('Location error', 'Unable to fetch current location right now.')
        return
      }

      setMapPin(latitude, longitude, false, true)
    } catch (_error) {
      Alert.alert('Location error', 'Unable to fetch current location right now.')
    } finally {
      setRefreshingCurrentLocation(false)
      setMapLoader(false)
    }
  }, [setMapPin])

  useEffect(() => {
    pickCurrentLocationForMap().catch(() => {
      setMapLoader(false)
    })
  }, [pickCurrentLocationForMap])

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
      if (!fullname.trim() || !email.trim() || !phone.trim() || !password) {
        Alert.alert('Missing fields', 'Please fill all required fields')
        return
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match')
        return
      }

      if (!Number.isFinite(selectedCoordinates?.latitude) || !Number.isFinite(selectedCoordinates?.longitude)) {
        Alert.alert('Location required', 'Please pin your location on map before submitting.')
        return
      }

      setApplying(true)

      const res = await applyVolunteer({
        fullname,
        email,
        password,
        phone,
        coordinates: [selectedCoordinates.longitude, selectedCoordinates.latitude],
      })

      if(res.success){
        routes.replace("/(app)/(tabs)");
      }
    } catch (error) {
      Alert.alert("Error ",error?.message || "Error while applying");
    } finally {
      setApplying(false)
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

            <View className="mb-5">
              <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
                Full Name
              </Text>
              <TextInput
                value={fullname}
                onChangeText={setFullname}
                placeholder="Enter your full name"
                placeholderTextColor="#d1d5db"
                className="border-b-2 border-gray-200 py-3 text-base text-black font-medium"
              />
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

            <View className="mb-10">
              <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
                Set Availability Location
              </Text>
              <Text className="text-xs text-gray-500 mb-3">
                Pin your map location. Blue circle shows your 500m nearby coverage.
              </Text>

              {
                mapLoader ? (
                  <View className='border-2 border-gray-100 py-8 items-center'>
                    <EmergencyLoader size='small' label='Loading map location' />
                  </View>
                ) : !mapRegion ? (
                  <View className='border-2 border-gray-100 py-8 px-4 items-center'>
                    <Text className='text-xs text-gray-500 text-center'>
                      Location is not set yet. Tap Use My Current Location and then adjust the pin.
                    </Text>
                  </View>
                ) : (
                  <View className='border-2 border-gray-100'>
                    <MapView
                      ref={signupMapRef}
                      style={{ width: '100%', height: 250 }}
                      initialRegion={mapRegion}
                      onPress={(event) => {
                        const { latitude, longitude } = event.nativeEvent.coordinate
                        setMapPin(latitude, longitude)
                      }}
                    >
                      {
                        selectedCoordinates ? (
                          <>
                            <Circle
                              center={selectedCoordinates}
                              radius={500}
                              strokeWidth={2}
                              strokeColor='rgba(59, 130, 246, 0.7)'
                              fillColor='rgba(59, 130, 246, 0.18)'
                            />
                            <Marker
                              coordinate={selectedCoordinates}
                              draggable
                              pinColor='red'
                              title='Your Availability Pin'
                              description='Drag pin to update your location'
                              onDragEnd={(event) => {
                                const { latitude, longitude } = event.nativeEvent.coordinate
                                setMapPin(latitude, longitude)
                              }}
                            />
                          </>
                        ) : null
                      }
                    </MapView>
                  </View>
                )
              }

              <TouchableOpacity
                className='mt-3 border-2 border-red-600 py-3 items-center'
                activeOpacity={0.85}
                disabled={refreshingCurrentLocation}
                onPress={pickCurrentLocationForMap}
              >
                <Text className='text-red-600 font-black text-xs tracking-widest uppercase'>
                  {refreshingCurrentLocation ? 'Fetching Location...' : 'Use My Current Location'}
                </Text>
              </TouchableOpacity>

              {
                selectedCoordinates ? (
                  <Text className='text-xs text-gray-500 mt-2'>
                    Lat: {selectedCoordinates.latitude.toFixed(6)} | Lng: {selectedCoordinates.longitude.toFixed(6)}
                  </Text>
                ) : null
              }
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-red-600 py-4 items-center mb-4"
              activeOpacity={0.85}
              disabled={applying}
              onPress={applyHandler}
            >
              <Text className="text-white font-black text-sm tracking-widest uppercase">
                {applying ? 'Submitting...' : 'Submit Application'}
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