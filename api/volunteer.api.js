import axios from "axios"

const volunteerInstance = axios.create({
    baseURL:'https://emergent-guardian.onrender.com/api/volunteer',
    headers:{
        "Content-Type":"application/json"
    }
})

export default volunteerInstance;

