import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || "https://drivea-bjn0.onrender.com",
    withCredentials: true,
});

export default api;
