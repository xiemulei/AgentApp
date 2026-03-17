import { create } from 'zustand';
import type {
  AgentInfo,
  ChatSession,
  ChatMessage,
  ConversationDTO,
  ConversationMessageDTO,
} from '../types/api';

interface ChatState {
  sessions: ChatSession[];
  conversations: ConversationDTO[];
  currentSession: ChatSession | null;
  agents: AgentInfo[];
  selectedAgentId: string | null;
  isLoadingAgents: boolean;
  isLoadingConversations: boolean;

  // Actions
  setAgents: (agents: AgentInfo[]) => void;
  setSelectedAgentId: (agentId: string | null) => void;
  createSession: (agentId: string, agentName: string) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateLastMessage: (sessionId: string, content: string) => void;
  clearSession: (sessionId: string) => void;
  loadSession: (sessionId: string) => ChatSession | undefined;

  // 后端 API 相关 actions
  setConversations: (conversations: ConversationDTO[]) => void;
  addConversation: (conversation: ConversationDTO) => void;
  updateConversation: (conversationId: number, updates: Partial<ConversationDTO>) => void;
  removeConversation: (conversationId: number) => void;
  convertBackendMessage: (msg: ConversationMessageDTO) => ChatMessage;
  convertBackendConversation: (
    conversation: ConversationDTO,
    messages: ConversationMessageDTO[]
  ) => ChatSession;

  // 切换当前会话的 agent
  switchCurrentSessionAgent: (agentId: string, agentName: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  conversations: [],
  currentSession: null,
  agents: [],
  selectedAgentId: null,
  isLoadingAgents: false,
  isLoadingConversations: false,

  setAgents: (agents) => {
    set({ agents });
    if (agents.length > 0 && !get().selectedAgentId) {
      set({ selectedAgentId: agents[0].agentId });
    }
  },

  setSelectedAgentId: (agentId) => {
    set({ selectedAgentId: agentId });
  },

  createSession: (agentId, agentName) => {
    const newSession: ChatSession = {
      sessionId: `${agentId}-${Date.now()}`,
      agentId,
      agentName,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      sessions: [newSession, ...state.sessions],
      currentSession: newSession,
    }));
  },

  setCurrentSession: (session) => {
    set({
      currentSession: session,
      // 打开会话时，同步更新selectedAgentId为会话的agentId
      selectedAgentId: session?.agentId || null,
    });
  },

  addMessage: (sessionId, message) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionId === sessionId
          ? {
              ...s,
              messages: [...s.messages, message],
              updatedAt: Date.now(),
            }
          : s
      ),
      currentSession:
        state.currentSession?.sessionId === sessionId
          ? {
              ...state.currentSession,
              messages: [...state.currentSession.messages, message],
              updatedAt: Date.now(),
            }
          : state.currentSession,
    }));
  },

  updateLastMessage: (sessionId, content) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionId === sessionId
          ? {
              ...s,
              messages: s.messages.length > 0
                ? s.messages.map((m, i) =>
                    i === s.messages.length - 1 ? { ...m, content } : m
                  )
                : s.messages,
              updatedAt: Date.now(),
            }
          : s
      ),
      currentSession:
        state.currentSession?.sessionId === sessionId
          ? {
              ...state.currentSession,
              messages:
                state.currentSession.messages.length > 0
                  ? state.currentSession.messages.map((m, i) =>
                      i === state.currentSession!.messages.length - 1
                        ? { ...m, content }
                        : m
                    )
                  : state.currentSession.messages,
              updatedAt: Date.now(),
            }
          : state.currentSession,
    }));
  },

  clearSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.sessionId !== sessionId),
      currentSession:
        state.currentSession?.sessionId === sessionId ? null : state.currentSession,
    }));
  },

  loadSession: (sessionId) => {
    return get().sessions.find((s) => s.sessionId === sessionId);
  },

  // 后端 API 相关 actions
  setConversations: (conversations) => {
    set({ conversations });
  },

  addConversation: (conversation) => {
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));
  },

  updateConversation: (conversationId, updates) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, ...updates } : c
      ),
    }));
  },

  removeConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      currentSession:
        state.currentSession?.sessionId === `${conversationId}`
          ? null
          : state.currentSession,
    }));
  },

  convertBackendMessage: (msg: ConversationMessageDTO) => {
    return {
      id: `msg-${msg.id}`,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.createTime).getTime(),
      agentId: msg.agentId,
      agentName: msg.agentName,
    } as ChatMessage;
  },

  convertBackendConversation: (
    conversation: ConversationDTO,
    messages: ConversationMessageDTO[]
  ) => {
    // 尝试从消息中获取agentId（取最后一条assistant消息的agentId）
    let agentId = conversation.agentId || '';
    let agentName = conversation.agentName || '';
    
    if (!agentId && messages.length > 0) {
      // 从后往前找第一条assistant消息
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant' && messages[i].agentId) {
          agentId = messages[i].agentId || '';
          agentName = messages[i].agentName || '';
          break;
        }
      }
    }
    
    // 如果还是没有，尝试从agents列表中获取第一个
    if (!agentId) {
      const agents = get().agents;
      if (agents.length > 0) {
        agentId = agents[0].agentId;
        agentName = agents[0].agentName;
      }
    }

    console.log('[convertBackendConversation] conversation:', conversation);
    console.log('[convertBackendConversation] resolved agentId:', agentId, 'agentName:', agentName);

    return {
      sessionId: `${conversation.id}`,
      agentId,
      agentName,
      messages: messages.map((msg) => get().convertBackendMessage(msg)),
      createdAt: new Date(conversation.createTime).getTime(),
      updatedAt: new Date(conversation.lastMsgTime).getTime(),
    } as ChatSession;
  },

  switchCurrentSessionAgent: (agentId: string, agentName: string) => {
    set((state) => {
      if (!state.currentSession) return state;

      const updatedSession = {
        ...state.currentSession,
        agentId,
        agentName,
        updatedAt: Date.now(),
      };

      return {
        currentSession: updatedSession,
        sessions: state.sessions.map((s) =>
          s.sessionId === state.currentSession?.sessionId ? updatedSession : s
        ),
        selectedAgentId: agentId,
      };
    });
  },
}));
