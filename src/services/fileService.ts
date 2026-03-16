import apiClient from './api';
import type { ApiResponse, DocumentContentDTO } from '../types/api';

export interface UploadResult {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  path?: string;
}

export interface FileInfo {
  path: string;
  name: string;
  size?: number;
  type?: string;
}

export const fileService = {
  /**
   * 上传文件
   * @param file 文件对象
   * @returns 上传结果
   */
  async uploadFile(file: File): Promise<UploadResult | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<ApiResponse<Record<string, string>>>(
        '/api/files/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.code === '0000' || response.data.code === '200') {
        const data = response.data.data;
        return {
          fileId: data['fileId'] || data['id'] || '',
          fileName: data['fileName'] || data['name'] || file.name,
          fileType: data['fileType'] || data['type'] || file.type,
          fileSize: data['fileSize'] ? parseInt(data['fileSize']) : file.size,
          fileUrl: data['fileUrl'] || data['url'] || '',
          path: data['path'],
        };
      }
      return null;
    } catch (error) {
      console.error('上传文件失败:', error);
      return null;
    }
  },

  /**
   * 上传文档并提取内容（PDF/Word/Excel/PPT/文本）
   * @param file 文件对象
   * @param userId 用户 ID
   * @param agentId Agent ID
   * @param threadId 会话 ID
   * @returns 文档内容
   */
  async uploadDocument(
    file: File,
    userId?: string,
    agentId?: string,
    threadId?: string
  ): Promise<DocumentContentDTO | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (agentId) params.append('agentId', agentId);
      if (threadId) params.append('threadId', threadId);

      const response = await apiClient.post<ApiResponse<DocumentContentDTO>>(
        `/api/files/documents/upload?${params.toString()}`,
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
      console.error('上传文档失败:', error);
      return null;
    }
  },

  /**
   * 获取文件 URL
   * @param path 文件路径
   * @returns 文件 URL
   */
  async getFileUrl(path: string): Promise<string | null> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, string>>>(
        '/api/files/url',
        {
          params: { path },
        }
      );

      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data['url'] || response.data.data['fileUrl'] || null;
      }
      return null;
    } catch (error) {
      console.error('获取文件 URL 失败:', error);
      return null;
    }
  },

  /**
   * 获取文件预签名 URL
   * @param path 文件路径
   * @param expiration 过期时间（分钟）
   * @returns 预签名 URL
   */
  async getPresignedUrl(path: string, expiration?: number): Promise<string | null> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, string>>>(
        '/api/files/presigned-url',
        {
          params: { path, expiration },
        }
      );

      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data['url'] || response.data.data['presignedUrl'] || null;
      }
      return null;
    } catch (error) {
      console.error('获取预签名 URL 失败:', error);
      return null;
    }
  },

  /**
   * 列出文件
   * @param prefix 路径前缀
   * @returns 文件列表
   */
  async listFiles(prefix?: string): Promise<FileInfo[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        '/api/files/list',
        {
          params: { prefix: prefix || '' },
        }
      );

      if (response.data.code === '0000' || response.data.code === '200') {
        const paths = response.data.data || [];
        return paths.map(path => ({
          path,
          name: path.split('/').pop() || path,
        }));
      }
      return [];
    } catch (error) {
      console.error('列出文件失败:', error);
      return [];
    }
  },

  /**
   * 检查文件是否存在
   * @param path 文件路径
   * @returns 是否存在
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, any>>>(
        '/api/files/exists',
        {
          params: { path },
        }
      );

      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data?.exists ?? false;
      }
      return false;
    } catch (error) {
      console.error('检查文件是否存在失败:', error);
      return false;
    }
  },

  /**
   * 下载文件
   * @param path 文件路径
   * @returns 文件 Blob
   */
  async downloadFile(path: string): Promise<Blob | null> {
    try {
      const response = await apiClient.get('/api/files/download', {
        params: { path },
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      console.error('下载文件失败:', error);
      return null;
    }
  },

  /**
   * 删除文件
   * @param path 文件路径
   * @returns 是否删除成功
   */
  async deleteFile(path: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        '/api/files/delete',
        {
          params: { path },
        }
      );

      return response.data.code === '0000' || response.data.code === '200';
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  },
};
