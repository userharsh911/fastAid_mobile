import { View, Text, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as Location from 'expo-location'
import MapView, { Circle, Marker } from 'react-native-maps'
import useUserBear from "../../../store/user.store"
import useVolunteerBear from '../../../store/volunteer.store';
import EmergencyLoader from '../../../components/common/EmergencyLoader'

const DEFAULT_REGION = {
  latitude: 28.6139,
  longitude: 77.2090,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
}

const getVolunteerLatLng = (volunteer) => {
  const longitude = volunteer?.location?.coordinates?.[0]
  const latitude = volunteer?.location?.coordinates?.[1]

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null
  }

  return { latitude, longitude }
}

const COORDINATE_EPSILON = 0.00005

const areCoordinatesClose = (a, b) => {
  if (!a || !b) return false

  return (
    Math.abs(a.latitude - b.latitude) <= COORDINATE_EPSILON &&
    Math.abs(a.longitude - b.longitude) <= COORDINATE_EPSILON
  )
}

export default function Account() {
  const { user, logoutUser, convertGuestToUser, updateUserProfile } = useUserBear(state=>state);
  const { volunteer, logoutVolunteer, updateVolunteerLocation, updateVolunteerProfile } = useVolunteerBear(state=>state);

  const [editingLocation, setEditingLocation] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState(null)
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION)
  const editMapRef = useRef(null)
  const selectedCoordinatesRef = useRef(null)
  const [mapLoader, setMapLoader] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)
  const [refreshingCurrentLocation, setRefreshingCurrentLocation] = useState(false)
  const [volunteerFullnameInput, setVolunteerFullnameInput] = useState('')
  const [volunteerPhoneInput, setVolunteerPhoneInput] = useState('')
  const [savingVolunteerProfile, setSavingVolunteerProfile] = useState(false)
  const [fullnameInput, setFullnameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [guestEmailInput, setGuestEmailInput] = useState('')
  const [guestPasswordInput, setGuestPasswordInput] = useState('')
  const [guestConfirmPasswordInput, setGuestConfirmPasswordInput] = useState('')
  const [savingUserProfile, setSavingUserProfile] = useState(false)
  const [convertingGuestAccount, setConvertingGuestAccount] = useState(false)

  const volunteerLongitude = volunteer?.location?.coordinates?.[0]
  const volunteerLatitude = volunteer?.location?.coordinates?.[1]

  const savedVolunteerCoordinates = getVolunteerLatLng(volunteer)
  const previewCoordinates = editingLocation
    ? (selectedCoordinates || savedVolunteerCoordinates)
    : savedVolunteerCoordinates

  const previewRegion = previewCoordinates
    ? {
        latitude: previewCoordinates.latitude,
        longitude: previewCoordinates.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }
    : mapRegion

  const setMapPin = useCallback((latitude, longitude, keepZoom = true, recenterEditor = false) => {
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

    const nextCoordinates = { latitude, longitude }
    selectedCoordinatesRef.current = nextCoordinates
    setSelectedCoordinates(nextCoordinates)

    if (recenterEditor && editMapRef.current && nextRegion) {
      editMapRef.current.animateToRegion(nextRegion, 250)
    }
  }, [])

  const initializeFromVolunteerLocation = useCallback(() => {
    if (!Number.isFinite(volunteerLatitude) || !Number.isFinite(volunteerLongitude)) return false

    setMapPin(volunteerLatitude, volunteerLongitude, false)
    return true
  }, [setMapPin, volunteerLatitude, volunteerLongitude])

  const fetchCurrentLocationPin = useCallback(async () => {
    try {
      setRefreshingCurrentLocation(true)
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required to update your location.')
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
    if (!volunteer?._id) {
      setEditingLocation(false)
      return
    }

    setVolunteerFullnameInput(volunteer?.fullname || '')
    setVolunteerPhoneInput(volunteer?.phone ? String(volunteer.phone) : '')

    const hasVolunteerCoordinates = initializeFromVolunteerLocation()
    if (!hasVolunteerCoordinates) {
      fetchCurrentLocationPin().catch(() => {
        setMapLoader(false)
      })
    }
  }, [volunteer?._id, volunteer?.fullname, volunteer?.phone, volunteerLatitude, volunteerLongitude, initializeFromVolunteerLocation, fetchCurrentLocationPin])

  const openLocationEditor = async () => {
    setEditingLocation(true)

    const hasVolunteerCoordinates = Number.isFinite(volunteerLatitude) && Number.isFinite(volunteerLongitude)

    if (!hasVolunteerCoordinates) {
      setMapLoader(true)
      await fetchCurrentLocationPin()
      return
    }

    setMapPin(volunteerLatitude, volunteerLongitude, false, true)
  }

  const saveVolunteerLocation = async () => {
    const latestSelectedCoordinates = selectedCoordinatesRef.current || selectedCoordinates

    if (!Number.isFinite(latestSelectedCoordinates?.latitude) || !Number.isFinite(latestSelectedCoordinates?.longitude)) {
      Alert.alert('Location required', 'Please pin your location on map first.')
      return
    }

    const targetCoordinates = {
      latitude: latestSelectedCoordinates.latitude,
      longitude: latestSelectedCoordinates.longitude,
    }

    try {
      setSavingLocation(true); 
      const response = await updateVolunteerLocation({
        latitude: targetCoordinates.latitude,
        longitude: targetCoordinates.longitude,
      })

      const persistedCoordinates = getVolunteerLatLng(response?.volunteer)

      if (!response?.success || !persistedCoordinates) {
        throw new Error(response?.message || 'Unable to update location')
      }

      if (!areCoordinatesClose(targetCoordinates, persistedCoordinates)) {
        setMapPin(persistedCoordinates.latitude, persistedCoordinates.longitude, false)
        Alert.alert('Location not saved', 'Selected pin could not be saved. Please try again.')
        return
      }

      setMapPin(persistedCoordinates.latitude, persistedCoordinates.longitude, false)
      Alert.alert('Success', 'Your volunteer location has been updated.')
      setEditingLocation(false)
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to update location')
    } finally {
      setSavingLocation(false)
    }
  }

  const saveVolunteerProfileHandler = async () => {
    if (!volunteerFullnameInput.trim() || !volunteerPhoneInput.trim()) {
      Alert.alert('Missing fields', 'Full name and phone are required.')
      return
    }

    try {
      setSavingVolunteerProfile(true)
      const response = await updateVolunteerProfile({
        fullname: volunteerFullnameInput.trim(),
        phone: volunteerPhoneInput.trim(),
      })

      if (response?.success) {
        Alert.alert('Success', 'Volunteer profile updated successfully.')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to update volunteer profile')
    } finally {
      setSavingVolunteerProfile(false)
    }
  }

  useEffect(() => {
    if (!user?._id) return

    setFullnameInput(user?.fullname || '')
    setPhoneInput(user?.phone ? String(user.phone) : '')
    setGuestEmailInput(user?.email || '')
  }, [user?._id, user?.fullname, user?.phone, user?.email])

  const saveUserProfileHandler = async () => {
    if (user?.as_guest) {
      Alert.alert('Complete Login First', 'Guest account ko pehle fully complete karo.')
      return
    }

    if (!fullnameInput.trim() || !phoneInput.trim()) {
      Alert.alert('Missing fields', 'Full name and phone are required.')
      return
    }

    try {
      setSavingUserProfile(true)
      const response = await updateUserProfile({
        fullname: fullnameInput.trim(),
        phone: phoneInput.trim(),
      })

      if (response?.success) {
        Alert.alert('Success', 'Profile updated successfully.')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to update profile')
    } finally {
      setSavingUserProfile(false)
    }
  }

  const convertGuestAccountHandler = async () => {
    if (!fullnameInput.trim() || !phoneInput.trim() || !guestEmailInput.trim() || !guestPasswordInput.trim()) {
      Alert.alert('Missing fields', 'Please fill all fields to complete your account.')
      return
    }

    if (guestPasswordInput !== guestConfirmPasswordInput) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    try {
      setConvertingGuestAccount(true)
      const response = await convertGuestToUser({
        fullname: fullnameInput.trim(),
        phone: phoneInput.trim(),
        email: guestEmailInput.trim(),
        password: guestPasswordInput,
      })

      if (response?.success) {
        setGuestPasswordInput('')
        setGuestConfirmPasswordInput('')
        Alert.alert('Success', 'Guest account converted to normal account successfully.')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to complete account')
    } finally {
      setConvertingGuestAccount(false)
    }
  }

  if (volunteer?._id) {
    return (
      <View className='flex-1 bg-white'>
        <View className='absolute top-0 left-0 right-0 h-1 bg-red-600 z-10' />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
          showsVerticalScrollIndicator={false}
        >
          <View className='mb-8'>
            <Text className='text-3xl font-black text-black tracking-tight'>Volunteer Account</Text>
            <Text className='text-xs text-gray-400 mt-2 font-medium tracking-widest uppercase'>Manage your profile and location</Text>
          </View>

          <View className='border-2 border-gray-100 p-4 mb-4'>
            <Text className='text-sm text-gray-700'>Full Name: {volunteer?.fullname || 'N/A'}</Text>
            <Text className='text-sm text-gray-700'>Email: {volunteer?.email || 'N/A'}</Text>
            <Text className='text-sm text-gray-700 mt-1'>Phone: {volunteer?.phone || 'N/A'}</Text>
            <Text className='text-sm text-gray-700 mt-1'>Mode: {volunteer?.mode || 'N/A'}</Text>
            {
              savedVolunteerCoordinates ? (
                <Text className='text-xs text-gray-500 mt-2'>
                  Saved Pin: {savedVolunteerCoordinates.latitude.toFixed(6)}, {savedVolunteerCoordinates.longitude.toFixed(6)}
                </Text>
              ) : null
            }
          </View>

          <View className='border-2 border-gray-100 p-4 mb-4'>
            <Text className='text-xs font-bold text-gray-400 tracking-widest uppercase mb-2'>Full Name</Text>
            <TextInput
              value={volunteerFullnameInput}
              onChangeText={setVolunteerFullnameInput}
              placeholder='Enter your full name'
              placeholderTextColor='#d1d5db'
              className='border-b-2 border-gray-200 py-3 text-base text-black font-medium'
            />

            <Text className='text-xs font-bold text-gray-400 tracking-widest uppercase mt-5 mb-2'>Phone Number</Text>
            <TextInput
              value={volunteerPhoneInput}
              onChangeText={setVolunteerPhoneInput}
              placeholder='+91 00000 00000'
              placeholderTextColor='#d1d5db'
              keyboardType='phone-pad'
              className='border-b-2 border-gray-200 py-3 text-base text-black font-medium'
            />

            <TouchableOpacity
              className='bg-red-600 py-3 items-center mt-4'
              activeOpacity={0.85}
              disabled={savingVolunteerProfile}
              onPress={saveVolunteerProfileHandler}
            >
              <Text className='text-white font-black text-xs tracking-widest uppercase'>
                {savingVolunteerProfile ? 'Saving...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
          </View>

          {
            !editingLocation ? (
              <>
                <View className='border-2 border-gray-100 p-3 mb-4'>
                  <Text className='text-xs text-gray-500 mb-2'>Current availability location preview (500m area)</Text>

                  {
                    savedVolunteerCoordinates ? (
                      <MapView
                        style={{ width: '100%', height: 200 }}
                        region={previewRegion}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                      >
                        <Circle
                          center={savedVolunteerCoordinates}
                          radius={500}
                          strokeWidth={2}
                          strokeColor='rgba(59, 130, 246, 0.7)'
                          fillColor='rgba(59, 130, 246, 0.18)'
                        />
                        <Marker
                          coordinate={savedVolunteerCoordinates}
                          pinColor='red'
                        />
                      </MapView>
                    ) : (
                      <View className='border-2 border-gray-100 py-8 items-center'>
                        <Text className='text-xs text-gray-400'>Location pin not available yet.</Text>
                      </View>
                    )
                  }
                </View>

                <TouchableOpacity
                  className='border-2 border-red-600 py-4 items-center mb-4'
                  activeOpacity={0.85}
                  onPress={openLocationEditor}
                >
                  <Text className='text-red-600 font-black text-xs tracking-widest uppercase'>Edit Availability Location</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className='border-2 border-gray-100 p-3 mb-4'>
                <Text className='text-xs text-gray-500 mb-2'>Drag pin or tap map to set your location. Blue circle is your 500m service area.</Text>

                {
                  mapLoader ? (
                    <View className='py-8 items-center'>
                      <EmergencyLoader size='small' label='Loading location editor' />
                    </View>
                  ) : (
                    <MapView
                      ref={editMapRef}
                      style={{ width: '100%', height: 260 }}
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
                              onDragEnd={(event) => {
                                const { latitude, longitude } = event.nativeEvent.coordinate
                                setMapPin(latitude, longitude)
                              }}
                            />
                          </>
                        ) : null
                      }
                    </MapView>
                  )
                }

                <TouchableOpacity
                  className='mt-3 border-2 border-black py-3 items-center'
                  activeOpacity={0.85}
                  disabled={refreshingCurrentLocation}
                  onPress={fetchCurrentLocationPin}
                >
                  <Text className='text-black font-black text-xs tracking-widest uppercase'>
                    {refreshingCurrentLocation ? 'Fetching Location...' : 'Use Current Location'}
                  </Text>
                </TouchableOpacity>

                {
                  selectedCoordinates ? (
                    <Text className='text-xs text-gray-500 mt-2'>
                      Selected Pin: {selectedCoordinates.latitude.toFixed(6)}, {selectedCoordinates.longitude.toFixed(6)}
                    </Text>
                  ) : null
                }

                <View className='flex-row gap-3 mt-3'>
                  <TouchableOpacity
                    className='flex-1 border-2 border-gray-300 py-3 items-center'
                    activeOpacity={0.85}
                    onPress={() => {
                      if (savedVolunteerCoordinates) {
                        setMapPin(savedVolunteerCoordinates.latitude, savedVolunteerCoordinates.longitude, false)
                      }
                      setEditingLocation(false)
                    }}
                  >
                    <Text className='text-gray-600 font-black text-xs tracking-widest uppercase'>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className='flex-1 bg-red-600 py-3 items-center'
                    activeOpacity={0.85}
                    disabled={savingLocation}
                    onPress={saveVolunteerLocation}
                  >
                    <Text className='text-white font-black text-xs tracking-widest uppercase'>
                      {savingLocation ? 'Saving...' : 'Save Location'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }

          <TouchableOpacity
            className='border-2 border-red-600 py-4 items-center mt-2'
            activeOpacity={0.85}
            onPress={logoutVolunteer}
          >
            <Text className='text-red-600 font-black text-xs tracking-widest uppercase'>Volunteer Logout</Text>
          </TouchableOpacity>
        </ScrollView>

        <View className='absolute bottom-0 left-0 right-0 h-1 bg-red-600' />
      </View>
    )
  }

  return (
    <View className='flex-1 bg-white'>
      <View className='absolute top-0 left-0 right-0 h-1 bg-red-600 z-10' />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='mb-8'>
          <Text className='text-3xl font-black text-black tracking-tight'>Account</Text>
          <Text className='text-xs text-gray-400 mt-2 font-medium tracking-widest uppercase'>Manage your profile</Text>
        </View>

        {
          user?.as_guest ? (
            <View className='border-2 border-red-200 p-4 mb-4'>
              <Text className='text-sm text-red-700 font-semibold'>You are logged in as guest.</Text>
              <Text className='text-xs text-gray-500 mt-1'>Please complete account details for full login.</Text>
            </View>
          ) : null
        }

        <View className='border-2 border-gray-100 p-4 mb-4'>
          <Text className='text-xs font-bold text-gray-400 tracking-widest uppercase mb-2'>Full Name</Text>
          <TextInput
            value={fullnameInput}
            onChangeText={setFullnameInput}
            placeholder='Enter your full name'
            placeholderTextColor='#d1d5db'
            className='border-b-2 border-gray-200 py-3 text-base text-black font-medium'
          />

          <Text className='text-xs font-bold text-gray-400 tracking-widest uppercase mt-5 mb-2'>Phone Number</Text>
          <TextInput
            value={phoneInput}
            onChangeText={setPhoneInput}
            placeholder='+91 00000 00000'
            placeholderTextColor='#d1d5db'
            keyboardType='phone-pad'
            className='border-b-2 border-gray-200 py-3 text-base text-black font-medium'
          />

          {
            user?.as_guest ? (
              <>
                <Text className='text-xs font-bold text-gray-400 tracking-widest uppercase mt-5 mb-2'>Email</Text>
                <TextInput
                  value={guestEmailInput}
                  onChangeText={setGuestEmailInput}
                  placeholder='you@example.com'
                  placeholderTextColor='#d1d5db'
                  keyboardType='email-address'
                  autoCapitalize='none'
                  className='border-b-2 border-gray-200 py-3 text-base text-black font-medium'
                />

                <Text className='text-xs font-bold text-gray-400 tracking-widest uppercase mt-5 mb-2'>Password</Text>
                <TextInput
                  value={guestPasswordInput}
                  onChangeText={setGuestPasswordInput}
                  placeholder='••••••••'
                  placeholderTextColor='#d1d5db'
                  secureTextEntry
                  className='border-b-2 border-gray-200 py-3 text-base text-black font-medium'
                />

                <Text className='text-xs font-bold text-gray-400 tracking-widest uppercase mt-5 mb-2'>Confirm Password</Text>
                <TextInput
                  value={guestConfirmPasswordInput}
                  onChangeText={setGuestConfirmPasswordInput}
                  placeholder='••••••••'
                  placeholderTextColor='#d1d5db'
                  secureTextEntry
                  className='border-b-2 border-gray-200 py-3 text-base text-black font-medium'
                />
              </>
            ) : (
              <Text className='text-xs text-gray-500 mt-5'>Email: {user?.email || 'N/A'}</Text>
            )
          }
        </View>

        {
          user?.as_guest ? (
            <TouchableOpacity
              className='bg-red-600 py-4 items-center mb-4'
              activeOpacity={0.85}
              disabled={convertingGuestAccount}
              onPress={convertGuestAccountHandler}
            >
              <Text className='text-white font-black text-xs tracking-widest uppercase'>
                {convertingGuestAccount ? 'Completing...' : 'Complete Full Login'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className='bg-red-600 py-4 items-center mb-4'
              activeOpacity={0.85}
              disabled={savingUserProfile}
              onPress={saveUserProfileHandler}
            >
              <Text className='text-white font-black text-xs tracking-widest uppercase'>
                {savingUserProfile ? 'Saving...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
          )
        }

        {
          !user?.as_guest ? (
            <TouchableOpacity
              className='border-2 border-red-600 py-4 items-center'
              activeOpacity={0.85}
              onPress={logoutUser}
            >
              <Text className='text-red-600 font-black text-xs tracking-widest uppercase'>Logout</Text>
            </TouchableOpacity>
          ) : null
        }
      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 h-1 bg-red-600' />
    </View>
  )
}