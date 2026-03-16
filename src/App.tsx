import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { ChatPage } from './pages/ChatPage';
import { useAuthStore } from './stores/authStore';
import './styles/variables.css';

function App() {
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
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" /> : <LoginPage />
          }
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
    </BrowserRouter>
  );
}

export default App;
