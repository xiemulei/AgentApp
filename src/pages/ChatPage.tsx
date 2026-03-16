import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { chatService } from '../services/chatService';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { FileList } from '../components/FileList';
import type { ChatMessage, UploadFile } from '../types/api';
import './ChatPage.css';

export function ChatPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const currentSession = useChatStore((state) => state.currentSession);
  const selectedAgentId = useChatStore((state) => state.selectedAgentId);
  const agents = useChatStore((state) => state.agents);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateLastMessage = useChatStore((state) => state.updateLastMessage);
  const createSession = useChatStore((state) => state.createSession);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // 如果没有当前会话，创建一个新会话
  useEffect(() => {
    if (!currentSession && selectedAgentId) {
      const agent = agents.find((a) => a.agentId === selectedAgentId);
      if (agent) {
        createSession(agent.agentId, agent.agentName);
      }
    }
  }, [currentSession, selectedAgentId, agents, createSession]);

  const handleSendMessage = async (content: string) => {
    if (!currentSession || !content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    // 添加用户消息
    addMessage(currentSession.sessionId, userMessage);

    // 添加一个空的助手消息用于流式更新
    const assistantMessageId = `msg-${Date.now()}-assistant`;
    addMessage(currentSession.sessionId, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      agentId: currentSession.agentId,
      agentName: currentSession.agentName,
    });

    setIsLoading(true);

    try {
      // 使用流式对话
      chatService.streamChat(
        currentSession.agentId,
        content.trim(),
        (accumulatedContent) => {
          // 更新最后一条助手消息
          updateLastMessage(currentSession.sessionId, accumulatedContent);
        },
        () => {
          setIsLoading(false);
        },
        (error) => {
          console.error('流式对话错误:', error);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      setIsLoading(false);
    }
  };

  const handleFileUpload = (uploadedFiles: UploadFile[]) => {
    setFiles((prev) => [...prev, ...uploadedFiles]);
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  if (!currentSession) {
    return (
      <div className="chat-page loading">
        <div className="empty-state">
          <p>正在加载会话...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h3>{currentSession.agentName}</h3>
      </div>
      <MessageList messages={currentSession.messages} />
      {files.length > 0 && (
        <FileList files={files} onRemove={handleRemoveFile} />
      )}
      <ChatInput
        onSend={handleSendMessage}
        onFileUpload={handleFileUpload}
        disabled={isLoading}
      />
      <div ref={messagesEndRef} />
    </div>
  );
}
