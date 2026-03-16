import apiClient from './api';
import type { ApiResponse, UserInfo } from '../types/api';

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: UserInfo;
  error?: string;
}

export const authService = {
  /**
   * 获取 GitHub 登录 URL
   */
  async getGitHubLoginUrl(): Promise<string> {
    try {
      const response = await apiClient.get<ApiResponse<string>>('/api/auth/github/url');
      // 后端返回 code="0000" 表示成功
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data;
      }
      throw new Error('获取 GitHub 登录 URL 失败');
    } catch (error) {
      console.error('获取 GitHub 登录 URL 失败:', error);
      throw error;
    }
  },

  /**
   * 处理 GitHub OAuth 回调
   */
  async handleGitHubCallback(code: string, state: string): Promise<LoginResult> {
    try {
      // 注意：后端返回的是 HTML 页面，需要前端解析或者后端直接返回 token
      // 这里假设后端返回 JSON 格式的 token
      const response = await apiClient.get<ApiResponse<UserInfo>>(
        '/api/auth/github/callback',
        {
          params: { code, state },
        }
      );

      if (response.data.code === '200') {
        const userInfo = response.data.data;
        if (userInfo.token) {
          localStorage.setItem('auth_token', userInfo.token);
          localStorage.setItem('user_info', JSON.stringify(userInfo));
          return {
            success: true,
            token: userInfo.token,
            user: userInfo,
          };
        }
      }
      return { success: false, error: '登录失败' };
    } catch (error) {
      console.error('GitHub 回调处理失败:', error);
      return { success: false, error: '登录失败' };
    }
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const response = await apiClient.get<ApiResponse<UserInfo>>('/api/auth/me');
      if (response.data.code === '200') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
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
      console.error('退出登录失败:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
    }
  },
};
