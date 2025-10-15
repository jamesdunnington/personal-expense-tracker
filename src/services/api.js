import axios from 'axios'

// Use Netlify Functions in production, local API in development
// Check if we're on Netlify domain or localhost
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
const API_URL = import.meta.env.VITE_API_URL || 
  (isProduction ? '/.netlify/functions' : 'http://localhost:3000/api')

console.log('Environment check:', {
  hostname: window.location.hostname,
  isProduction,
  API_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  PROD: import.meta.env.PROD
})

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api