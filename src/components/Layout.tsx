import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { agentService } from '../services/agentService';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import './Layout.css';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = useAuthStore((state) => state.user);
  const setAgents = useChatStore((state) => state.setAgents);
  const navigate = useNavigate();

  useEffect(() => {
    // 加载 Agent 列表
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const agents = await agentService.getAgentList();
    setAgents(agents);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onLogout={handleLogout}
        />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
