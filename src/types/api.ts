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
  role?: string; // 用户角色：admin, user
}

// 注册请求
export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
}

// 登录请求
export interface LoginRequest {
  loginType: 'password' | 'sms';
  username?: string;
  password?: string;
  phone?: string;
  verifyCode?: string;
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
  fileId?: string;
  conversationId?: number;
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

// 文档内容 DTO
export interface DocumentContentDTO {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  userId: number;
  agentId: string;
  threadId: string;
  content: string;
  summary: string;
  createTime: string;
  metadata?: DocumentMetadata;
}

// 文档元数据
export interface DocumentMetadata {
  pageCount?: number;
  slideCount?: number;
  sheetCount?: number;
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string;
}

// 后端会话 DTO
export interface ConversationDTO {
  id: number;
  title: string;
  lastMsgTime: string;
  msgCount: number;
  createTime: string;
  agentId?: string;
  agentName?: string;
}

// 创建会话请求
export interface CreateConversationRequest {
  agentId: string;
  title?: string;
  firstMessage?: string;
}

// 更新会话标题请求
export interface UpdateConversationTitleRequest {
  conversationId: number;
  title: string;
}

// 会话消息 DTO（后端返回的历史消息）
export interface ConversationMessageDTO {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createTime: string;
  agentId?: string;
  agentName?: string;
}

// 会话详情（包含消息列表）
export interface ConversationDetailDTO {
  conversation: ConversationDTO;
  messages: ConversationMessageDTO[];
}
