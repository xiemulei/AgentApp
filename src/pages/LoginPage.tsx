import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import './LoginPage.css';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 处理URL中的token参数（后端重定向回来时带token）
  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    console.log('[LoginPage] URL参数:', { token, errorParam });

    if (errorParam) {
      setError('登录失败：' + decodeURIComponent(errorParam));
      return;
    }

    if (token) {
      handleTokenLogin(token);
    }
  }, [searchParams]);

  // 已登录则跳转首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated]);

  const handleTokenLogin = async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      localStorage.setItem('auth_token', token);
      console.log('[LoginPage] Token已保存:', token.substring(0, 20) + '...');

      const user = await authService.getCurrentUser();
      if (user) {
        localStorage.setItem('user_info', JSON.stringify(user));
        setUser(user);
        console.log('[LoginPage] 用户信息已获取:', user.username);
        navigate('/', { replace: true });
      } else {
        throw new Error('获取用户信息失败');
      }
    } catch (err) {
      console.error('[LoginPage] Token登录失败:', err);
      setError('登录失败：' + (err instanceof Error ? err.message : '未知错误'));
      localStorage.removeItem('auth_token');
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loginUrl = await authService.getGitHubLoginUrl();
      console.log('[LoginPage] GitHub登录URL:', loginUrl);

      // 直接跳转到GitHub授权页面
      window.location.href = loginUrl;
    } catch (err) {
      console.error('[LoginPage] 获取登录URL失败:', err);
      setError(err instanceof Error ? err.message : '获取登录URL失败');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>AI Agent</h1>
          <p>智能体对话平台</p>
        </div>

        <div className="login-content">
          {error && <div className="error-message">{error}</div>}

          {isLoading && !error && (
            <div className="loading-status">
              <div className="loading-spinner-small"></div>
              <p>登录中...</p>
            </div>
          )}

          {!isLoading && (
            <>
              <div className="login-tips">
                <p>点击登录后，将在浏览器中打开 GitHub 授权页面</p>
                <p>授权成功后会自动跳转回应用</p>
              </div>

              <button
                className="github-login-btn"
                onClick={handleGitHubLogin}
                disabled={isLoading}
              >
                <svg className="github-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                使用 GitHub 登录
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}