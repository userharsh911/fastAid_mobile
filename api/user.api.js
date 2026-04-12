import axios from "axios"

const userInstance = axios.create({
    baseURL:'http:///10.59.130.241:5005/api',
    headers:{
        "Content-Type":"application/json"
    },
})

export default userInstance;

