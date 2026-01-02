# フロントエンド用Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係をコピーしてインストール
COPY package*.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# ビルド時の環境変数（ARGで受け取る）
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# ビルド
RUN npm run build

# 本番用イメージ（Nginx）
FROM nginx:alpine

# ビルド成果物をコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# 環境変数をHTMLに注入するスクリプトをコピー
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# ポートを公開
EXPOSE 80

# エントリーポイントを設定
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

