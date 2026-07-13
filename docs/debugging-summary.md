# ff-ai-frontend 调试流程总结与踩坑记录

> 基于 Chrome DevTools MCP 调试 admin-web 合规规则库页面的实际经验整理。
> 下次调试时，先读本文档，按流程执行。

---

## 一、调试流程（标准化 SOP）

### 第 0 步：确认前置条件（用户负责）

**需要用户手动启动的服务：**
- 目标前端 dev server（user-web: `pnpm --filter "@ff-ai-frontend/user-web" run dev` → port 8080）
- 目标前端 dev server（admin-web: `pnpm --filter "@ff-ai-frontend/admin-web" run dev` → port 8081）
- 后端 API server（默认 `http://127.0.0.1:11499`）

**Claude 确认：** 用 `curl` 检查端口是否响应，若未启动，告知用户手动启动，不自动启动。

### 第 1 步：确认 Chrome 调试端口

```bash
# 检查 9222 端口是否可用
curl -s http://127.0.0.1:9222/json/version
```

若不可用，引导用户启动 Chrome 调试模式：
```bash
osascript -e 'quit app "Google Chrome"' 2>/dev/null; sleep 2
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/chrome-mcp-profile" &
```

### 第 2 步：确认 Chrome DevTools MCP 已连接

```bash
claude mcp list | grep chrome-devtools
```

若未连接，安装：
```bash
claude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest --browser-url=http://127.0.0.1:9222 --no-usage-statistics
```

### 第 3 步：询问用户要调试的页面

**必须先问用户要调试哪个页面（URL），不要自动导航。**

问法示例：
> 请提供要调试的页面 URL（例如：`http://localhost:8081/grc/rules`）

收到 URL 后，执行：
```bash
curl -s -X PUT "http://127.0.0.1:9222/json/new?<用户提供的URL>" -H "Content-Type: application/json"
```
记录返回的 `id`（tab ID）。

### 第 4 步：捕获控制台输出

使用 CDP 脚本（`/tmp/debug-app.cjs`）连接 tab 并捕获 console：

```bash
NODE_PATH=/tmp/node_modules node /tmp/debug-app.cjs <tab_id>
```

脚本功能：
- 连接 `ws://127.0.0.1:9222/devtools/page/<tab_id>`
- 监听 `Runtime.consoleAPICalled`、`Runtime.exceptionThrown`、`Log.entryAdded`
- 等待 15 秒后输出汇总

### 第 5 步：分析错误

按以下顺序排查：

1. **Runtime error（JS 错误）** — 优先处理
2. **Network error（404/5xx）** — 检查资源路径
3. **Warning（废弃 API）** — 非阻塞，可后续修复

### 第 6 步：定位并修复

- 用 `list_console_messages` 或 dev server log 获取完整 stack trace
- 找到第一个业务代码文件（跳过 react-dom / react-router 内部）
- 按错误信息定位代码行
- **只修当前 error 相关的代码，禁止顺手大改**

### 第 7 步：验证修复

1. 等待 Vite HMR（或重启 dev server 清缓存）
2. 打开新 tab 重新加载页面
3. 再次运行 debug 脚本确认 error 消失
4. 确认**无新增 error/warning**

### 第 8 步：输出修复清单

```
# | Error 原文 | 文件:行 | 根因类型 | 修复方式 | 验证结果
1 | ... | src/xxx.tsx:42 | ... | ... | ✅ console clean
```

---
