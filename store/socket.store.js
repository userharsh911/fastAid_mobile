import { create } from "zustand";
import { io } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import useUserBear from "./user.store";
import useVolunteerBear from "./volunteer.store";

const SOCKET_BASE_URL = "https://emergent-guardian.onrender.com";

const disconnectExistingSocket = (socket) => {
    if (!socket) return;

    socket.removeAllListeners();
    socket.disconnect();
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
        await useVolunteerBear.getState().getVolunteerNearbyAlerts(false).catch(() => {});

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
