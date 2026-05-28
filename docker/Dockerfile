FROM node:22-alpine AS base

ENV TURBO_TELEMETRY_DISABLED=1

RUN npm config set registry https://registry.npmmirror.com
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

FROM base AS pruner

WORKDIR /app

ARG APP_NAME

COPY . .

RUN pnpm turbo prune @ff-ai-frontend/${APP_NAME} --docker

FROM base AS builder

WORKDIR /app

ARG APP_NAME

COPY --from=pruner /app/out/json/ .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store && \
  pnpm install --frozen-lockfile --prefer-offline

COPY --from=pruner /app/out/full/ .

RUN --mount=type=cache,id=turbo-cache,target=/app/.turbo/cache \
  pnpm turbo run build --filter=@ff-ai-frontend/${APP_NAME}

FROM nginx:1.27-alpine AS runtime

ARG APP_NAME

COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/apps/${APP_NAME}/dist /usr/share/nginx/html

EXPOSE 80
