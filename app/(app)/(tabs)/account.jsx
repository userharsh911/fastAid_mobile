import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import useUserBear from "../../../store/user.store"
import useVolunteerBear from '../../../store/volunteer.store';

export default function Account() {
  const {logoutUser} = useUserBear(state=>state);
  const {logoutVolunteer} = useVolunteerBear(state=>state);

  return (
    <View>
      <Text>Account</Text>
      <TouchableOpacity onPress={()=>logoutUser()}>
        <Text>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={()=>logoutVolunteer()}>
        <Text>Volunteer Logout</Text>
      </TouchableOpacity>
    </View>
  )
}