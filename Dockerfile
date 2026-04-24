# ===== Stage 1: Build =====
FROM node:20-alpine AS builder

WORKDIR /build

# 利用缓存（构建上下文是根目录，所以要指定完整路径）
COPY ji-ai-agent-frontend/frontend/package.json ji-ai-agent-frontend/frontend/package-lock.json ./
RUN npm ci

COPY ji-ai-agent-frontend/frontend/ .

# Vite 构建，产出在 dist/
RUN npm run build

# ===== Stage 2: Runtime =====
FROM nginx:1.27-alpine

# 拷贝构建产物
COPY --from=builder /build/dist /usr/share/nginx/html

# 拷贝 Nginx 模板（运行时用 envsubst 替换变量）
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Railway 注入 PORT；BACKEND_INTERNAL_URL 我们自己设
# nginx:alpine 的 entrypoint 会自动处理 /etc/nginx/templates/*.template
EXPOSE 80

# 默认 entrypoint 会执行 envsubst 并启动 nginx
