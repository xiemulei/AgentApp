import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse } from '../types/api';

const API_BASE_URL = 'http://localhost:8091';

// 不需要认证的接口
const PUBLIC_PATHS = [
  '/api/auth/github/url',
  '/api/auth/github/callback',
];

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加认证 token
    this.client.interceptors.request.use(
      (config) => {
        // 对于公开接口，不添加 token
        const isPublicPath = PUBLIC_PATHS.some(path =>
          config.url?.includes(path)
        );

        if (!isPublicPath) {
          const token = localStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 统一处理错误
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          // Token 过期或无效，清除本地存储并跳转到登录页
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

const apiClientInstance = new ApiClient();
export const apiClient = apiClientInstance.getClient();
export default apiClient;
