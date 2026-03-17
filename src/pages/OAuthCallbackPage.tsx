import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import './LoginPage.css';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    console.log('[OAuthCallback] URL参数:', { code, state, token, errorParam });

    if (errorParam) {
      setStatus('error');
      setError(decodeURIComponent(errorParam));
      return;
    }

    // 如果URL中直接有token
    if (token) {
      await handleTokenLogin(token);
      return;
    }

    // 如果有code和state，需要调用后端回调接口
    if (code && state) {
      try {
        const result = await authService.handleGitHubCallback(code, state);
        if (result.success && result.token) {
          setStatus('success');
          if (result.user) {
            setUser(result.user);
          }
          setTimeout(() => navigate('/', { replace: true }), 500);
        } else {
          setStatus('error');
          setError(result.error || '登录失败');
        }
      } catch (err) {
        console.error('[OAuthCallback] 回调处理失败:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : '登录失败');
      }
      return;
    }

    // 没有必要的参数
    setStatus('error');
    setError('无效的回调参数');
  };

  const handleTokenLogin = async (token: string) => {
    try {
      localStorage.setItem('auth_token', token);
      const user = await authService.getCurrentUser();
      if (user) {
        localStorage.setItem('user_info', JSON.stringify(user));
        setUser(user);
        setStatus('success');
        setTimeout(() => navigate('/', { replace: true }), 500);
      } else {
        throw new Error('获取用户信息失败');
      }
    } catch (err) {
      console.error('[OAuthCallback] Token登录失败:', err);
      localStorage.removeItem('auth_token');
      setStatus('error');
      setError(err instanceof Error ? err.message : '登录失败');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>AI Agent</h1>
          <p>登录处理中...</p>
        </div>

        <div className="login-content">
          {status === 'processing' && (
            <div className="loading-status">
              <div className="loading-spinner-small"></div>
              <p>正在处理登录...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="success-message">
              <p>登录成功，正在跳转...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="error-message">
              <p>{error || '登录失败'}</p>
              <button onClick={() => navigate('/login')} className="github-login-btn">
                返回登录
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}