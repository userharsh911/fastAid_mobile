import React, { useEffect, useRef, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import useUserBear from "../store/user.store";
import useVolunteerBear from "../store/volunteer.store"
import useSocketBear from "../store/socket.store";
import useThemeBear from "../store/theme.store";
import * as Notifications from "expo-notifications";
import * as NavigationBar from "expo-navigation-bar";
import Constants from "expo-constants";
import { clearActiveAlertReminderNotification, syncActiveAlertReminderNotification } from "../libs/alertReminderNotification";
import EmergencyLoader from "../components/common/EmergencyLoader";
import SplashScreen from "../components/SplashScreen";
import "../global.css";
import { Platform, View, useColorScheme } from "react-native";

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
  const { themePreference, loadThemePreference } = useThemeBear((state) => state);
  const routes = useRouter()
  const segments = useSegments()  
  const rootNavigationState = useRootNavigationState();
  const systemColorScheme = useColorScheme();
  const lastAuthRedirectRef = useRef(null);
  const [showIntroSplash, setShowIntroSplash] = useState(true);

  const resolvedTheme = themePreference === "system"
    ? (systemColorScheme === "dark" ? "dark" : "light")
    : themePreference;
  const isDarkMode = resolvedTheme === "dark";
  const appBackgroundColor = isDarkMode ? "#0b1220" : "#ffffff";

  useEffect(() => {
    loadThemePreference().catch(() => {});
  }, [loadThemePreference]);

  useEffect(()=>{
    getUser();
    getVolunteer();
  },[getUser,getVolunteer])

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const configureNavigationBar = async () => {
      try {
        await NavigationBar.setButtonStyleAsync(isDarkMode ? "light" : "dark");
      } catch (_error) {
        // Ignore unsupported navigation bar runtime config errors.
      }
    };

    configureNavigationBar();
  }, [isDarkMode]);

  useEffect(() => {
    const registerPushToken = async () => {
      if (!volunteer?._id) return;

      try {
        const isExpoGo = Constants?.appOwnership === "expo";
        if (isExpoGo) {
          return;
        }

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

        const hasAndroidGoogleServicesConfig =
          Platform.OS !== "android" || Boolean(Constants?.expoConfig?.android?.googleServicesFile);

        if (!hasAndroidGoogleServicesConfig) {
          return;
        }

        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId
          ?? Constants?.easConfig?.projectId
          ?? (typeof process !== "undefined" ? process?.env?.EXPO_PUBLIC_EAS_PROJECT_ID : undefined);

        if (!projectId) {
          return;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });

        if (tokenResponse?.data) {
          await saveVolunteerPushToken(tokenResponse.data);
        }
      } catch (_error) {
        // Push registration failures are non-fatal for app startup.
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
    if (showIntroSplash || !rootNavigationState?.key || userLoader || volunteerLoader) return;

    const isAuthenticated = Boolean(user?._id || volunteer?._id);
    const isInAppGroup = segments?.[0] === "(app)";

    let targetRoute = null;

    if (isAuthenticated && !isInAppGroup) {
      targetRoute = '/(app)/(tabs)';
    } else if (!isAuthenticated && isInAppGroup) {
      targetRoute = '/(auth)/(login)';
    }

    if (!targetRoute) {
      lastAuthRedirectRef.current = null;
      return;
    }

    if (lastAuthRedirectRef.current === targetRoute) return;

    lastAuthRedirectRef.current = targetRoute;
    routes.replace(targetRoute);
  }, [routes, segments, user?._id, volunteer?._id, userLoader, volunteerLoader, rootNavigationState?.key, showIntroSplash]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: appBackgroundColor }}>
        {
          showIntroSplash ? (
            <SplashScreen onFinish={() => setShowIntroSplash(false)} />
          ) : (userLoader || volunteerLoader) ? (
            <View style={{ flex: 1, backgroundColor: appBackgroundColor }}>
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
