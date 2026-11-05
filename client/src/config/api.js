import axios from "axios";

export const API_BASE_URL = (
    import.meta.env.VITE_BASE_URL && import.meta.env.VITE_BASE_URL !== "/"
        ? import.meta.env.VITE_BASE_URL
        : "https://drivea-bjn0.onrender.com"
).replace(/\/+$/, "");

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Attach Authorization Bearer token from localStorage for cross-origin resilience
api.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
