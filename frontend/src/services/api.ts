import axios from 'axios';
import toast from 'react-hot-toast';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const baseURL = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '')
  : import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403) {
      const data = error.response?.data ?? {};
      if (data.isDemo === true) {
        toast('Modo demonstração: ações de edição estão desativadas.', {
          icon: '🔒',
          duration: 3500,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '13px',
            borderRadius: '10px',
            border: '1px solid rgba(251,191,36,0.3)',
          },
        });
      } else if (data.mustChangePassword !== true && !data.requiredPlan) {
        // Permission 403 (roleMiddleware, etc.) — components may not show a specific message
        toast.error(data.error || 'Você não tem permissão para realizar esta ação.');
      }
      // mustChangePassword: ForcePasswordModal handles it — no toast needed
      // requiredPlan: component-level catch shows the specific plan message — avoid duplicate
    }
    return Promise.reject(error);
  }
);

export default api;
