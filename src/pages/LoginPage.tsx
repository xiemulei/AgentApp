import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import './LoginPage.css';

type LoginMode = 'password' | 'sms';

export function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('password');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone: '',
    verifyCode: '',
  });
  const [countdown, setCountdown] = useState(0);
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

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSendCode = async () => {
    if (!formData.phone || !/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError('请输入正确的手机号');
      return;
    }

    if (countdown > 0) return;

    setIsLoading(true);
    try {
      const result = await authService.sendSmsCode(formData.phone);
      if (result.success) {
        setCountdown(60);
      } else {
        setError(result.error || '发送失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'password') {
      if (!formData.username.trim()) {
        setError('请输入用户名');
        return;
      }
      if (!formData.password) {
        setError('请输入密码');
        return;
      }
    } else {
      if (!formData.phone || !/^1[3-9]\d{9}$/.test(formData.phone)) {
        setError('请输入正确的手机号');
        return;
      }
      if (!formData.verifyCode) {
        setError('请输入验证码');
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await authService.login({
        loginType: mode,
        username: mode === 'password' ? formData.username : undefined,
        password: mode === 'password' ? formData.password : undefined,
        phone: mode === 'sms' ? formData.phone : undefined,
        verifyCode: mode === 'sms' ? formData.verifyCode : undefined,
      });

      if (result.success) {
        if (result.user) {
          setUser(result.user);
        }
        navigate('/', { replace: true });
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loginUrl = await authService.getGitHubLoginUrl();
      console.log('[LoginPage] GitHub登录URL:', loginUrl);
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

          {/* 登录方式切换 */}
          <div className="login-tabs">
            <button
              className={`tab-btn ${mode === 'password' ? 'active' : ''}`}
              onClick={() => setMode('password')}
            >
              密码登录
            </button>
            <button
              className={`tab-btn ${mode === 'sms' ? 'active' : ''}`}
              onClick={() => setMode('sms')}
            >
              验证码登录
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'password' ? (
              <>
                <div className="form-group">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="用户名"
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="密码"
                    disabled={isLoading}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="手机号"
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group with-btn">
                  <input
                    type="text"
                    name="verifyCode"
                    value={formData.verifyCode}
                    onChange={handleChange}
                    placeholder="验证码"
                    disabled={isLoading}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    className="send-code-btn"
                    onClick={handleSendCode}
                    disabled={isLoading || countdown > 0}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </>
            )}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="divider">
            <span>或</span>
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

          <div className="form-footer">
            <span>没有账户？</span>
            <Link to="/register">立即注册</Link>
          </div>
        </div>
      </div>
    </div>
  );
}