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
   * 后端可能会返回HTML页面或JSON，需要分别处理
   */
  async handleGitHubCallback(code: string, state: string): Promise<LoginResult> {
    try {
      console.log('[authService] 处理GitHub回调:', { code, state });
      
      // 使用fetch直接请求，以便处理不同响应类型
      const response = await fetch(
        `http://localhost:8091/api/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      console.log('[authService] 回调响应状态:', response.status);
      console.log('[authService] 回调响应类型:', response.headers.get('content-type'));

      const contentType = response.headers.get('content-type') || '';

      // 如果是JSON响应
      if (contentType.includes('application/json')) {
        const result = await response.json();
        console.log('[authService] JSON响应:', result);
        
        if (result.code === '0000' || result.code === '200') {
          const userInfo = result.data;
          if (userInfo && userInfo.token) {
            localStorage.setItem('auth_token', userInfo.token);
            localStorage.setItem('user_info', JSON.stringify(userInfo));
            return {
              success: true,
              token: userInfo.token,
              user: userInfo,
            };
          }
        }
        return { success: false, error: result.info || '登录失败' };
      }

      // 如果是HTML响应，尝试从HTML中提取token或重定向URL
      const html = await response.text();
      console.log('[authService] HTML响应:', html.substring(0, 500));

      // 尝试从HTML中提取token
      const tokenMatch = html.match(/token["\s:=]+(["']?)([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\1/);
      if (tokenMatch && tokenMatch[2]) {
        const token = tokenMatch[2];
        console.log('[authService] 从HTML中提取到token');
        localStorage.setItem('auth_token', token);
        
        // 获取用户信息
        const user = await this.getCurrentUser();
        if (user) {
          localStorage.setItem('user_info', JSON.stringify(user));
          return { success: true, token, user };
        }
      }

      // 尝试从重定向URL中提取token
      const redirectMatch = html.match(/(?:window\.location|href)["\s=]+["']([^"']*(?:\?|&)token=[^"']+)["']/i);
      if (redirectMatch) {
        const redirectUrl = redirectMatch[1];
        const urlParams = new URLSearchParams(redirectUrl.split('?')[1] || '');
        const token = urlParams.get('token');
        if (token) {
          console.log('[authService] 从重定向URL中提取到token');
          localStorage.setItem('auth_token', token);
          const user = await this.getCurrentUser();
          if (user) {
            localStorage.setItem('user_info', JSON.stringify(user));
            return { success: true, token, user };
          }
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