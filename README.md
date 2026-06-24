## 部署

本项目提供 Docker 部署方案，`user-web` 和 `admin-web` 会分别构建为独立的 Nginx 镜像。

### 配置环境变量

从示例文件创建部署环境变量文件，并设置后端服务地址：

```bash
cp docker/.env.example docker/.env
```

### 构建并启动

推荐在服务器上使用部署脚本：

```bash
sh docker/deploy.sh start
```

更新代码并重新部署：

```bash
sh docker/deploy.sh update
```

`update` 默认执行 `git pull --ff-only`。需要只重建镜像和重启容器时执行：

```bash
SKIP_GIT_PULL=1 sh docker/deploy.sh update
```

常用运维命令：

```bash
sh docker/deploy.sh status
sh docker/deploy.sh logs
sh docker/deploy.sh restart
sh docker/deploy.sh stop
```

Dockerfile 使用 BuildKit cache mount 复用 `pnpm` 依赖缓存和 Turbo 构建缓存。应用源码变化时会复用依赖安装层；重复构建同一应用时会复用 `.turbo/cache`。依赖安装使用 `--prefer-offline` 优先复用 pnpm store 缓存。

启动后访问：

- 用户端：`http://localhost:18080`
- 管理端：`http://localhost:18081`

## 经验沉淀

本项目使用轻量经验库管理长期有效的 AI 编码经验。经验入口是 `docs/experience/README.md`，具体经验按主题存放在 `docs/experience/topics/*.md`。

经验用于沉淀可迁移的判断规则，适合记录模型容易重复犯错、后续任务可复用的工程判断。单次字段流水账、临时修复细节和过程记录应提炼成下一次可执行的决策规则。

推荐提示词：

```text
把这次经验沉淀到项目经验里。
```

更明确的写法：

```text
把刚才这个问题沉淀成一条项目经验，放到合适的经验 topic 里。
```

指定 topic 的写法：

```text
把这次 Table 滚动问题沉淀到第三方组件经验 topic 里。
```
