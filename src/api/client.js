import axios from 'axios';

const API_URLS = {
  tialulu:  import.meta.env.VITE_API_TIALULU,
  tiadinha: import.meta.env.VITE_API_TIADINHA,
};

const subdomain = window.location.hostname.split('.')[0];
const baseURL = API_URLS[subdomain] ?? 'http://localhost:5009';

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
