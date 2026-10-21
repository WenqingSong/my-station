# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:22-alpine AS builder

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存加速依赖安装
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码并构建（产物输出到 /app/dist）
COPY . .

# COS credentials only exist for this build step. They are never ARG/ENV
# instructions, copied files, or available in the final Nginx image.
# A complete, hash-verified local cache can build offline without credentials.
RUN --mount=type=secret,id=cos_credentials,env=COS_CREDENTIALS_JSON \
    --mount=type=secret,id=cos_secret_id,env=COS_SECRET_ID \
    --mount=type=secret,id=cos_secret_key,env=COS_SECRET_KEY \
    --mount=type=secret,id=cos_session_token,env=COS_SESSION_TOKEN \
    npm run assets:sync
RUN npm run build

# ---------- serve ----------
FROM nginx:1.27-alpine

# 替换默认站点配置：静态站点 + SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 仅把构建出的前端静态资源拷贝进镜像
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
