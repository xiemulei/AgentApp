import { useState, useEffect } from 'react';
import { knowledgeGraphService, type GraphNode, type GraphStats, type NodeDetail } from '../services/knowledgeGraphService';
import './KnowledgeGraphPage.css';

type TabType = 'search' | 'relation' | 'stats';

export function KnowledgeGraphPage() {
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 搜索相关
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<GraphNode[]>([]);

  // 节点详情
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [nodeDetailLoading, setNodeDetailLoading] = useState(false);

  // 关系查询
  const [relationType, setRelationType] = useState('');
  const [targetName, setTargetName] = useState('');
  const [relationResults, setRelationResults] = useState<GraphNode[]>([]);

  // 加载统计
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const result = await knowledgeGraphService.getStats();
      setStats(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setIsLoading(true);
    try {
      const results = await knowledgeGraphService.searchNodes(searchName);
      setSearchResults(results);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = async (nodeId: string) => {
    setNodeDetailLoading(true);
    try {
      const detail = await knowledgeGraphService.getNodeDetail(nodeId, 2);
      setSelectedNode(detail);
    } finally {
      setNodeDetailLoading(false);
    }
  };

  const handleRelationQuery = async () => {
    if (!relationType.trim() || !targetName.trim()) return;
    setIsLoading(true);
    try {
      const results = await knowledgeGraphService.queryByRelation(relationType, targetName);
      setRelationResults(results);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('确定要删除此节点吗？此操作不可恢复。')) return;
    
    const success = await knowledgeGraphService.deleteNode(nodeId);
    if (success) {
      alert('删除成功');
      setSelectedNode(null);
      loadStats();
      // 刷新搜索结果
      if (searchName.trim()) {
        handleSearch();
      }
    } else {
      alert('删除失败');
    }
  };

  const closeNodeDetail = () => {
    setSelectedNode(null);
  };

  return (
    <div className="kg-page">
      <div className="kg-header">
        <h2>知识图谱管理</h2>
      </div>

      {/* 标签页 */}
      <div className="kg-tabs">
        <button
          className={`kg-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          统计概览
        </button>
        <button
          className={`kg-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          节点搜索
        </button>
        <button
          className={`kg-tab ${activeTab === 'relation' ? 'active' : ''}`}
          onClick={() => setActiveTab('relation')}
        >
          关系查询
        </button>
      </div>

      <div className="kg-content">
        {/* 统计概览 */}
        {activeTab === 'stats' && (
          <div className="kg-section">
            {isLoading ? (
              <div className="kg-loading">加载中...</div>
            ) : stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.nodeCount || 0}</div>
                  <div className="stat-label">节点总数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.relationCount || 0}</div>
                  <div className="stat-label">关系总数</div>
                </div>
                {stats.nodeTypes && Object.keys(stats.nodeTypes).length > 0 && (
                  <div className="stat-card wide">
                    <div className="stat-title">节点类型分布</div>
                    <div className="type-list">
                      {Object.entries(stats.nodeTypes).map(([type, count]) => (
                        <div key={type} className="type-item">
                          <span className="type-name">{type}</span>
                          <span className="type-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {stats.relationTypes && Object.keys(stats.relationTypes).length > 0 && (
                  <div className="stat-card wide">
                    <div className="stat-title">关系类型分布</div>
                    <div className="type-list">
                      {Object.entries(stats.relationTypes).map(([type, count]) => (
                        <div key={type} className="type-item">
                          <span className="type-name">{type}</span>
                          <span className="type-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="kg-empty">暂无数据</div>
            )}
          </div>
        )}

        {/* 节点搜索 */}
        {activeTab === 'search' && (
          <div className="kg-section">
            <div className="search-box">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="输入节点名称搜索..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} disabled={isLoading || !searchName.trim()}>
                搜索
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="results-section">
                <h4>搜索结果 ({searchResults.length})</h4>
                <div className="node-list">
                  {searchResults.map((node) => (
                    <div
                      key={node.id}
                      className="node-item"
                      onClick={() => handleNodeClick(node.id)}
                    >
                      <div className="node-name">{node.name}</div>
                      <div className="node-type">{node.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 关系查询 */}
        {activeTab === 'relation' && (
          <div className="kg-section">
            <div className="relation-form">
              <div className="form-row">
                <label>关系类型</label>
                <input
                  type="text"
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value)}
                  placeholder="如：KNOWS, WORKS_FOR"
                />
              </div>
              <div className="form-row">
                <label>目标实体</label>
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="目标实体名称"
                />
              </div>
              <button
                className="query-btn"
                onClick={handleRelationQuery}
                disabled={isLoading || !relationType.trim() || !targetName.trim()}
              >
                查询
              </button>
            </div>

            {relationResults.length > 0 && (
              <div className="results-section">
                <h4>查询结果 ({relationResults.length})</h4>
                <div className="node-list">
                  {relationResults.map((node) => (
                    <div
                      key={node.id}
                      className="node-item"
                      onClick={() => handleNodeClick(node.id)}
                    >
                      <div className="node-name">{node.name}</div>
                      <div className="node-type">{node.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 节点详情弹窗 */}
      {selectedNode && (
        <div className="node-detail-modal" onClick={closeNodeDetail}>
          <div className="node-detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedNode.node?.name}</h3>
              <button className="close-btn" onClick={closeNodeDetail}>×</button>
            </div>
            
            {nodeDetailLoading ? (
              <div className="kg-loading">加载中...</div>
            ) : (
              <>
                <div className="detail-section">
                  <h4>基本信息</h4>
                  <div className="detail-row">
                    <span className="label">ID:</span>
                    <span className="value">{selectedNode.node?.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">类型:</span>
                    <span className="value">{selectedNode.node?.type}</span>
                  </div>
                  {selectedNode.node?.properties && Object.keys(selectedNode.node.properties).length > 0 && (
                    <div className="detail-row">
                      <span className="label">属性:</span>
                      <div className="properties">
                        {Object.entries(selectedNode.node.properties).map(([key, value]) => (
                          <div key={key} className="prop-item">
                            <span className="prop-key">{key}:</span>
                            <span className="prop-value">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedNode.relations && selectedNode.relations.length > 0 && (
                  <div className="detail-section">
                    <h4>关联关系 ({selectedNode.relations.length})</h4>
                    <div className="relations-list">
                      {selectedNode.relations.map((rel, index) => (
                        <div key={index} className="relation-item">
                          <span className="rel-type">{rel.type}</span>
                          <span className="rel-target">{rel.targetName || rel.targetId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-actions">
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteNode(selectedNode.node?.id || '')}
                  >
                    删除节点
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}