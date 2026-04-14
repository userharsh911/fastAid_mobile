import {create } from "zustand"
import userInstance from "../api/user.api"
import * as SecureStore from 'expo-secure-store';

const ACTIVE_ALERT_ID_KEY = 'activeAlertId';

const useUserBear = create((set, get)=>({
    user:null,
    token:null,
    userLoader:true,
    latestAlert:null,
    nearbyVolunteers:[],
    selectedVolunteer:null,
    alertStatusLoader:false,
    alertHistory:[],
    alertHistoryLoader:false,
    signupUser:async(data)=>{
        try {
            const response = await userInstance.post('/auth/signup',data);
            set({user:response.data.user})
            set({token:response.data.token})
            await SecureStore.setItemAsync('userToken',response.data?.token);
            await SecureStore.deleteItemAsync('guest');
            return response.data;
        } catch (error) {
            throw error.response?.data;
        }
    },
    loginUser: async(data)=>{
        try {
            const response = await userInstance.post('/auth/login',data);
            set({user:response.data.user})
            set({token:response.data.token})
            await SecureStore.setItemAsync('userToken',response.data?.token);
            await SecureStore.deleteItemAsync('guest');
            return response.data;
        } catch (error) {
            throw error.response?.data;
        }
    },
    loginAsGuest:async(data)=>{
        try {
            const response = await userInstance.post('/auth/guest',data);
            set({user:response.data?.user});
            set({token:null});
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.setItemAsync('guest',JSON.stringify(response.data?.user));
            return response.data;
        } catch (error) {
            throw error.response?.data;
        }
    },
    convertGuestToUser: async(data)=>{
        try {
            const guest = await SecureStore.getItemAsync('guest');
            if(!guest) throw {message:'Guest session not found'};

            const guestUser = JSON.parse(guest);
            if(!guestUser?._id) throw {message:'Guest account is invalid'};

            const response = await userInstance.post('/auth/guest', {
                id: guestUser._id,
                fullname: data?.fullname,
                phone: data?.phone,
                email: data?.email,
                password: data?.password,
            });

            set({
                user: response.data?.user,
                token: response.data?.token || null,
            });

            if(response.data?.token){
                await SecureStore.setItemAsync('userToken', response.data.token);
            }

            await SecureStore.deleteItemAsync('guest');

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    getUser: async()=>{
        try {
            set({userLoader:true})
            const userToken = await SecureStore.getItemAsync('userToken');  
            const guest = await SecureStore.getItemAsync('guest');
            if(userToken){
                const response = await userInstance.get(`/auth/user/${userToken}`)
                set({user:response.data.user, token:userToken});
            } else if(guest){
                set({user:JSON.parse(guest), token:null});
            }
        } catch (error) {
            // throw error.response?.data;
        } finally{
            set({userLoader:false})
        }
    },
    updateUserProfile: async(data)=>{
        try {
            const userToken = await SecureStore.getItemAsync('userToken');
            if(!userToken) throw {message:'Please complete full login first'};

            const response = await userInstance.post(`/auth/profile/${userToken}`, {
                fullname: data?.fullname,
                phone: data?.phone,
            });

            set({user:response.data?.user || null});

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    createAlert: async(data)=>{
        try {
            const userToken = await SecureStore.getItemAsync('userToken');
            const guest = await SecureStore.getItemAsync('guest');

            const payload = {...data};
            let endpoint = '/alert/create';
            const hasImageAttachment = Boolean(data?.image?.uri);

            if(userToken){
                endpoint = `/alert/create/${userToken}`;
            }else if(guest){
                const guestUser = JSON.parse(guest);
                if(guestUser?._id){
                    payload.as_guest = guestUser._id;
                }
            }

            let response;

            if (hasImageAttachment) {
                const formData = new FormData();

                if (data?.description) {
                    formData.append('description', String(data.description));
                }

                if (data?.coordinates) {
                    formData.append('coordinates', JSON.stringify(data.coordinates));
                }

                if (payload?.as_guest) {
                    formData.append('as_guest', String(payload.as_guest));
                }

                const imageName = data?.image?.fileName || `alert_${Date.now()}.jpg`;
                const imageMimeType = data?.image?.mimeType || 'image/jpeg';

                formData.append('image', {
                    uri: data.image.uri,
                    name: imageName,
                    type: imageMimeType,
                });

                response = await userInstance.post(endpoint, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                response = await userInstance.post(endpoint,payload);
            }

            const alertId = response.data?.alert?._id;

            if (alertId) {
                await SecureStore.setItemAsync(ACTIVE_ALERT_ID_KEY, String(alertId));
            }

            set({
                latestAlert: response.data?.alert || null,
                nearbyVolunteers: response.data?.nearbyVolunteers || [],
                selectedVolunteer: null,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
    fetchAlertStatus: async(alertId, showLoader = true)=>{
        try {
            if(!alertId) return {success:false};

            if (showLoader) {
                set({alertStatusLoader:true});
            }

            const userToken = await SecureStore.getItemAsync('userToken');
            const guest = await SecureStore.getItemAsync('guest');

            const payload = {};
            let endpoint = `/alert/status/${alertId}`;

            if(userToken){
                endpoint = `/alert/status/${alertId}/${userToken}`;
            }else if(guest){
                const guestUser = JSON.parse(guest);
                if(guestUser?._id){
                    payload.as_guest = guestUser._id;
                }
            }

            const response = await userInstance.post(endpoint,payload);
            const alertData = response.data?.alert || null;
            const nearby = response.data?.nearbyVolunteers || [];
            const assignedVolunteerId = alertData?.volunteer_id?._id || alertData?.volunteer_id;
            const assignedVolunteer = nearby.find(
                (volunteer)=> String(volunteer?._id) === String(assignedVolunteerId)
            ) || alertData?.volunteer_id || null;

            if (alertData?._id) {
                await SecureStore.setItemAsync(ACTIVE_ALERT_ID_KEY, String(alertData._id));
            }

            if (alertData?.mode === 'Cancelled' || alertData?.mode === 'End') {
                await SecureStore.deleteItemAsync(ACTIVE_ALERT_ID_KEY);
            }

            set({
                latestAlert: alertData,
                nearbyVolunteers: nearby,
                selectedVolunteer: alertData?.mode === 'Alloted' ? assignedVolunteer : null,
            });
            return response.data;
        } catch (error) {

            if (error?.status === 404 || error?.response?.status === 404) {
                await SecureStore.deleteItemAsync(ACTIVE_ALERT_ID_KEY);
                set({latestAlert:null, nearbyVolunteers:[], selectedVolunteer:null});
                return {success:false};
            }

            throw error.response?.data || error;
        } finally{
            if (showLoader) {
                set({alertStatusLoader:false});
            }
        }
    },
    loadLatestAlertStatus: async()=>{
        try {
            const alertId = await SecureStore.getItemAsync(ACTIVE_ALERT_ID_KEY);
            if(!alertId) return {success:false};

            return await get().fetchAlertStatus(alertId, false);
        } catch (error) {
            throw error;
        }
    },
    getAlertHistory: async(showLoader = false)=>{
        try {
            if(showLoader){
                set({alertHistoryLoader:true});
            }

            const userToken = await SecureStore.getItemAsync('userToken');
            const guest = await SecureStore.getItemAsync('guest');

            const payload = {};
            let endpoint = '/alert/history';

            if(userToken){
                endpoint = `/alert/history/${userToken}`;
            }else if(guest){
                const guestUser = JSON.parse(guest);
                if(guestUser?._id){
                    payload.as_guest = guestUser._id;
                }
            }

            const response = await userInstance.post(endpoint, payload);
            set({alertHistory: response.data?.alerts || []});

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        } finally {
            if(showLoader){
                set({alertHistoryLoader:false});
            }
        }
    },
    cancelAlert: async(alertId)=>{
        try {
            const targetAlertId = alertId || get().latestAlert?._id;
            if(!targetAlertId) return {success:false, message:"Alert id is required"};

            set({alertStatusLoader:true});

            const userToken = await SecureStore.getItemAsync('userToken');
            const guest = await SecureStore.getItemAsync('guest');

            const payload = { alertId: targetAlertId };
            let endpoint = '/alert/cancel';

            if(userToken){
                endpoint = `/alert/cancel/${userToken}`;
            }else if(guest){
                const guestUser = JSON.parse(guest);
                if(guestUser?._id){
                    payload.as_guest = guestUser._id;
                }
            }

            const response = await userInstance.post(endpoint, payload);
            const alertData = response.data?.alert || null;

            if (alertData?.mode === 'Cancelled' || alertData?.mode === 'End') {
                await SecureStore.deleteItemAsync(ACTIVE_ALERT_ID_KEY);
            }

            set({
                latestAlert: alertData,
                selectedVolunteer: null,
            });

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        } finally {
            set({alertStatusLoader:false});
        }
    },
    endAlert: async(alertId)=>{
        try {
            const targetAlertId = alertId || get().latestAlert?._id;
            if(!targetAlertId) return {success:false, message:"Alert id is required"};

            set({alertStatusLoader:true});

            const userToken = await SecureStore.getItemAsync('userToken');
            const guest = await SecureStore.getItemAsync('guest');

            const payload = { alertId: targetAlertId };
            let endpoint = '/alert/end';

            if(userToken){
                endpoint = `/alert/end/${userToken}`;
            }else if(guest){
                const guestUser = JSON.parse(guest);
                if(guestUser?._id){
                    payload.as_guest = guestUser._id;
                }
            }

            const response = await userInstance.post(endpoint, payload);
            const alertData = response.data?.alert || null;

            if (alertData?.mode === 'Cancelled' || alertData?.mode === 'End') {
                await SecureStore.deleteItemAsync(ACTIVE_ALERT_ID_KEY);
            }

            set({
                latestAlert: alertData,
                selectedVolunteer: null,
            });

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        } finally {
            set({alertStatusLoader:false});
        }
    },
    hireVolunteer: async(alertId, volunteerId)=>{
        try {
            const targetAlertId = alertId || get().latestAlert?._id;
            if(!targetAlertId || !volunteerId) return {success:false, message:"Alert id and volunteer id are required"};

            set({alertStatusLoader:true});

            const userToken = await SecureStore.getItemAsync('userToken');
            const guest = await SecureStore.getItemAsync('guest');

            const payload = { alertId: targetAlertId, volunteerId };
            let endpoint = '/alert/hire';

            if(userToken){
                endpoint = `/alert/hire/${userToken}`;
            }else if(guest){
                const guestUser = JSON.parse(guest);
                if(guestUser?._id){
                    payload.as_guest = guestUser._id;
                }
            }

            const response = await userInstance.post(endpoint, payload);
            const alertData = response.data?.alert || null;
            const assignedVolunteerId = alertData?.volunteer_id?._id || alertData?.volunteer_id;
            const assignedVolunteer = get().nearbyVolunteers.find(
                (volunteer)=> String(volunteer?._id) === String(assignedVolunteerId)
            ) || alertData?.volunteer_id || null;

            if (alertData?._id) {
                await SecureStore.setItemAsync(ACTIVE_ALERT_ID_KEY, String(alertData._id));
            }

            set({
                latestAlert: alertData,
                selectedVolunteer: assignedVolunteer,
            });

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        } finally {
            set({alertStatusLoader:false});
        }
    },
    setSelectedVolunteer:(volunteer)=>{
        set({selectedVolunteer: volunteer || null});
    },
    clearAlertState:()=>{
        SecureStore.deleteItemAsync(ACTIVE_ALERT_ID_KEY).catch(() => {});
        set({latestAlert:null, nearbyVolunteers:[], selectedVolunteer:null, alertStatusLoader:false});
    },
    logoutUser:async()=>{
        try {
            await SecureStore.deleteItemAsync('userToken');  
            await SecureStore.deleteItemAsync('guest');
            await SecureStore.deleteItemAsync(ACTIVE_ALERT_ID_KEY);
            set({
                user:null,
                token:null,
                latestAlert:null,
                nearbyVolunteers:[],
                selectedVolunteer:null,
                alertStatusLoader:false,
                alertHistory:[],
                alertHistoryLoader:false,
            })
        } catch (error) {
            throw error.response?.data;
        }
    }
}));

export default useUserBear;
