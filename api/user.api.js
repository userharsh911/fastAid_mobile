import axios from "axios"

const userInstance = axios.create({
    baseURL:'https://emergent-guardian.onrender.com/api',
    headers:{
        "Content-Type":"application/json"
    },
})

export default userInstance;

