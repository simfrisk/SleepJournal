import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { getAccessToken, setAccessToken, clearAccessToken } from "../utils/token"

// Determine API URL - use relative path for production (Netlify),
// or VITE_API_URL if explicitly set and not localhost
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  const isProduction = import.meta.env.PROD

  // If VITE_API_URL is set and contains localhost, ignore it in production
  if (envUrl && envUrl.includes("localhost")) {
    // Only use localhost in development
    if (!isProduction) {
      return envUrl
    }
    // In production, always use relative path (never localhost)
    return "/.netlify/functions"
  }

  // Use VITE_API_URL if set, otherwise default to relative path
  return envUrl || "/.netlify/functions"
}

const API_URL = getApiUrl()

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
})

// Request interceptor - add access token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle token refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })

  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // If error is 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Try to refresh token
        const response = await axios.post(`${API_URL}/auth-refresh`, {}, { withCredentials: true })

        const { accessToken } = response.data
        setAccessToken(accessToken)

        processQueue(null)

        // Retry original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        processQueue(refreshError)
        clearAccessToken()

        // Redirect to login page
        if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
          window.location.href = "/login"
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
