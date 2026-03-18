import apiClient from './api';
import type { ApiResponse } from '../types/api';

// 图谱节点
export interface GraphNode {
  id: string;
  type: string;
  name: string;
  properties?: Record<string, unknown>;
}

// 图谱统计
export interface GraphStats {
  nodeCount: number;
  relationCount: number;
  nodeTypes?: Record<string, number>;
  relationTypes?: Record<string, number>;
}

// 节点详情（包含关联节点）
export interface NodeDetail {
  node: GraphNode;
  relations?: GraphRelation[];
}

// 关系
export interface GraphRelation {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  sourceName?: string;
  targetName?: string;
  properties?: Record<string, unknown>;
}

export const knowledgeGraphService = {
  /**
   * 获取图谱统计
   */
  async getStats(): Promise<GraphStats | null> {
    try {
      const response = await apiClient.get<ApiResponse<GraphStats>>('/api/knowledge-graph/stats');
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[knowledgeGraphService] 获取统计失败:', error);
      return null;
    }
  },

  /**
   * 搜索节点
   * @param name 节点名称
   */
  async searchNodes(name: string): Promise<GraphNode[]> {
    try {
      const response = await apiClient.get<ApiResponse<GraphNode[]>>(
        '/api/knowledge-graph/nodes/search',
        { params: { name } }
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('[knowledgeGraphService] 搜索节点失败:', error);
      return [];
    }
  },

  /**
   * 获取节点详情
   * @param nodeId 节点ID
   * @param depth 搜索深度
   */
  async getNodeDetail(nodeId: string, depth: number = 2): Promise<NodeDetail | null> {
    try {
      const response = await apiClient.get<ApiResponse<NodeDetail>>(
        `/api/knowledge-graph/nodes/${encodeURIComponent(nodeId)}`,
        { params: { depth } }
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[knowledgeGraphService] 获取节点详情失败:', error);
      return null;
    }
  },

  /**
   * 按类型获取节点
   * @param type 节点类型
   */
  async getNodesByType(type: string): Promise<GraphNode[]> {
    try {
      const response = await apiClient.get<ApiResponse<GraphNode[]>>(
        `/api/knowledge-graph/nodes/type/${encodeURIComponent(type)}`
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('[knowledgeGraphService] 按类型获取节点失败:', error);
      return [];
    }
  },

  /**
   * 按关系查询
   * @param relationType 关系类型
   * @param targetName 目标实体名称
   */
  async queryByRelation(relationType: string, targetName: string): Promise<GraphNode[]> {
    try {
      const response = await apiClient.get<ApiResponse<GraphNode[]>>(
        '/api/knowledge-graph/query/relation',
        { params: { relationType, targetName } }
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('[knowledgeGraphService] 按关系查询失败:', error);
      return [];
    }
  },

  /**
   * 查询两个节点之间的关系
   * @param nodeId1 节点1 ID
   * @param nodeId2 节点2 ID
   */
  async queryRelationsBetween(nodeId1: string, nodeId2: string): Promise<GraphRelation[]> {
    try {
      const response = await apiClient.get<ApiResponse<GraphRelation[]>>(
        '/api/knowledge-graph/query/relations-between',
        { params: { nodeId1, nodeId2 } }
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('[knowledgeGraphService] 查询节点关系失败:', error);
      return [];
    }
  },

  /**
   * 删除节点
   * @param nodeId 节点ID
   */
  async deleteNode(nodeId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        `/api/knowledge-graph/nodes/${encodeURIComponent(nodeId)}`
      );
      return response.data.code === '0000' || response.data.code === '200';
    } catch (error) {
      console.error('[knowledgeGraphService] 删除节点失败:', error);
      return false;
    }
  },
};