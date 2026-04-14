import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

const ALERT_CANCEL_REMINDER_NOTIFICATION_KEY = "alertCancelReminderNotificationId";
const ALERT_CANCEL_REMINDER_AFTER_MS = 12 * 60 * 60 * 1000;
const ALERT_AUTO_EXPIRE_AFTER_MS = 24 * 60 * 60 * 1000;
const REMINDER_REPEAT_SECONDS = 60 * 60;

const getAlertAgeMs = (alert) => {
  const createdAtMs = new Date(alert?.createdAt).getTime();
  if (!Number.isFinite(createdAtMs)) {
    return 0;
  }

  return Math.max(0, Date.now() - createdAtMs);
};

const ensureNotificationPermission = async () => {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status === "granted") {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
};

export const clearActiveAlertReminderNotification = async () => {
  const notificationId = await SecureStore.getItemAsync(ALERT_CANCEL_REMINDER_NOTIFICATION_KEY);

  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.log("error while cancelling reminder notification ", error);
    }
  }

  await SecureStore.deleteItemAsync(ALERT_CANCEL_REMINDER_NOTIFICATION_KEY);
};

export const syncActiveAlertReminderNotification = async (alert) => {
  const isActiveAlert = alert?.mode === "Active";

  if (!isActiveAlert) {
    await clearActiveAlertReminderNotification();
    return { scheduled: false };
  }

  const ageMs = getAlertAgeMs(alert);
  const shouldRemind = ageMs >= ALERT_CANCEL_REMINDER_AFTER_MS && ageMs < ALERT_AUTO_EXPIRE_AFTER_MS;

  if (!shouldRemind) {
    await clearActiveAlertReminderNotification();
    return { scheduled: false };
  }

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    return { scheduled: false };
  }

  const existingNotificationId = await SecureStore.getItemAsync(ALERT_CANCEL_REMINDER_NOTIFICATION_KEY);
  if (existingNotificationId) {
    return { scheduled: true, notificationId: existingNotificationId };
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Emergency Alert Still Active",
      body: "Your alert is active for long time. Cancel it if help is no longer needed.",
      data: {
        screen: "/(app)/(tabs)/(home)/sendedAlert",
        alertId: alert?._id,
      },
    },
    trigger: {
      seconds: REMINDER_REPEAT_SECONDS,
      repeats: true,
      channelId: "default",
    },
  });

  await SecureStore.setItemAsync(ALERT_CANCEL_REMINDER_NOTIFICATION_KEY, notificationId);

  return { scheduled: true, notificationId };
};
