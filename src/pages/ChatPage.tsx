import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { chatService } from '../services/chatService';
import { conversationService } from '../services/conversationService';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import type { ChatMessage } from '../types/api';
import './ChatPage.css';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  path?: string;
}

export function ChatPage() {
  const [isLoading, setIsLoading] = useState(false);
  const currentSession = useChatStore((state) => state.currentSession);
  const selectedAgentId = useChatStore((state) => state.selectedAgentId);
  const agents = useChatStore((state) => state.agents);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateLastMessage = useChatStore((state) => state.updateLastMessage);
  const setCurrentSession = useChatStore((state) => state.setCurrentSession);
  const convertBackendConversation = useChatStore((state) => state.convertBackendConversation);
  const addConversation = useChatStore((state) => state.addConversation);
  const switchCurrentSessionAgent = useChatStore((state) => state.switchCurrentSessionAgent);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 防止重复初始化的锁
  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // 初始化：加载会话列表或创建新会话（带防抖）
  useEffect(() => {
    if (!selectedAgentId || hasInitializedRef.current || isInitializingRef.current) {
      return;
    }

    initSessionForAgent(selectedAgentId);
  }, [selectedAgentId]);

  const initSessionForAgent = async (agentId: string) => {
    // 防止并发调用
    if (isInitializingRef.current || hasInitializedRef.current) {
      return;
    }
    isInitializingRef.current = true;

    try {
      // 获取所有会话列表（不按agentId过滤）
      const list = await conversationService.getConversationList();

      if (list && list.length > 0) {
        // 有历史会话，加载最后一个
        const lastConversation = list[0];
        console.log('[initSessionForAgent] lastConversation:', lastConversation);
        const detail = await conversationService.getConversationDetail(lastConversation.id);
        console.log('[initSessionForAgent] detail:', detail);
        if (detail) {
          const session = convertBackendConversation(detail.conversation, detail.messages);
          console.log('[initSessionForAgent] session:', session);
          setCurrentSession(session);
        }
      } else {
        // 没有历史会话，创建一个新的
        await createBackendSession(agentId);
      }

      hasInitializedRef.current = true;
    } finally {
      isInitializingRef.current = false;
    }
  };

  const createBackendSession = async (agentId: string) => {
    try {
      const conversation = await conversationService.createConversation({
        agentId,
        title: `新会话 - ${new Date().toLocaleDateString('zh-CN')}`,
      });
      if (conversation) {
        addConversation(conversation);
        // 确保agentId被正确设置
        const session = convertBackendConversation(
          { ...conversation, agentId: conversation.agentId || agentId },
          []
        );
        setCurrentSession(session);
      }
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  };

  const handleSendMessage = async (content: string, files: UploadedFile[]) => {
    if (!currentSession || (!content.trim() && files.length === 0) || isLoading) return;

    // 构建消息内容
    let messageContent = content.trim();

    // 获取文件ID（取第一个文件的ID）
    const fileId = files.length > 0 ? files[0].id : undefined;

    // 如果有文件，添加文件信息到消息中
    if (files.length > 0) {
      const fileInfos = files.map(f => `[文件：${f.name}]`).join(' ');
      messageContent = messageContent ? `${fileInfos}\n\n${messageContent}` : fileInfos;
    }

    // 解析 sessionId 获取 conversationId
    const conversationId = parseInt(currentSession.sessionId);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageContent,
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

    console.log('[handleSendMessage] currentSession:', {
      sessionId: currentSession.sessionId,
      agentId: currentSession.agentId,
      agentName: currentSession.agentName,
      fileId,
    });

    try {
      // 使用流式对话，传入 conversationId 和 fileId
      chatService.streamChat(
        currentSession.agentId,
        messageContent,
        conversationId,
        fileId,
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
        <div className="chat-header-left">
          <h3>{currentSession.agentName}</h3>
        </div>
        <div className="chat-header-right">
          <div className="agent-switch">
            <label>切换 Agent</label>
            <select
              value={currentSession.agentId}
              onChange={(e) => {
                const selectedAgent = agents.find(a => a.agentId === e.target.value);
                if (selectedAgent) {
                  switchCurrentSessionAgent(selectedAgent.agentId, selectedAgent.agentName);
                }
              }}
              disabled={isLoading}
            >
              {agents.map((agent) => (
                <option key={agent.agentId} value={agent.agentId}>
                  {agent.agentName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <MessageList messages={currentSession.messages} />
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
      />
      <div ref={messagesEndRef} />
    </div>
  );
}
