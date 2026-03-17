import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { Layout } from './components/Layout';
import { ChatPage } from './pages/ChatPage';
import { useAuthStore } from './stores/authStore';
import { authService } from './services/authService';
import './styles/variables.css';

// 处理URL中的token参数
function TokenHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [status, setStatus] = useState<'processing' | 'done'>('processing');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      console.log('[TokenHandler] 发现URL中的token');
      handleTokenLogin(token);
    } else {
      setStatus('done');
    }
  }, [searchParams]);

  const handleTokenLogin = async (token: string) => {
    try {
      localStorage.setItem('auth_token', token);
      console.log('[TokenHandler] Token已保存');

      const user = await authService.getCurrentUser();
      if (user) {
        localStorage.setItem('user_info', JSON.stringify(user));
        setUser(user);
        console.log('[TokenHandler] 登录成功:', user.username);
        // 清除URL中的token参数
        navigate('/', { replace: true });
      } else {
        throw new Error('获取用户信息失败');
      }
    } catch (err) {
      console.error('[TokenHandler] 登录失败:', err);
      localStorage.removeItem('auth_token');
      navigate('/login', { replace: true });
    }
    setStatus('done');
  };

  if (status === 'processing' && searchParams.get('token')) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>登录中...</p>
        </div>
      </div>
    );
  }

  return null;
}

function AppRoutes() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth().then(() => setIsChecking(false));
  }, []);

  if (isLoading || isChecking) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" /> : <LoginPage />
        }
      />
      <Route
        path="/callback"
        element={<OAuthCallbackPage />}
      />
      <Route
        path="/"
        element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" />
        }
      >
        <Route index element={<ChatPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <TokenHandler />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
