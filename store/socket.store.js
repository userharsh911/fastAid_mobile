import { create } from "zustand";
import { io } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import useUserBear from "./user.store";
import useVolunteerBear from "./volunteer.store";

const SOCKET_BASE_URL = "https://emergent-guardian.onrender.com";
const RECENT_VOLUNTEER_NOTIFICATION_WINDOW_MS = 2 * 60 * 1000;
const recentVolunteerNotifiedAlerts = new Map();

const disconnectExistingSocket = (socket) => {
    if (!socket) return;

    socket.removeAllListeners();
    socket.disconnect();
};

const cleanupRecentVolunteerNotifiedAlerts = () => {
    const now = Date.now();

    recentVolunteerNotifiedAlerts.forEach((timestamp, alertId) => {
        if (now - timestamp > RECENT_VOLUNTEER_NOTIFICATION_WINDOW_MS) {
            recentVolunteerNotifiedAlerts.delete(alertId);
        }
    });
};

const canNotifyAlertId = (alertId) => {
    if (!alertId) return false;

    cleanupRecentVolunteerNotifiedAlerts();

    const lastNotifiedAt = recentVolunteerNotifiedAlerts.get(alertId);
    if (lastNotifiedAt && Date.now() - lastNotifiedAt < RECENT_VOLUNTEER_NOTIFICATION_WINDOW_MS) {
        return false;
    }

    recentVolunteerNotifiedAlerts.set(alertId, Date.now());
    return true;
};

const isAlertAssignedToVolunteer = (alertItem, volunteerId) => {
    const assignedVolunteerId = alertItem?.volunteer_id?._id || alertItem?.volunteer_id;
    return String(assignedVolunteerId) === String(volunteerId);
};

const buildVolunteerAlertBody = (alertItem) => {
    const userName = alertItem?.user_id?.fullname || alertItem?.user_id?.email || "Someone";
    const description = typeof alertItem?.description === "string" ? alertItem.description.trim() : "";

    if (description) {
        const shortDescription = description.length > 90 ? `${description.slice(0, 90)}...` : description;
        return `${userName} needs help: ${shortDescription}`;
    }

    return `${userName} needs emergency help near your location.`;
};

const scheduleVolunteerLocalAlertNotification = async (alertItem) => {
    const alertId = String(alertItem?._id || "");
    if (!canNotifyAlertId(alertId)) return;

    try {
        const title = alertItem?.mode === "Alloted"
            ? "Emergency assigned to you"
            : "New emergency nearby";

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body: buildVolunteerAlertBody(alertItem),
                sound: "default",
                data: {
                    screen: "/(app)/(tabs)/(home)",
                    alertId,
                },
            },
            trigger: null,
        });
    } catch (error) {
        console.log("local volunteer notification error ", error);
    }
};

const pickFreshNotifiableVolunteerAlerts = ({ previousAlerts, nextAlerts, volunteerId, reason }) => {
    const shouldNotifyForReason = reason === "created" || reason === "alloted";
    if (!shouldNotifyForReason) {
        return [];
    }

    const previousAlertIds = new Set(
        (previousAlerts || [])
            .map((alertItem) => String(alertItem?._id || ""))
            .filter(Boolean)
    );

    return (nextAlerts || []).filter((alertItem) => {
        const alertId = String(alertItem?._id || "");
        if (!alertId || previousAlertIds.has(alertId)) {
            return false;
        }

        if (alertItem?.mode === "Active") {
            return true;
        }

        return alertItem?.mode === "Alloted" && isAlertAssignedToVolunteer(alertItem, volunteerId);
    });
};

const attachUserSocketListeners = (socket) => {
    socket.on("user-alert:refresh", async (payload) => {
        const alertId = payload?.alertId || useUserBear.getState().latestAlert?._id;

        if (alertId) {
            await useUserBear.getState().fetchAlertStatus(alertId, false).catch(() => {});
        } else {
            await useUserBear.getState().loadLatestAlertStatus().catch(() => {});
        }

        await useUserBear.getState().getAlertHistory(false).catch(() => {});
    });
};

const attachVolunteerSocketListeners = (socket) => {
    socket.on("volunteer-alerts:refresh", async (payload) => {
        const volunteerId = useVolunteerBear.getState().volunteer?._id;
        const previousAlerts = useVolunteerBear.getState().volunteerAlerts || [];

        await useVolunteerBear.getState().getVolunteerNearbyAlerts(false).catch(() => {});

        const nextAlerts = useVolunteerBear.getState().volunteerAlerts || [];
        const freshAlerts = pickFreshNotifiableVolunteerAlerts({
            previousAlerts,
            nextAlerts,
            volunteerId,
            reason: payload?.reason,
        });

        for (const alertItem of freshAlerts) {
            await scheduleVolunteerLocalAlertNotification(alertItem);
        }

        const reason = payload?.reason;
        const shouldSyncVolunteerProfile =
            reason === "alloted" ||
            reason === "cancelled" ||
            reason === "ended" ||
            reason === "expired";

        if (shouldSyncVolunteerProfile) {
            await useVolunteerBear.getState().getVolunteer(false).catch(() => {});
        }
    });
};

const createSocketConnection = (authPayload, role, set, get) => {
    const existingSocket = get().socket;
    const existingRole = get().socketRole;

    if (existingSocket && existingSocket.connected && existingRole === role) {
        return { success: true };
    }

    disconnectExistingSocket(existingSocket);

    const socket = io(SOCKET_BASE_URL, {
        transports: ["websocket"],
        auth: authPayload,
        reconnection: true,
    });

    socket.on("connect", () => {
        set({ socketConnected: true });
    });

    socket.on("disconnect", () => {
        set({ socketConnected: false });
    });

    socket.on("connect_error", (error) => {
        console.log("socket connect error ", error?.message || error);
    });

    if (role === "user") {
        attachUserSocketListeners(socket);
    }

    if (role === "volunteer") {
        attachVolunteerSocketListeners(socket);
    }

    set({ socket, socketRole: role });

    return { success: true };
};

const useSocketBear = create((set, get) => ({
    socket: null,
    socketConnected: false,
    socketRole: null,
    connectUserSocket: async () => {
        try {
            const userToken = await SecureStore.getItemAsync("userToken");
            const guest = await SecureStore.getItemAsync("guest");

            if (userToken) {
                return createSocketConnection({ role: "user", token: userToken }, "user", set, get);
            }

            if (guest) {
                const guestUser = JSON.parse(guest);
                if (guestUser?._id) {
                    return createSocketConnection({ role: "user", guestId: guestUser._id }, "user", set, get);
                }
            }

            return { success: false };
        } catch (error) {
            console.log("error while connecting user socket ", error);
            return { success: false };
        }
    },
    connectVolunteerSocket: async () => {
        try {
            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            if (!volunteerToken) return { success: false };

            return createSocketConnection({ role: "volunteer", token: volunteerToken }, "volunteer", set, get);
        } catch (error) {
            console.log("error while connecting volunteer socket ", error);
            return { success: false };
        }
    },
    disconnectSocket: () => {
        disconnectExistingSocket(get().socket);
        set({
            socket: null,
            socketConnected: false,
            socketRole: null,
        });
    },
}));

export default useSocketBear;
