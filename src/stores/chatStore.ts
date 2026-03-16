import { create } from 'zustand';
import type { AgentInfo, ChatSession, ChatMessage } from '../types/api';

interface ChatState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  agents: AgentInfo[];
  selectedAgentId: string | null;
  isLoadingAgents: boolean;

  // Actions
  setAgents: (agents: AgentInfo[]) => void;
  setSelectedAgentId: (agentId: string | null) => void;
  createSession: (agentId: string, agentName: string) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateLastMessage: (sessionId: string, content: string) => void;
  clearSession: (sessionId: string) => void;
  loadSession: (sessionId: string) => ChatSession | undefined;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSession: null,
  agents: [],
  selectedAgentId: null,
  isLoadingAgents: false,

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
    set({ currentSession: session });
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
}));
