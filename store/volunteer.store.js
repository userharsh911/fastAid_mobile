import {create} from "zustand"
import volunteerInstance from "../api/volunteer.api";
import userInstance from "../api/user.api";
import * as SecureStore from 'expo-secure-store';

const normalizeLocationCoordinates = (coordinates) => {
    if (Array.isArray(coordinates)) {
        const [longitude, latitude] = coordinates;
        const parsedLatitude = Number(latitude);
        const parsedLongitude = Number(longitude);

        if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
            return null;
        }

        return { latitude: parsedLatitude, longitude: parsedLongitude };
    }

    const parsedLatitude = Number(coordinates?.latitude ?? coordinates?.lat);
    const parsedLongitude = Number(coordinates?.longitude ?? coordinates?.lng);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
        return null;
    }

    return { latitude: parsedLatitude, longitude: parsedLongitude };
};

const useVolunteerBear = create((set, get)=>({
    volunteer:null,
    voluteerToken:null,
    pendingVolunteerOtpSession:null,
    volunteerLoader:true,
    volunteerAlerts:[],
    volunteerAlertsLoader:false,
    volunteerHistory:[],
    volunteerHistoryLoader:false,
    applyVolunteer: async(data)=>{
        try {
            const hasDocument = Boolean(data?.document?.uri);

            let response;
            if (hasDocument) {
                const formData = new FormData();
                formData.append('fullname', String(data?.fullname || ''));
                formData.append('email', String(data?.email || ''));
                formData.append('password', String(data?.password || ''));
                formData.append('phone', String(data?.phone || ''));

                if (data?.coordinates) {
                    formData.append('coordinates', JSON.stringify(data.coordinates));
                }

                const documentName = data?.document?.name || `volunteer_doc_${Date.now()}`;
                const documentMimeType = data?.document?.mimeType || 'application/octet-stream';

                formData.append('document', {
                    uri: data.document.uri,
                    name: documentName,
                    type: documentMimeType,
                });

                response = await volunteerInstance.post('/auth/apply', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                response = await volunteerInstance.post('/auth/apply', data);
            }

            if (response.data?.requiresOtp) {
                set({
                    pendingVolunteerOtpSession: {
                        email: String(data?.email || '').trim().toLowerCase(),
                        password: String(data?.password || ''),
                    },
                });
                return response.data;
            }

            if (response.data?.token && response.data?.volunteer) {
                set({volunteer:response.data.volunteer});
                set({voluteerToken:response.data.token});
                set({pendingVolunteerOtpSession:null});
                await SecureStore.setItemAsync("volunteerToken",response.data.token);
            }

            return response.data;
        } catch (error) {
            throw error.response?.data;
        }
    },
    loginVolunteer:async(data)=>{
        try {
            const response = await volunteerInstance.post('/auth/login',data);

            if (response.data?.requiresOtp) {
                set({
                    pendingVolunteerOtpSession: {
                        email: String(data?.email || '').trim().toLowerCase(),
                        password: String(data?.password || ''),
                    },
                });
                return response.data;
            }

            if (response.data?.token && response.data?.volunteer) {
                set({volunteer:response.data.volunteer});
                set({voluteerToken:response.data.token});
                set({pendingVolunteerOtpSession:null});
                await SecureStore.setItemAsync("volunteerToken",response.data.token);
            }

            return response.data;
        } catch (error) {
            throw error.response?.data;
        }
    },
    verifyVolunteerOtp: async({ email, otp })=>{
        try {
            const response = await volunteerInstance.post('/auth/verify-otp', {
                email,
                otp,
            });

            if (response.data?.token && response.data?.volunteer) {
                set({
                    volunteer: response.data.volunteer,
                    voluteerToken: response.data.token,
                    pendingVolunteerOtpSession: null,
                });
                await SecureStore.setItemAsync("volunteerToken",response.data.token);
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    resendVolunteerOtp: async({ email, password })=>{
        try {
            const response = await volunteerInstance.post('/auth/resend-otp', {
                email,
                password,
            });

            if (response.data?.requiresOtp) {
                set({
                    pendingVolunteerOtpSession: {
                        email: String(email || '').trim().toLowerCase(),
                        password: String(password || ''),
                    },
                });
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    sendVolunteerForgotPasswordOtp: async({ email })=>{
        try {
            const response = await volunteerInstance.post('/auth/forgot-password/send-otp', {
                email,
            });

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    verifyVolunteerForgotPasswordOtp: async({ email, otp })=>{
        try {
            const response = await volunteerInstance.post('/auth/forgot-password/verify-otp', {
                email,
                otp,
            });

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    resetVolunteerForgotPassword: async({ email, newPassword, resetSessionToken })=>{
        try {
            const response = await volunteerInstance.post('/auth/forgot-password/reset', {
                email,
                newPassword,
                resetSessionToken,
            });

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    setPendingVolunteerOtpSession: (data)=>{
        set({
            pendingVolunteerOtpSession: data
                ? {
                    email: String(data?.email || '').trim().toLowerCase(),
                    password: String(data?.password || ''),
                }
                : null,
        });
    },
    clearPendingVolunteerOtpSession: ()=>{
        set({ pendingVolunteerOtpSession: null });
    },
    getVolunteer:async(showLoader = true)=>{
        try {
            if(showLoader){
                set({volunteerLoader:true});
            }
            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            if(volunteerToken){
                const response = await volunteerInstance.get(`/auth/${volunteerToken}`);
                set({volunteer:response.data.volunteer});
            }
        } catch (error) {
        } finally{
            if(showLoader){
                set({volunteerLoader:false});
            }
        }
    },
    saveVolunteerPushToken: async(pushToken)=>{
        try {
            if(!pushToken) return {success:false};

            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            if(!volunteerToken) return {success:false};

            await volunteerInstance.post(`/save-token/${volunteerToken}`,{token:pushToken});

            set((state)=>({
                volunteer:state.volunteer ? {...state.volunteer, push_token:pushToken} : state.volunteer
            }));

            return {success:true};
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    updateVolunteerLocation: async(coordinates)=>{
        try {
            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            if(!volunteerToken) return {success:false, message:"Volunteer session expired"};

            const normalizedCoordinates = normalizeLocationCoordinates(coordinates);
            if(!normalizedCoordinates){
                throw { message: "Invalid coordinates" };
            }

            const response = await volunteerInstance.post(`/update-location/${volunteerToken}`, {
                coordinates: {
                    latitude: normalizedCoordinates.latitude,
                    longitude: normalizedCoordinates.longitude,
                },
            });

            let latestVolunteer = response?.data?.volunteer;

            try {
                const freshVolunteerResponse = await volunteerInstance.get(`/auth/${volunteerToken}`);
                if(freshVolunteerResponse?.data?.volunteer){
                    latestVolunteer = freshVolunteerResponse.data.volunteer;
                }
            } catch (_refreshError) {
                // Keep initial response volunteer payload if refresh call fails.
            }

            if(latestVolunteer){
                set({volunteer:latestVolunteer});
            }

            return {
                ...response.data,
                volunteer: latestVolunteer || response?.data?.volunteer,
            };
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    updateVolunteerProfile: async(data)=>{
        try {
            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            if(!volunteerToken) return {success:false};

            const response = await volunteerInstance.post(`/update-profile/${volunteerToken}`, {
                fullname: data?.fullname,
                phone: data?.phone,
            });

            if(response?.data?.volunteer){
                set({volunteer:response.data.volunteer});
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    getVolunteerNearbyAlerts: async(showLoader = true)=>{
        try {
            if(showLoader){
                set({volunteerAlertsLoader:true});
            }
            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            if(!volunteerToken){
                set({volunteerAlerts:[]});
                return {success:false};
            }

            const response = await userInstance.get(`/alert/volunteer/active/${volunteerToken}`);
            set({volunteerAlerts:response.data?.alerts || []});
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        } finally{
            if(showLoader){
                set({volunteerAlertsLoader:false});
            }
        }
    },
    getVolunteerAlertHistory: async(showLoader = true)=>{
        try {
            if(showLoader){
                set({volunteerHistoryLoader:true});
            }

            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            if(!volunteerToken){
                set({volunteerHistory:[]});
                return {success:false};
            }

            const response = await userInstance.post(`/alert/volunteer/history/${volunteerToken}`);
            set({volunteerHistory:response.data?.alerts || []});
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        } finally{
            if(showLoader){
                set({volunteerHistoryLoader:false});
            }
        }
    },
    respondToAlert: async(alertId)=>{
        try {
            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            if(!volunteerToken) return {success:false};

            const response = await userInstance.post(`/alert/volunteer/select/${volunteerToken}`, {
                alertId,
            });

            if(response?.data?.alert){
                set((state)=>({
                    volunteerAlerts: state.volunteerAlerts.map((alert)=>
                        String(alert._id) === String(alertId) ? response.data.alert : alert
                    )
                }));
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    cancelVolunteerAlert: async(alertId)=>{
        try {
            if(!alertId) return {success:false, message:"Alert id is required"};

            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            if(!volunteerToken) return {success:false};

            const response = await userInstance.post(`/alert/volunteer/cancel/${volunteerToken}`, {
                alertId,
            });

            const updatedAlert = response.data?.alert;
            const releasedVolunteer = response.data?.releasedVolunteer;

            if(updatedAlert?._id){
                set((state)=>(
                    {
                        volunteerAlerts: state.volunteerAlerts.map((alert)=>
                            String(alert._id) === String(updatedAlert._id) ? updatedAlert : alert
                        )
                    }
                ));
            }

            if(releasedVolunteer && String(releasedVolunteer?._id) === String(get().volunteer?._id)){
                set((state)=>(
                    {
                        volunteer: state.volunteer ? {...state.volunteer, mode: releasedVolunteer.mode} : state.volunteer
                    }
                ));
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    logoutVolunteer:async()=>{
        try {
            await SecureStore.deleteItemAsync("volunteerToken");
            set({volunteer:null, voluteerToken:null, pendingVolunteerOtpSession:null, volunteerAlerts:[], volunteerHistory:[]});
        } catch (error) {
            throw error.response?.data;
        }
    }
}))

export default useVolunteerBear;
