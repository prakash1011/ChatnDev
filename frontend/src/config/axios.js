import axios from 'axios';

// Use relative URLs in production for Netlify redirects to work
// This allows the redirects in netlify.toml to properly forward requests to the backend
const baseURL = import.meta.env.PROD ? '' : import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
    baseURL
});

// Add a request interceptor to update the token for every request
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default axiosInstance;