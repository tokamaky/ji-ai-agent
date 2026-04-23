import axios from 'axios'
import toast from 'react-hot-toast'

/** Axios instance with base URL and timeout */
const api = axios.create({
  baseURL: (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_BASE_URL ?? '',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — inject auth tokens here if needed
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

// Response interceptor — unified error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please check your connection.')
    } else if (error.response) {
      const status = error.response.status as number
      if (status >= 500) toast.error('Server error, please try again later')
      else if (status === 404) toast.error('Endpoint not found')
      else if (status === 401) toast.error('Unauthorised — please log in again')
    } else if (error.message !== 'canceled') {
      toast.error('Network error. Please check your connection.')
    }
    return Promise.reject(error)
  },
)

export default api
