import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000,
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
      if (error.config?.url && !error.config.url.includes('/health')) {
      }
    
    return Promise.reject(error)
  }
)

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('refresh_token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)
