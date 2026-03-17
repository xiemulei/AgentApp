import apiClient from './api';
import type { ApiResponse, UserInfo, RegisterRequest, LoginRequest } from '../types/api';

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: UserInfo;
  error?: string;
}

export const authService = {
  /**
   * 用户注册
   */
  async register(request: RegisterRequest): Promise<AuthResult> {
    try {
      console.log('[authService] 注册请求:', { ...request, password: '***', confirmPassword: '***' });
      const response = await apiClient.post<ApiResponse<UserInfo>>('/api/auth/register', request);
      console.log('[authService] 注册响应:', response.data);

      if (response.data.code === '0000' || response.data.code === '200') {
        const user = response.data.data;
        if (user && user.token) {
          localStorage.setItem('auth_token', user.token);
          localStorage.setItem('user_info', JSON.stringify(user));
          return { success: true, user };
        }
        return { success: true };
      }
      return { success: false, error: response.data.info || '注册失败' };
    } catch (error) {
      console.error('[authService] 注册失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '注册失败' };
    }
  },

  /**
   * 用户登录（支持密码和短信验证码）
   */
  async login(request: LoginRequest): Promise<AuthResult> {
    try {
      console.log('[authService] 登录请求:', { ...request, password: '***', verifyCode: '***' });
      const response = await apiClient.post<ApiResponse<UserInfo>>('/api/auth/login', request);
      console.log('[authService] 登录响应:', response.data);

      if (response.data.code === '0000' || response.data.code === '200') {
        const user = response.data.data;
        if (user && user.token) {
          localStorage.setItem('auth_token', user.token);
          localStorage.setItem('user_info', JSON.stringify(user));
          return { success: true, user };
        }
        return { success: true };
      }
      return { success: false, error: response.data.info || '登录失败' };
    } catch (error) {
      console.error('[authService] 登录失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '登录失败' };
    }
  },

  /**
   * 发送短信验证码
   */
  async sendSmsCode(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[authService] 发送验证码:', phone);
      const response = await apiClient.post<ApiResponse<void>>(
        `/api/auth/sms/send?phone=${encodeURIComponent(phone)}`
      );
      console.log('[authService] 发送验证码响应:', response.data);

      if (response.data.code === '0000' || response.data.code === '200') {
        return { success: true };
      }
      return { success: false, error: response.data.info || '发送失败' };
    } catch (error) {
      console.error('[authService] 发送验证码失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '发送失败' };
    }
  },

  /**
   * 检查用户名是否可用
   */
  async checkUsername(username: string): Promise<{ available: boolean; message?: string }> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, unknown>>>(
        '/api/auth/check/username',
        { params: { username } }
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        const data = response.data.data;
        return {
          available: data?.available === true || data?.exists === false,
          message: data?.message as string | undefined,
        };
      }
      return { available: false };
    } catch (error) {
      console.error('[authService] 检查用户名失败:', error);
      return { available: false };
    }
  },

  /**
   * 检查手机号是否可用
   */
  async checkPhone(phone: string): Promise<{ available: boolean; message?: string }> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, unknown>>>(
        '/api/auth/check/phone',
        { params: { phone } }
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        const data = response.data.data;
        return {
          available: data?.available === true || data?.exists === false,
          message: data?.message as string | undefined,
        };
      }
      return { available: false };
    } catch (error) {
      console.error('[authService] 检查手机号失败:', error);
      return { available: false };
    }
  },

  /**
   * 获取 GitHub 登录 URL
   */
  async getGitHubLoginUrl(): Promise<string> {
    try {
      const response = await apiClient.get<ApiResponse<string>>('/api/auth/github/url');
      console.log('[authService] 获取GitHub登录URL响应:', response.data);
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data;
      }
      throw new Error('获取 GitHub 登录 URL 失败');
    } catch (error) {
      console.error('[authService] 获取GitHub登录URL失败:', error);
      throw error;
    }
  },

  /**
   * 处理 GitHub OAuth 回调
   */
  async handleGitHubCallback(code: string, state: string): Promise<AuthResult> {
    try {
      console.log('[authService] 处理GitHub回调:', { code, state });

      const response = await fetch(
        `http://localhost:8091/api/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      );

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const result = await response.json();
        console.log('[authService] JSON响应:', result);

        if (result.code === '0000' || result.code === '200') {
          const userInfo = result.data;
          if (userInfo && userInfo.token) {
            localStorage.setItem('auth_token', userInfo.token);
            localStorage.setItem('user_info', JSON.stringify(userInfo));
            return { success: true, user: userInfo };
          }
        }
        return { success: false, error: result.info || '登录失败' };
      }

      const html = await response.text();
      const tokenMatch = html.match(/token["\s:=]+(["']?)([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\1/);
      if (tokenMatch && tokenMatch[2]) {
        const token = tokenMatch[2];
        localStorage.setItem('auth_token', token);
        const user = await this.getCurrentUser();
        if (user) {
          localStorage.setItem('user_info', JSON.stringify(user));
          return { success: true, token, user };
        }
      }

      return { success: false, error: '无法从响应中提取token' };
    } catch (error) {
      console.error('[authService] GitHub回调处理失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '登录失败' };
    }
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const response = await apiClient.get<ApiResponse<UserInfo>>('/api/auth/me');
      console.log('[authService] 获取用户信息响应:', response.data);
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[authService] 获取用户信息失败:', error);
      return null;
    }
  },

  /**
   * 退出登录
   */
  async logout(): Promise<void> {
    try {
      await apiClient.get('/api/auth/logout');
    } catch (error) {
      console.error('[authService] 退出登录失败:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
    }
  },
};