import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { knowledgeService, type KnowledgeDocument } from '../services/knowledgeService';
import './KnowledgePage.css';

export function KnowledgePage() {
  const agents = useChatStore((state) => state.agents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化选中第一个 Agent
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].agentId);
    }
  }, [agents]);

  // 加载知识库文档
  useEffect(() => {
    if (selectedAgentId) {
      loadDocuments();
    }
  }, [selectedAgentId]);

  const loadDocuments = async () => {
    if (!selectedAgentId) return;
    setIsLoading(true);
    try {
      const docs = await knowledgeService.listKnowledgeDocuments(selectedAgentId);
      setDocuments(docs);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedAgentId) return;

    const file = files[0];
    setIsUploading(true);

    try {
      const result = await knowledgeService.uploadKnowledge(file, selectedAgentId);
      if (result) {
        // 刷新文档列表
        await loadDocuments();
        alert('上传成功');
      } else {
        alert('上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedAgentId) return;

    setIsSearching(true);
    try {
      const results = await knowledgeService.searchKnowledge(selectedAgentId, searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className="knowledge-page">
      <div className="knowledge-header">
        <h2>知识库管理</h2>
        <div className="agent-select">
          <label>选择 Agent：</label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
          >
            {agents.map((agent) => (
              <option key={agent.agentId} value={agent.agentId}>
                {agent.agentName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="knowledge-content">
        {/* 上传区域 */}
        <div className="upload-section">
          <h3>上传文档</h3>
          <p className="upload-tip">支持 PDF、Word、Excel、PPT、文本等格式，文件将添加到选中 Agent 的知识库</p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
            disabled={isUploading || !selectedAgentId}
            style={{ display: 'none' }}
          />
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !selectedAgentId}
          >
            {isUploading ? '上传中...' : '选择文件上传'}
          </button>
        </div>

        {/* 检索区域 */}
        <div className="search-section">
          <h3>知识检索</h3>
          <div className="search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入查询内容..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? '检索中...' : '检索'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>检索结果：</h4>
              {searchResults.map((result, index) => (
                <div key={index} className="search-result-item">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 文档列表 */}
        <div className="documents-section">
          <h3>知识库文档 ({documents.length})</h3>
          {isLoading ? (
            <div className="loading">加载中...</div>
          ) : documents.length === 0 ? (
            <div className="empty">暂无文档</div>
          ) : (
            <table className="documents-table">
              <thead>
                <tr>
                  <th>文件名</th>
                  <th>类型</th>
                  <th>大小</th>
                  <th>上传时间</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="file-name">{doc.fileName}</td>
                    <td>{doc.fileType}</td>
                    <td>{formatFileSize(doc.fileSize)}</td>
                    <td>{formatDate(doc.createTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}