import { useChatStore } from '../stores/chatStore';
import './ChatSessionList.css';

export function ChatSessionList() {
  const sessions = useChatStore((state) => state.sessions);
  const currentSession = useChatStore((state) => state.currentSession);
  const setCurrentSession = useChatStore((state) => state.setCurrentSession);

  // 按更新时间排序
  const sortedSessions = [...sessions].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  const handleSelectSession = (session: typeof sessions[0]) => {
    setCurrentSession(session);
  };

  if (sortedSessions.length === 0) {
    return (
      <div className="session-list-empty">
        <p>暂无历史会话</p>
      </div>
    );
  }

  return (
    <div className="session-list">
      <label>历史会话</label>
      <div className="session-items">
        {sortedSessions.map((session) => (
          <div
            key={session.sessionId}
            className={`session-item ${
              currentSession?.sessionId === session.sessionId ? 'active' : ''
            }`}
            onClick={() => handleSelectSession(session)}
          >
            <div className="session-item-content">
              <span className="session-agent-name">{session.agentName}</span>
              <span className="session-preview">
                {session.messages.length > 0
                  ? session.messages[session.messages.length - 1].content
                  : '新对话'}
              </span>
            </div>
            <span className="session-time">
              {formatTime(session.updatedAt)}
            </span>
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
