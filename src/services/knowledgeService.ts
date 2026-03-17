import apiClient from './api';
import type { ApiResponse, DocumentContentDTO } from '../types/api';

export interface KnowledgeDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createTime: string;
  agentId: string;
}

export const knowledgeService = {
  /**
   * 上传知识到知识库（仅管理员）
   * @param file 文件
   * @param agentId Agent ID
   */
  async uploadKnowledge(file: File, agentId: string): Promise<DocumentContentDTO | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<ApiResponse<DocumentContentDTO>>(
        `/api/files/knowledge/upload?agentId=${encodeURIComponent(agentId)}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[knowledgeService] 上传知识失败:', error);
      throw error;
    }
  },

  /**
   * 列出知识库文档
   * @param agentId Agent ID
   */
  async listKnowledgeDocuments(agentId: string): Promise<KnowledgeDocument[]> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, unknown>[]>>(
        '/api/files/knowledge/list',
        {
          params: { agentId },
        }
      );

      if (response.data.code === '0000' || response.data.code === '200') {
        const data = response.data.data || [];
        return data.map(item => ({
          id: (item['id'] || item['fileId'] || '') as string,
          fileName: (item['fileName'] || item['name'] || '') as string,
          fileType: (item['fileType'] || item['type'] || '') as string,
          fileSize: (item['fileSize'] || 0) as number,
          createTime: (item['createTime'] || '') as string,
          agentId: (item['agentId'] || '') as string,
        }));
      }
      return [];
    } catch (error) {
      console.error('[knowledgeService] 获取知识库列表失败:', error);
      return [];
    }
  },

  /**
   * 检索知识库
   * @param agentId Agent ID
   * @param query 查询内容
   * @param topK 返回数量
   */
  async searchKnowledge(agentId: string, query: string, topK: number = 5): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        '/api/files/knowledge/search',
        {
          params: { agentId, query, topK },
        }
      );

      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('[knowledgeService] 检索知识库失败:', error);
      return [];
    }
  },
};