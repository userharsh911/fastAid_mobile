import axios from "axios"

const volunteerInstance = axios.create({
    baseURL:'http://10.59.130.241:5005/api/volunteer',
    headers:{
        "Content-Type":"application/json"
    }
})

export default volunteerInstance;

