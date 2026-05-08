# 缓存加密设计

## 背景

`packages/utils` 为两个前端应用提供共享浏览器工具。一些缓存数据应避免以可读明文形式存储在 `localStorage`、`sessionStorage` 或其他浏览器侧缓存层中。

第一版实现是一个 MVP 工具，聚焦于加密和解密可 JSON 序列化的缓存值。它将存储层与加密分离，因此现有 `storage` 辅助对象可以保持同步，加密仍然是显式的异步步骤。

## 目标

- 在 `packages/utils/src/crypto` 下添加缓存加密工具。
- 通过 `@ff-ai-frontend/utils/crypto` 暴露 `encryptCacheValue()` 和 `decryptCacheValue()`。
- 优先使用浏览器 Web Crypto API 和 `AES-GCM`。
- 当 `crypto.subtle` 不可用时回退到 `crypto-js`。
- 保持公共 API 精简且异步。
- 以字符串形式返回加密载荷，调用方可以直接存储。
- 对无效、被篡改或无法解密的载荷执行 reject，避免返回明文。
- 保持实现具备 MVP 尺寸，便于阅读。

## 范围外事项

- 管理 secret 值。
- 轮换应用 secret 或管理 secret 版本。
- 将加密直接集成到 `local` 或 `session` storage 辅助对象。
- 针对能够读取前端 bundle 的攻击者提供服务端级别防护。

## 目录结构

```text
packages/utils/src/
  crypto/
    cache-crypto.ts
    crypto-js-strategy.ts
    index.ts
    types.ts
    web-crypto-strategy.ts
```

## 模块职责

`cache-crypto.ts` 负责公共实现。它校验 secret，使用 `JSON.stringify` 序列化值，解析加密载荷，并选择加密策略。

`web-crypto-strategy.ts` 使用 Web Crypto `AES-GCM` 实现首选浏览器路径。它为每次加密使用 12 字节随机 IV，并按 secret 缓存派生出的 `CryptoKey`。

`crypto-js-strategy.ts` 实现回退路径。它使用 `AES-CBC` 加密，并使用 `HMAC-SHA256` 做完整性校验。每次加密使用随机 16 字节 salt 和 16 字节 IV。

`types.ts` 定义加密载荷结构。

`index.ts` 导出公共 crypto API。

## 公共 API

```ts
import {
  decryptCacheValue,
  encryptCacheValue,
} from '@ff-ai-frontend/utils/crypto'

const secret = import.meta.env.VITE_CACHE_CRYPTO_SECRET

const encrypted = await encryptCacheValue({ token: 'abc' }, secret)
localStorage.setItem('cache:user', encrypted)

const payload = localStorage.getItem('cache:user')
const data = await decryptCacheValue<{ token: string }>(payload!, secret)
```

API 形态为：

```ts
encryptCacheValue(value: unknown, secret: string): Promise<string>
decryptCacheValue<T = unknown>(payload: string, secret: string): Promise<T>
```

## Web Crypto 载荷

当 `globalThis.crypto?.subtle` 存在时使用 Web Crypto。

```ts
type WebCryptoEncryptedCachePayload = {
  alg: 'AES-GCM'
  ciphertext: string
  iv: string
  v: 1
}
```

行为：

- 使用 `SHA-256` 哈希 secret。
- 将 digest 导入为 `AES-GCM` key。
- 按 secret 缓存派生出的 `CryptoKey`。
- 每次加密使用新的 12 字节 IV。
- ciphertext 和 IV 使用 Base64 编码。

## CryptoJS 回退载荷

仅在 Web Crypto 不可用时使用 CryptoJS。

```ts
type CryptoJsEncryptedCachePayload = {
  alg: 'AES-CBC-HMAC-SHA256'
  ciphertext: string
  iv: string
  mac: string
  salt: string
  v: 1
}
```

行为：

- 使用 `import('crypto-js')` 懒加载回退模块。
- 每次加密使用新的 16 字节 salt 和 16 字节 IV。
- 将 `SHA-512(secret + ':' + salt)` 拆分为加密 key 和 MAC key。
- `AES-CBC` 加密序列化后的值。
- `HMAC-SHA256` 对版本、算法、salt、IV 和 ciphertext 签名。
- 解密在尝试解析明文前校验 MAC。

## 错误处理

工具在以下情况下抛出错误：

- `secret` 是空字符串。
- 值无法用 `JSON.stringify` 表示。
- 载荷 JSON 无效。
- 载荷结构或算法不受支持。
- CryptoJS 回退路径中的 MAC 校验失败。
- secret 错误或 ciphertext 无法解密。

调用方应捕获解密错误，移除损坏的缓存条目，并获取新数据。

## 安全边界

该工具保护缓存值，降低本地随手查看和意外明文暴露的风险。固定前端 secret 可以提升缓存隐私性，但任何能够检查已构建前端 bundle 或运行时环境的人仍然可以获取 secret。

使用 32 字符或更长的随机 `VITE_CACHE_CRYPTO_SECRET`。更高风险的数据应在未来迭代中使用服务端提供或用户派生的 secret。

## 验证

当前验证命令：

```bash
pnpm --filter @ff-ai-frontend/utils format
pnpm --filter @ff-ai-frontend/utils typecheck
pnpm --filter @ff-ai-frontend/utils lint
pnpm --filter @ff-ai-frontend/utils build
```

行为检查：

- Web Crypto 环境使用 `alg: 'AES-GCM'` 加密，并可以成功解密。
- 模拟缺失 `crypto.subtle` 时，使用 `alg: 'AES-CBC-HMAC-SHA256'` 加密，并可以成功解密。
- 被篡改的回退载荷会 MAC 校验失败。
