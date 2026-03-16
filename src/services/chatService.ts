import apiClient from './api';
import type { ApiResponse, ChatRequest, ChatResponse, ChatMessage } from '../types/api';

export const chatService = {
  /**
   * 同步对话（非流式）
   */
  async chat(request: ChatRequest): Promise<ChatResponse | null> {
    try {
      const response = await apiClient.post<ApiResponse<ChatResponse>>(
        '/api/agent/chat',
        request
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('同步对话失败:', error);
      return null;
    }
  },

  /**
   * 流式对话 (SSE)
   * 使用 fetch + ReadableStream 实现，支持 POST 请求
   * @param agentId Agent ID
   * @param message 消息内容
   * @param onMessage 接收到消息时的回调
   * @param onComplete 完成时的回调
   * @param onError 错误时的回调
   * @returns 返回取消控制的函数
   */
  streamChat(
    agentId: string,
    message: string,
    onMessage: (content: string, completed: boolean) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): () => void {
    const token = localStorage.getItem('auth_token');
    const url = `http://localhost:8091/api/agent/chat/stream`;

    const controller = new AbortController();
    let isCancelled = false;

    const fetchSSE = async () => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            agentId,
            userId: Date.now().toString(),
            message,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ReadableStream not supported');
        }

        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let pendingData = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          console.log('[SSE 原始数据] chunk:', chunk);

          // 如果有之前遗留的数据，拼接到当前 chunk
          const fullChunk = pendingData + chunk;
          pendingData = '';

          const lines = fullChunk.split('\n');
          console.log('[SSE 解析] lines:', lines);

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            console.log('[SSE 处理] line:', line);

            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              console.log('[SSE 数据] data:', data);

              if (data === '[DONE]') {
                console.log('[SSE 完成] 收到 [DONE]');
                onComplete?.();
                return;
              }

              if (data) {
                try {
                  const parsed: ChatResponse = JSON.parse(data);
                  console.log('[SSE 解析成功] parsed:', parsed);
                  if (parsed.content) {
                    accumulatedContent += parsed.content;
                  }
                  onMessage(accumulatedContent, parsed.completed ?? false);

                  if (parsed.completed) {
                    console.log('[SSE 完成] completed=true');
                    onComplete?.();
                    return;
                  }
                } catch (e) {
                  console.error('[SSE 解析失败] error:', e, 'data:', data);
                }
              }
            } else if (line.trim() && !line.startsWith(':')) {
              // 不是空行、不是注释行，但不以 data: 开头
              // 可能是后端分开发送的 data: 和 JSON，尝试直接解析
              try {
                const parsed: ChatResponse = JSON.parse(line);
                console.log('[SSE 直接解析] parsed:', parsed);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                }
                onMessage(accumulatedContent, parsed.completed ?? false);

                if (parsed.completed) {
                  console.log('[SSE 完成] completed=true');
                  onComplete?.();
                  return;
                }
              } catch (e) {
                // 不是 JSON，保留到下一个 chunk
                pendingData = line;
              }
            }
          }
        }

        onComplete?.();
      } catch (error) {
        if (isCancelled) {
          return;
        }
        console.error('流式对话错误:', error);
        onError?.(error as Error);
      }
    };

    fetchSSE();

    // 返回取消函数
    return () => {
      isCancelled = true;
      controller.abort();
    };
  },

  /**
   * 获取聊天历史
   * @param agentId Agent ID
   */
  async getChatHistory(agentId: string): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get<ApiResponse<ChatMessage[]>>(
        '/api/agent/history',
        {
          params: { agentId },
        }
      );
      if (response.data.code === '0000' || response.data.code === '200') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      return [];
    }
  },

  /**
   * 清除会话
   * @param agentId Agent ID
   */
  async clearSession(agentId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        '/api/agent/session',
        {
          params: { agentId },
        }
      );
      return response.data.code === '0000' || response.data.code === '200';
    } catch (error) {
      console.error('清除会话失败:', error);
      return false;
    }
  },
};
