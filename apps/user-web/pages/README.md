# iframe 独立入口说明

## 入口职责

`iframe.html` 是 AI 生成应用预览的独立 HTML 入口，加载 `iframe-main.tsx` 后渲染 `IframeStandalonePage`。

入口只负责三件事：

- 读取 URL 参数里的 `taskid` 或 `taskId`。
- 校验当前用户 token 是否有效。
- 鉴权通过后挂载 AI 生成应用 iframe，鉴权失败时显示 401 页面。

## 访问参数

```text
/pages/iframe.html?taskid=<taskId>
```

兼容参数名：

- `taskid`
- `taskId`

缺少任务 ID 时由 `IframeStandalonePage` 展示缺省提示。

## 鉴权流程

`IframeAuthGate` 负责入口鉴权：

1. 从 `useAuthStore` 读取本地 `accessToken`。
2. 没有 token 时显示 401 页面。
3. 有 token 时通过 `requestClient` 调用 `/api/v1/login/test-token`。
4. 校验成功后写入 `setUserInfo`，再渲染 `IframeStandalonePage`。
5. 校验失败后调用 `clearAuth`，显示 401 页面。

首次鉴权通过模块级 `iframeAuthPromise` 做请求去重，避免 React `StrictMode` 在开发环境触发两次 `useEffect` 时重复请求 `test-token`。

## token 过期检测

AI 生成页面可能绕过宿主应用的 `requestClient`，静态页面也可能长期没有接口请求。宿主入口会在 iframe 渲染后持续检查 token：

- 每 60 秒调用一次 `/api/v1/login/test-token`。
- 浏览器窗口重新获得焦点时立即校验一次。
- 页面从后台切回前台时立即校验一次。
- 任意一次校验失败后清理 token，并切换到 401 页面。

心跳校验每次都会发起新的 `test-token` 请求，保证能发现运行期间过期的 token。

## 维护约定

- 入口鉴权留在 `iframe-main.tsx`，共享 iframe 渲染能力留在 `@ff-ai-frontend/components`。
- `test-token` 请求需要设置 `skipErrorHandler: true`，让当前入口自行展示 401 页面。
- 调整心跳间隔时优先修改 `IFRAME_AUTH_CHECK_INTERVAL`。
- 401 页面文案当前只服务这个独立入口，直接在入口文件中维护。
