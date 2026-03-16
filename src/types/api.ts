// API 响应基础类型
export interface ApiResponse<T = unknown> {
  code: string;
  info: string;
  data: T;
}

// 用户信息
export interface UserInfo {
  userId: number;
  username: string;
  avatarUrl: string;
  email: string;
  token: string;
}

// Agent 信息
export interface AgentInfo {
  agentId: string;
  agentName: string;
  description?: string;
  avatar?: string;
}

// 聊天请求
export interface ChatRequest {
  agentId: string;
  userId: string;
  message: string;
}

// 聊天响应
export interface ChatResponse {
  agentId: string;
  agentName: string;
  content: string;
  completed: boolean;
}

// 会话历史消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agentId?: string;
  agentName?: string;
}

// 会话信息
export interface ChatSession {
  sessionId: string;
  agentId: string;
  agentName: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// 文件上传类型
export interface UploadFile {
  id: string;
  name: string;
  type: 'document' | 'image' | 'audio';
  size: number;
  url?: string;
}

// SSE 事件类型
export interface SSEEvent {
  event?: string;
  data: string;
}
