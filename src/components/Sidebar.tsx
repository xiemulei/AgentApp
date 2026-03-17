import { useChatStore } from '../stores/chatStore';
import { conversationService } from '../services/conversationService';
import { ChatSessionList } from './ChatSessionList';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const agents = useChatStore((state) => state.agents);
  const selectedAgentId = useChatStore((state) => state.selectedAgentId);
  const setCurrentSession = useChatStore((state) => state.setCurrentSession);
  const addConversation = useChatStore((state) => state.addConversation);
  const convertBackendConversation = useChatStore((state) => state.convertBackendConversation);

  const handleNewChat = async () => {
    if (!selectedAgentId) return;
    
    const agent = agents.find((a) => a.agentId === selectedAgentId);
    if (!agent) return;

    try {
      const conversation = await conversationService.createConversation({
        agentId: agent.agentId,
        title: `新会话 - ${new Date().toLocaleDateString('zh-CN')}`,
      });
      if (conversation) {
        addConversation(conversation);
        const session = convertBackendConversation(
          { ...conversation, agentId: conversation.agentId || agent.agentId, agentName: agent.agentName },
          []
        );
        setCurrentSession(session);
      }
    } catch (error) {
      console.error('创建会话失败:', error);
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

        <ChatSessionList />
      </div>
    </aside>
  );
}
