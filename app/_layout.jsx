import React, { useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import useUserBear from "../store/user.store";
import useVolunteerBear from "../store/volunteer.store"
import useSocketBear from "../store/socket.store";
import * as Notifications from "expo-notifications";
import * as NavigationBar from "expo-navigation-bar";
import Constants from "expo-constants";
import { clearActiveAlertReminderNotification, syncActiveAlertReminderNotification } from "../libs/alertReminderNotification";
import EmergencyLoader from "../components/common/EmergencyLoader";
import "../global.css";
import { Platform, View } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const { user , getUser, userLoader, latestAlert, loadLatestAlertStatus } = useUserBear((state) => state);
  const {volunteer, getVolunteer, volunteerLoader, saveVolunteerPushToken} = useVolunteerBear(state=>state);
  const { connectUserSocket, connectVolunteerSocket, disconnectSocket } = useSocketBear(state=>state);
  const routes = useRouter()
  const segments = useSegments()  
  const rootNavigationState = useRootNavigationState();

  useEffect(()=>{
    getUser();
    getVolunteer();
    console.log("user get kiya ")
  },[getUser,getVolunteer])

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const configureNavigationBar = async () => {
      try {
        await NavigationBar.setBackgroundColorAsync("#ffffff");
        await NavigationBar.setButtonStyleAsync("dark");
      } catch (error) {
        console.log("failed to configure navigation bar", error);
      }
    };

    configureNavigationBar();
  }, []);

  useEffect(() => {
    const registerPushToken = async () => {
      if (!volunteer?._id) return;

      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (finalStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") return;

        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

        const tokenResponse = projectId
          ? await Notifications.getExpoPushTokenAsync({ projectId })
          : await Notifications.getExpoPushTokenAsync();

        if (tokenResponse?.data) {
          await saveVolunteerPushToken(tokenResponse.data);
        }
      } catch (error) {
        console.log("error while registering push token ", error);
      }
    };

    registerPushToken();
  }, [volunteer?._id, saveVolunteerPushToken]);

  useEffect(() => {
    const handleSocketConnection = async () => {
      if (user?._id) {
        await connectUserSocket();
        return;
      }

      if (volunteer?._id) {
        await connectVolunteerSocket();
        return;
      }

      disconnectSocket();
    };

    handleSocketConnection().catch(() => {});
  }, [user?._id, volunteer?._id, connectUserSocket, connectVolunteerSocket, disconnectSocket]);

  useEffect(() => {
    if (!user?._id) return;

    loadLatestAlertStatus().catch(() => {});
  }, [user?._id, loadLatestAlertStatus]);

  useEffect(() => {
    const syncAlertReminder = async () => {
      if (!user?._id || !latestAlert?._id) {
        await clearActiveAlertReminderNotification();
        return;
      }

      await syncActiveAlertReminderNotification(latestAlert);
    };

    syncAlertReminder().catch(() => {});
  }, [user?._id, latestAlert, latestAlert?._id, latestAlert?.mode, latestAlert?.createdAt]);

  useEffect(() => {
    const navigateFromNotification = (response) => {
      const screen = response?.notification?.request?.content?.data?.screen;
      const alertId = response?.notification?.request?.content?.data?.alertId;

      if (typeof screen === "string" && rootNavigationState?.key) {
        const targetRoute = alertId ? `${screen}?alertId=${alertId}` : screen;
        routes.push(targetRoute);
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        navigateFromNotification(response);
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromNotification(response);
    });

    return () => {
      responseSubscription.remove();
    };
  }, [routes, rootNavigationState?.key]);

  useEffect(() => {
    // Don't attempt navigation until the root navigator has mounted
    if (!rootNavigationState?.key) return;

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
  }, [user, segments, routes, volunteer, userLoader, volunteerLoader, rootNavigationState?.key]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        {
          (userLoader || volunteerLoader) ? (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
              <EmergencyLoader
                fullScreen
                size='large'
                label='Preparing Emergency Guardian'
              />
            </View>
          ) :
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        }
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
