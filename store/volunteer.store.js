import {create} from "zustand"
import volunteerInstance from "../api/volunteer.api";
import * as SecureStore from 'expo-secure-store';

const useVolunteerBear = create((set)=>({
    volunteer:null,
    voluteerToken:null,
    volunteerLoader:true,
    applyVolunteer: async(data)=>{
        try {
            const response = await volunteerInstance.post('/auth/apply',data);
            set({volunteer:response.data.volunteer});
            set({voluteerToken:response.data.token});
            await SecureStore.setItemAsync("volunteerToken",response.data.token);
            return response.data;
        } catch (error) {
            console.log("error while applying as volunteer ",error);
        }
    },
    loginVolunteer:async(data)=>{
        try {
            const response = await volunteerInstance.post('/auth/login',data);
            set({volunteer:response.data.volunteer});
            set({voluteerToken:response.data.token});
            await SecureStore.setItemAsync("volunteerToken",response.data.token);
            return response.data;
        } catch (error) {
            console.log("error while logging as volunteer ",error);
        }
    },
    getVolunteer:async()=>{
        try {
            set({volunteerLoader:true});
            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            console.log("token vol ",volunteerToken);
            if(volunteerToken){
                const response = await volunteerInstance.get(`/auth/${volunteerToken}`);
                set({volunteer:response.data.volunteer});
            }
        } catch (error) {
            console.log("error while getting volunteer ",error)
        } finally{
            set({volunteerLoader:false});
        }
    },
    logoutVolunteer:async()=>{
        try {
            await SecureStore.deleteItemAsync("volunteerToken");
            set({volunteer:null});
            set({volunteerToken:null});
        } catch (error) {
            
        }
    }
}))

export default useVolunteerBear;