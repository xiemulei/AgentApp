# OAuth 登录配置指南

## 问题描述

当前后端 GitHub OAuth 回调后重定向到 `http://localhost:3000`，但 Tauri 应用运行在 `http://localhost:1420`。

## 解决方案

### 方案 A：修改后端重定向地址（推荐）

在后端配置中，将 OAuth 成功后的重定向地址改为前端地址：

**Spring Boot 配置示例：**
```yaml
# application.yml
oauth:
  github:
    redirect-uri: http://localhost:1420/?token={token}
```

或者在代码中配置：
```java
// OAuth2ClientConfig.java
.redirectUri("http://localhost:1420/?token={registrationId}")
```

### 方案 B：使用 Tauri Webview（无需修改后端）

使用 Tauri 的 WebviewWindow 在应用内打开 OAuth 页面，并监听 URL 变化。

**优点：**
- 无需修改后端
- 用户体验更好（不离开应用）

**缺点：**
- 需要 Tauri API 支持
- 需要配置 CSP

### 方案 C：使用 Deep Link / 自定义 URL Scheme

配置 Tauri 应用支持自定义 URL scheme，如 `agent-app://callback`。

**Tauri 配置 (tauri.conf.json)：**
```json
{
  "bundle": {
    "externalBin": [],
    "resources": [],
    "targets": ["deb", "app", "msi"],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    }
  },
  "deepLink": {
    "domains": [],
    "schemes": ["agent-app"]
  }
}
```

**后端配置：**
```
redirect_uri: agent-app://callback
```

## 当前前端实现

当前前端代码支持以下回调格式：
- `http://localhost:1420/?token=xxx`
- `http://localhost:1420/login?token=xxx`

Token 会自动从 URL 参数中提取并保存到 localStorage。

## 快速测试

### 使用后端配置测试

如果后端已配置正确的重定向地址：

1. 启动后端：`cd backend && mvn spring-boot:run`
2. 启动前端：`yarn tauri dev`
3. 点击登录
4. 完成授权后应自动跳转回应用

### 手动测试登录流程

如果后端还未配置正确的重定向，可以手动测试：

1. 访问 GitHub OAuth URL
2. 授权成功后，复制回调 URL 中的 token
3. 手动访问 `http://localhost:1420/?token=你的 token`
4. 验证是否登录成功

## 生产环境配置

### 后端配置
```yaml
oauth:
  github:
    redirect-uri: https://your-domain.com/?token={token}
```

### 前端配置
确保 CSP 允许与后端 API 的通信：
```json
{
  "csp": "default-src 'self' https://api.your-domain.com; connect-src 'self' https://api.your-domain.com"
}
```

## 联系后端开发

请将以下信息告知后端开发人员：

**需要修改的配置：**
- OAuth 成功后的重定向地址应从 `http://localhost:3000` 改为 `http://localhost:1420`
- 重定向 URL 需要包含 token 参数
- 示例：`http://localhost:1420/?token=eyJhbGciOiJIUzI1NiIs...`

**API 端点：**
- `GET /api/auth/github/url` - 获取 GitHub OAuth URL
- `GET /api/auth/github/callback?code=xxx&state=xxx` - OAuth 回调
- `GET /api/auth/me` - 获取当前用户信息（需要 Token）
