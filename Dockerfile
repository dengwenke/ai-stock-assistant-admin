# ========== 阶段一：构建 ==========
FROM node:20-alpine AS build

WORKDIR /app

# 先只复制依赖清单，利用 Docker 层缓存：未变更时跳过后续 install
COPY package.json yarn.lock* package-lock.json* ./

# 使用 lockfile 保证依赖一致（优先 yarn）
RUN if [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile; else npm ci || npm install; fi

# 再复制源码与构建配置，触发构建
COPY . .

RUN npm run build

# ========== 阶段二：运行（Nginx 托管静态资源） ==========
FROM nginx:alpine AS runtime

# 从构建阶段复制产物
COPY --from=build /app/dist /usr/share/nginx/html

# 自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# 健康检查：根路径可访问即视为就绪
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
