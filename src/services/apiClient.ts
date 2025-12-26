import axios, { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import type { BffResponse } from '@/types/auth';

// API base URL for core business logic
// Proximity through Vite proxy to http://localhost:8082
const API_BASE_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

// Response interceptor to handle BffResponse format
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BffResponse>) => {
    if (error.response?.data?.traceId) {
      console.error('[API Error]', {
        traceId: error.response.data.traceId,
        code: error.response.data.error?.code,
        message: error.response.data.error?.message,
      });
    }
    return Promise.reject(error);
  }
);

export async function handleRequest<T>(
  requestPromise: Promise<AxiosResponse<BffResponse<T>>>
): Promise<BffResponse<T>> {
  try {
    const response = await requestPromise;
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<BffResponse<T>>;
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    throw error;
  }
}

export default apiClient;
