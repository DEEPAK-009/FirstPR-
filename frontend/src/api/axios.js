import axios from 'axios'

const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5070/api').trim().replace(/\/+$/, '');
const normalizedBaseURL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const instance = axios.create({
  baseURL: normalizedBaseURL,
})

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default instance
