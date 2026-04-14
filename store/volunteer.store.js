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
    volunteerLoader:true,
    volunteerAlerts:[],
    volunteerAlertsLoader:false,
    applyVolunteer: async(data)=>{
        try {
            const response = await volunteerInstance.post('/auth/apply',data);
            set({volunteer:response.data.volunteer});
            set({voluteerToken:response.data.token});
            await SecureStore.setItemAsync("volunteerToken",response.data.token);
            return response.data;
        } catch (error) {
            console.log("error while applying as volunteer ",error);
            throw error.response?.data;
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
            throw error.response?.data;
        }
    },
    getVolunteer:async(showLoader = true)=>{
        try {
            if(showLoader){
                set({volunteerLoader:true});
            }
            const volunteerToken = await SecureStore.getItemAsync("volunteerToken");
            console.log("token vol ",volunteerToken);
            if(volunteerToken){
                const response = await volunteerInstance.get(`/auth/${volunteerToken}`);
                set({volunteer:response.data.volunteer});
            }
        } catch (error) {
            console.log("error while getting volunteer ",error)
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
            console.log("error while saving volunteer push token ",error);
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
            } catch (refreshError) {
                console.log("error while refreshing volunteer after location update ",refreshError);
            }

            if(latestVolunteer){
                set({volunteer:latestVolunteer});
            }

            return {
                ...response.data,
                volunteer: latestVolunteer || response?.data?.volunteer,
            };
        } catch (error) {
            console.log("error while updating volunteer location ",error);
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
            console.log("error while updating volunteer profile ",error);
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
            console.log("error while getting volunteer nearby alerts ",error);
            throw error.response?.data || error;
        } finally{
            if(showLoader){
                set({volunteerAlertsLoader:false});
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
            console.log("error while responding to volunteer alert ",error);
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
            console.log("error while cancelling volunteer alert ",error);
            throw error.response?.data || error;
        }
    },
    logoutVolunteer:async()=>{
        try {
            await SecureStore.deleteItemAsync("volunteerToken");
            set({volunteer:null, volunteerToken:null, volunteerAlerts:[]});
        } catch (error) {
            throw error.response?.data;
        }
    }
}))

export default useVolunteerBear;