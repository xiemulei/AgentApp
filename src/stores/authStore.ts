import { create } from 'zustand';
import type { UserInfo } from '../types/api';

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserInfo | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    const userInfoStr = localStorage.getItem('user_info');

    if (!token) {
      set({ isLoading: false });
      return;
    }

    // 如果有缓存的用户信息，先使用
    if (userInfoStr) {
      try {
        const userInfo: UserInfo = JSON.parse(userInfoStr);
        set({
          user: userInfo,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        set({ isLoading: false });
        return;
      }
    }

    // 没有缓存用户信息，调用 API 获取
    try {
      console.log('[authStore] 尝试获取用户信息, token:', token?.substring(0, 20) + '...');
      
      const response = await fetch('http://localhost:8091/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[authStore] 获取用户信息响应状态:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[authStore] 获取用户信息响应:', result);
        if (result.code === '0000' || result.code === '200') {
          const userInfo: UserInfo = result.data;
          localStorage.setItem('user_info', JSON.stringify(userInfo));
          set({
            user: userInfo,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
      
      // Token无效，清除
      console.log('[authStore] Token无效，清除登录状态');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      set({ isLoading: false });
    } catch (error) {
      console.error('[authStore] 获取用户信息失败:', error);
      localStorage.removeItem('auth_token');
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
