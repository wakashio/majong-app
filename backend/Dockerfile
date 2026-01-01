# バックエンド用Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係をコピーしてインストール
COPY package*.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# Prismaクライアントを生成
RUN npx prisma generate

# TypeScriptをビルド
RUN npm run build

# 本番用イメージ
FROM node:20-alpine

WORKDIR /app

# 本番用の依存関係のみインストール
COPY package*.json ./
RUN npm ci --only=production

# ビルド成果物をコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# ポートを公開
EXPOSE 3000

# アプリケーションを起動
CMD ["node", "dist/index.js"]

