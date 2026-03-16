import type { ChatMessage } from '../types/api';
import './MessageList.css';

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3>开始对话</h3>
          <p>发送消息开始与 AI Agent 交流</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
        >
          <div className="message-avatar">
            {message.role === 'user' ? (
              <div className="user-avatar-placeholder">U</div>
            ) : (
              <div className="assistant-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1v-1a7 7 0 017-7h1V5.73c-.6-.34-1-1-.1-1.73a2 2 0 012-2zM7.5 13A2.5 2.5 0 005 15.5 2.5 2.5 0 007.5 18 2.5 2.5 0 0010 15.5 2.5 2.5 0 007.5 13zm9 0a2.5 2.5 0 00-2.5 2.5 2.5 2.5 0 002.5 2.5 2.5 2.5 0 002.5-2.5 2.5 2.5 0 00-2.5-2.5z"/>
                </svg>
              </div>
            )}
          </div>
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">
                {message.role === 'user' ? '你' : message.agentName || 'AI Agent'}
              </span>
              <span className="message-time">
                {formatMessageTime(message.timestamp)}
              </span>
            </div>
            <div className="message-text">{message.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? '下午' : '上午';
  const displayHours = hours % 12 || 12;
  return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
}
