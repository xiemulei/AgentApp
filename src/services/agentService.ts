import apiClient from './api';
import type { ApiResponse, AgentInfo } from '../types/api';

export const agentService = {
  /**
   * 获取所有 Agent 列表
   */
  async getAgentList(): Promise<AgentInfo[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ agents: AgentInfo[] }>>('/api/agent/list');
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data?.agents || [];
      }
      return [];
    } catch (error) {
      console.error('获取 Agent 列表失败:', error);
      return [];
    }
  },
};
