import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
}

export const conferencesAPI = {
  getConferences: (params) => api.get('/conferences', { params }),
  getConference: (id) => api.get(`/conferences/${id}`),
  createConference: (data) => api.post('/conferences', data),
  updateConference: (id, data) => api.put(`/conferences/${id}`, data),
  deleteConference: (id) => api.delete(`/conferences/${id}`),
  getUserConferences: () => api.get('/users/me/conferences'),
}

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (userId, data) => api.put(`/admin/users/${userId}/role`, data),
  getAllConferences: (params) => api.get('/admin/conferences', { params }),
  deleteAnyConference: (conferenceId) => api.delete(`/admin/conferences/${conferenceId}`),
}

export default api
