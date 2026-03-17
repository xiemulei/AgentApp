import apiClient from './api';
import type {
  ApiResponse,
  ConversationDTO,
  ConversationDetailDTO,
  CreateConversationRequest,
  UpdateConversationTitleRequest,
} from '../types/api';

export const conversationService = {
  /**
   * 创建新会话
   */
  async createConversation(
    request: CreateConversationRequest
  ): Promise<ConversationDTO | null> {
    try {
      const response = await apiClient.post<ApiResponse<ConversationDTO>>(
        '/api/conversations',
        request
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('创建会话失败:', error);
      return null;
    }
  },

  /**
   * 获取会话列表
   * @param agentId 可选，不传则查询所有会话
   */
  async getConversationList(agentId?: string): Promise<ConversationDTO[]> {
    try {
      const params: { agentId?: string } = {};
      if (agentId) {
        params.agentId = agentId;
      }
      const response = await apiClient.get<ApiResponse<ConversationDTO[]>>(
        '/api/conversations/list',
        {
          params,
        }
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('获取会话列表失败:', error);
      return [];
    }
  },

  /**
   * 获取会话详情（包含消息列表）
   */
  async getConversationDetail(
    conversationId: number
  ): Promise<ConversationDetailDTO | null> {
    try {
      const response = await apiClient.get<ApiResponse<ConversationDetailDTO>>(
        `/api/conversations/${conversationId}`
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('获取会话详情失败:', error);
      return null;
    }
  },

  /**
   * 更新会话标题
   */
  async updateConversationTitle(
    conversationId: number,
    title: string
  ): Promise<boolean> {
    try {
      const response = await apiClient.put<ApiResponse<void>>(
        `/api/conversations/${conversationId}/title`,
        {
          conversationId,
          title,
        } as UpdateConversationTitleRequest
      );
      return response.data.code === '0000' || response.data.code === '200';
    } catch (error) {
      console.error('更新会话标题失败:', error);
      return false;
    }
  },

  /**
   * 重新生成会话标题（使用 LLM）
   */
  async regenerateConversationTitle(conversationId: number): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        `/api/conversations/${conversationId}/title/regenerate`
      );
      return response.data.code === '0000' || response.data.code === '200';
    } catch (error) {
      console.error('重新生成会话标题失败:', error);
      return false;
    }
  },

  /**
   * 删除会话（软删除）
   */
  async deleteConversation(conversationId: number): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        `/api/conversations/${conversationId}`
      );
      return response.data.code === '0000' || response.data.code === '200';
    } catch (error) {
      console.error('删除会话失败:', error);
      return false;
    }
  },

  /**
   * 恢复已删除的会话
   */
  async restoreConversation(conversationId: number): Promise<boolean> {
    try {
      const response = await apiClient.put<ApiResponse<void>>(
        `/api/conversations/${conversationId}/restore`
      );
      return response.data.code === '0000' || response.data.code === '200';
    } catch (error) {
      console.error('恢复会话失败:', error);
      return false;
    }
  },
};
