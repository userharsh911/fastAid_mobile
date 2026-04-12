import {create } from "zustand"
import userInstance from "../api/user.api"
import * as SecureStore from 'expo-secure-store';

const useUserBear = create((set)=>({
    user:null,
    token:null,
    userLoader:true,
    latestAlert:null,
    nearbyVolunteers:[],
    selectedVolunteer:null,
    signupUser:async(data)=>{
        try {
            console.log("signup data : ",data)
            const response = await userInstance.post('/auth/signup',data);
            set({user:response.data.user})
            set({token:response.data.token})
            await SecureStore.setItemAsync('userToken',response.data?.token);
            return response.data;
        } catch (error) {
            console.log("Error while signup user : ",error);
            throw error.response?.data;
        }
    },
    loginUser: async(data)=>{
        try {
            console.log("login data : ",data)
            const response = await userInstance.post('/auth/login',data);
            set({user:response.data.user})
            set({token:response.data.token})
            await SecureStore.setItemAsync('userToken',response.data?.token);
            return response.data;
        } catch (error) {
            console.log("Error while login user : ",error);
            throw error.response?.data;
        }
    },
    loginAsGuest:async(data)=>{
        try {
            const response = await userInstance.post('/auth/guest',data);
            set({user:response.data?.user});
            await SecureStore.setItemAsync('guest',JSON.stringify(response.data?.user));
            return response.data;
        } catch (error) {
            console.log("error while login as a guest ",error);
            throw error.response?.data;
        }
    },
    getUser: async()=>{
        try {
            set({userLoader:true})
            const userToken = await SecureStore.getItemAsync('userToken');  
            const guest = await SecureStore.getItemAsync('guest');
            if(userToken){
                const response = await userInstance.get(`/auth/user/${userToken}`)
                set({user:response.data.user});
            } else if(guest){
                set({user:JSON.parse(guest)});
            }
        } catch (error) {
            console.log("error while getting user : ",error);
            // throw error.response?.data;
        } finally{
            set({userLoader:false})
        }
    },
    createAlert: async(data)=>{
        try {
            const userToken = await SecureStore.getItemAsync('userToken');
            const guest = await SecureStore.getItemAsync('guest');

            const payload = {...data};
            let endpoint = '/alert/create';

            if(userToken){
                endpoint = `/alert/create/${userToken}`;
            }else if(guest){
                const guestUser = JSON.parse(guest);
                if(guestUser?._id){
                    payload.as_guest = guestUser._id;
                }
            }

            const response = await userInstance.post(endpoint,payload);
            set({
                latestAlert: response.data?.alert || null,
                nearbyVolunteers: response.data?.nearbyVolunteers || [],
                selectedVolunteer: null,
            });
            return response.data;
        } catch (error) {
            console.log("error while creating alert ",error);
            throw error.response?.data || error;
        }
    },
    setSelectedVolunteer:(volunteer)=>{
        set({selectedVolunteer: volunteer || null});
    },
    clearAlertState:()=>{
        set({latestAlert:null, nearbyVolunteers:[], selectedVolunteer:null});
    },
    logoutUser:async()=>{
        try {
            await SecureStore.deleteItemAsync('userToken');  
            await SecureStore.deleteItemAsync('guest');
            console.log("out from logout");
            set({user:null, token:null, latestAlert:null, nearbyVolunteers:[], selectedVolunteer:null})
        } catch (error) {
            console.log("Error while logout user : ",error);
            throw error.response?.data;
        }
    }
}));

export default useUserBear;