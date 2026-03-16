# AI Agent Frontend 应用

基于 Tauri + React + TypeScript 开发的 AI Agent 桌面应用前端。

## 技术栈

- **Tauri 2.0** - 桌面应用框架
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Zustand** - 状态管理
- **React Router** - 路由管理
- **Axios** - HTTP 客户端

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── ChatInput.tsx    # 聊天输入框
│   ├── ChatSessionList.tsx  # 会话列表
│   ├── FileList.tsx     # 文件列表
│   ├── Header.tsx       # 顶部导航栏
│   ├── Layout.tsx       # 布局组件
│   ├── MessageList.tsx  # 消息列表
│   └── Sidebar.tsx      # 侧边栏
├── pages/               # 页面组件
│   ├── ChatPage.tsx     # 聊天页面
│   └── LoginPage.tsx    # 登录页面
├── services/            # API 服务层
│   ├── api.ts           # Axios 实例配置
│   ├── agentService.ts  # Agent 相关 API
│   ├── authService.ts   # 认证相关 API
│   └── chatService.ts   # 聊天相关 API (含 SSE)
├── stores/              # Zustand 状态管理
│   ├── authStore.ts     # 认证状态
│   └── chatStore.ts     # 聊天状态
├── types/               # TypeScript 类型定义
│   └── api.ts           # API 类型
├── styles/              # 全局样式
│   └── variables.css    # CSS 变量和主题
└── assets/              # 静态资源
```

## 功能特性

### 已实现
- [x] GitHub OAuth 登录
- [x] 用户认证状态管理
- [x] Agent 列表查询
- [x] 新建会话
- [x] 历史会话列表
- [x] 流式对话 (SSE)
- [x] 消息列表展示
- [x] 文件上传 UI (待后端支持)
- [x] 暗色/亮色主题自动切换
- [x] 响应式布局

### 待实现
- [ ] 文件上传功能 (等待后端 API)
- [ ] 聊天记录持久化
- [ ] 会话管理 (删除、重命名)
- [ ] 设置页面

## API 接口

后端 API 文档：http://localhost:8091/v3/api-docs/all

### 主要接口

| 接口 | 方法 | 描述 |
|------|------|------|
| /api/auth/github/url | GET | 获取 GitHub 登录 URL |
| /api/auth/github/callback | GET | GitHub OAuth 回调 |
| /api/auth/me | GET | 获取当前用户信息 |
| /api/auth/logout | GET | 退出登录 |
| /api/agent/list | GET | 获取 Agent 列表 |
| /api/agent/chat/stream | POST | 流式对话 (SSE) |
| /api/agent/history | GET | 获取聊天历史 |
| /api/agent/session | DELETE | 清除会话 |

## 开发

### 环境要求

- Node.js 18+
- Yarn
- Rust (Tauri 依赖)

### 安装依赖

```bash
yarn install
```

### 开发模式

```bash
yarn tauri dev
```

### 构建应用

```bash
yarn tauri build
```

## 认证流程

1. 用户点击"使用 GitHub 登录"
2. 调用 `/api/auth/github/url` 获取登录 URL
3. 在浏览器中打开 URL 进行 GitHub OAuth 授权
4. 授权成功后回调到 `/api/auth/github/callback`
5. 后端返回 JWT Token
6. 前端存储 Token 并在后续请求中携带

## SSE 流式对话

使用 Server-Sent Events (SSE) 接收流式响应：

```typescript
chatService.streamChat(
  agentId,
  message,
  (content, completed) => {
    // 实时更新消息内容
  },
  () => {
    // 完成回调
  },
  (error) => {
    // 错误处理
  }
);
```

## 主题

应用支持暗色和亮色主题，根据系统设置自动切换：

- 暗色主题（默认）：深色背景，适合夜间使用
- 亮色主题：浅色背景，适合日间使用

CSS 变量定义在 `src/styles/variables.css` 中。

## 许可证

Apache 2.0
