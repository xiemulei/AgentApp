import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { conversationService } from '../services/conversationService';
import type { ConversationDTO } from '../types/api';
import './ChatSessionList.css';

export function ChatSessionList() {
  const conversations = useChatStore((state) => state.conversations);
  const currentSession = useChatStore((state) => state.currentSession);
  const setCurrentSession = useChatStore((state) => state.setCurrentSession);
  const setConversations = useChatStore((state) => state.setConversations);
  const convertBackendConversation = useChatStore((state) => state.convertBackendConversation);
  const removeConversation = useChatStore((state) => state.removeConversation);
  const isLoadingConversations = useChatStore((state) => state.isLoadingConversations);

  // 加载所有会话列表
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    useChatStore.setState({ isLoadingConversations: true });
    try {
      const list = await conversationService.getConversationList();
      setConversations(list);
    } catch (error) {
      console.error('加载会话列表失败:', error);
    } finally {
      useChatStore.setState({ isLoadingConversations: false });
    }
  };

  const handleSelectSession = async (conversation: ConversationDTO) => {
    try {
      const detail = await conversationService.getConversationDetail(conversation.id);
      if (detail) {
        const session = convertBackendConversation(detail.conversation, detail.messages);
        setCurrentSession(session);
      }
    } catch (error) {
      console.error('加载会话详情失败:', error);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个会话吗？')) return;

    try {
      const success = await conversationService.deleteConversation(conversationId);
      if (success) {
        removeConversation(conversationId);
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  // 按时间排序
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.lastMsgTime).getTime() - new Date(a.lastMsgTime).getTime()
  );

  if (conversations.length === 0 && !isLoadingConversations) {
    return (
      <div className="session-list-empty">
        <p>暂无历史会话</p>
      </div>
    );
  }

  if (isLoadingConversations) {
    return (
      <div className="session-list-loading">
        <div className="loading-spinner"></div>
        <p>加载会话中...</p>
      </div>
    );
  }

  return (
    <div className="session-list">
      <label>历史会话</label>
      <div className="session-items">
        {sortedConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`session-item ${
              currentSession?.sessionId === `${conversation.id}` ? 'active' : ''
            }`}
            onClick={() => handleSelectSession(conversation)}
          >
            <div className="session-item-content">
              <span className="session-title">{conversation.title || '新会话'}</span>
              <span className="session-preview">
                {conversation.msgCount > 0 ? `${conversation.msgCount} 条消息` : '新对话'}
              </span>
            </div>
            <div className="session-actions">
              <span className="session-time">
                {formatTime(new Date(conversation.lastMsgTime).getTime())}
              </span>
              <button
                className="session-delete-btn"
                onClick={(e) => handleDeleteSession(e, conversation.id)}
                title="删除会话"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  }
}