import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // رابط الباك إند تبعك
  headers: {
    'Content-Type': 'application/json',
  },
});

// هذا الكود عشان يمسك التوكن تلقائياً ويبعثه مع أي طلب مستقبلاً
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;