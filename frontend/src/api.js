import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://school-management-system-for-cbc-and.onrender.com';

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
});

export default api;
