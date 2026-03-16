import { useChatStore } from '../stores/chatStore';
import { ChatSessionList } from './ChatSessionList';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const agents = useChatStore((state) => state.agents);
  const selectedAgentId = useChatStore((state) => state.selectedAgentId);
  const setSelectedAgentId = useChatStore((state) => state.setSelectedAgentId);
  const createSession = useChatStore((state) => state.createSession);

  const handleNewChat = () => {
    if (selectedAgentId) {
      const agent = agents.find((a) => a.agentId === selectedAgentId);
      if (agent) {
        createSession(agent.agentId, agent.agentName);
      }
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>AI Agent</h2>
      </div>

      <div className="sidebar-content">
        <button className="new-chat-btn" onClick={handleNewChat}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          新建对话
        </button>

        <div className="agent-selector">
          <label>选择 Agent</label>
          <select
            value={selectedAgentId || ''}
            onChange={(e) => setSelectedAgentId(e.target.value || null)}
          >
            {agents.map((agent) => (
              <option key={agent.agentId} value={agent.agentId}>
                {agent.agentName}
              </option>
            ))}
          </select>
        </div>

        <ChatSessionList />
      </div>
    </aside>
  );
}
