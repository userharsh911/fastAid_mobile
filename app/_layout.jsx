import React, { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useSegments } from "expo-router";
import useUserBear from "../store/user.store";
import useVolunteerBear from "../store/volunteer.store"
import * as Location from "expo-location";
import "../global.css";
import { Alert } from "react-native";

export default function RootLayout() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const { user , getUser, userLoader} = useUserBear((state) => state);
  const {volunteer, getVolunteer, volunteerLoader} = useVolunteerBear(state=>state);
  const routes = useRouter()
  const segments = useSegments()

  useEffect(()=>{
    getUser();
    getVolunteer();
    console.log("user get kiya ")
  },[getUser,getVolunteer])

  useEffect(() => {
    if(!userLoader && !volunteerLoader){
      console.log("user ", user);
      console.log("volunteer ", volunteer);
      if(user){
        if((!user ) && segments.includes("(app)")){
          routes.replace('/(auth)/(login)')
        }else if((user) && !segments.includes("(app)")){
          routes.replace('/(app)/(tabs)')
        }
      } else{
        if((!volunteer ) && segments.includes("(app)")){
          routes.replace('/(auth)/(login)')
        }else if((volunteer) && !segments.includes("(app)")){
          routes.replace('/(app)/(tabs)')
        }
      }
    }
  }, [user,segments,routes,volunteer,userLoader,volunteerLoader]);

  // useEffect(() => {
  //   async function getCurrentLocation() {
  //     try {
  //       let { status } = await Location.requestForegroundPermissionsAsync();
  //       if (status !== "granted") {
  //         setErrorMsg("Permission to access location was denied");
  //         return;
  //       }

  //       let location = await Location.getCurrentPositionAsync({});
  //       setLocation(location);
  //     } catch (error) {
  //       console.log("error while getting location",error);
  //       Alert.alert('Location Error',);
  //     }
  //   }
  //   getCurrentLocation();
  // }, []);

  // useEffect(()=>{
  //   console.log(location);
  // },[location])
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
