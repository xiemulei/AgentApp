# 登录配置说明

## GitHub OAuth 流程

1. 用户点击"使用 GitHub 登录"按钮
2. 前端调用 `GET /api/auth/github/url` 获取 GitHub OAuth 授权 URL
3. 用户被重定向到 GitHub 进行授权
4. GitHub 授权成功后回调到后端 `/api/auth/github/callback`
5. 后端处理回调，获取用户信息并生成 JWT Token
6. **后端需要将用户重定向到前端应用地址，并带上 token 参数**

## 后端配置

### OAuth 成功后的重定向 URL

后端在 GitHub OAuth 成功后，需要重定向到前端应用地址：

**开发环境:**
```
http://localhost:1420/?token={jwt_token}
```

**生产环境:**
根据实际部署地址配置

### 重定向参数

重定向 URL 应包含以下参数：
- `token`: JWT Token（必需）
- 可选：`userId`, `username`, `avatarUrl` 等用户信息

示例：
```
http://localhost:1420/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 前端配置

### Tauri 开发服务器

前端开发时使用 Vite 开发服务器，默认端口为 `1420`。

```bash
yarn tauri dev
```

### CSP 配置

已在 `tauri.conf.json` 中配置了 Content Security Policy：

```json
{
  "csp": "default-src 'self' http://localhost:8091; connect-src 'self' http://localhost:8091; ..."
}
```

确保允许与后端 API (`http://localhost:8091`) 的通信。

## 测试登录

1. 启动后端服务（端口 8091）
2. 启动前端开发服务器：`yarn tauri dev`
3. 点击"使用 GitHub 登录"
4. 完成 GitHub 授权
5. 检查是否正确重定向回前端应用并登录成功

## 常见问题

### 1. "获取登录 URL 失败"

**原因：** 后端服务未启动或网络问题

**解决：**
- 检查后端服务是否运行在 `http://localhost:8091`
- 检查浏览器控制台的网络请求

### 2. OAuth 成功后没有重定向回前端

**原因：** 后端配置的重定向地址不正确

**解决：**
- 检查后端 OAuth 回调处理逻辑
- 确认重定向地址配置为前端应用地址

### 3. 登录后仍然显示登录页面

**原因：** Token 未正确保存或用户信息获取失败

**解决：**
- 检查 localStorage 中是否有 `auth_token`
- 检查 `/api/auth/me` 接口是否正常返回用户信息
