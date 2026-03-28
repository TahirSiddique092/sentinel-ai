import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Inject JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sentinel_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sentinel_token')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  me: () => api.get('/auth/me'),
}

export const scansAPI = {
  list: (params) => api.get('/scans', { params }),
  get: (id) => api.get(`/scans/${id}`),
  findings: (id) => api.get(`/scans/${id}/findings`),
  report: (id, format) => api.get(`/scans/${id}/report`, {
    params: { format },
    responseType: format === 'html' ? 'blob' : 'json'
  }),
}

export const userAPI = {
  me: () => api.get('/users/me'),
}

export default api