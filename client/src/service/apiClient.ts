import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/env';

const AUTH_ERROR_STATUSES = new Set([401, 403]);

let lastNetworkToastAt = 0;

const shouldShowNetworkToast = (): boolean => {
  const now = Date.now();
  // Prevent toast storms when multiple requests fail together.
  if (now - lastNetworkToastAt < 2500) return false;
  lastNetworkToastAt = now;
  return true;
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/') return;
  window.location.assign('/');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status && AUTH_ERROR_STATUSES.has(status)) {
      redirectToLogin();
    } else if (!error.response && shouldShowNetworkToast()) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
