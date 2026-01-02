#!/bin/sh
# 環境変数をHTMLに注入するスクリプト

# API_BASE_URL環境変数が設定されている場合、HTMLに注入
if [ -n "$VITE_API_BASE_URL" ]; then
  # index.htmlにスクリプトタグを追加
  sed -i "s|</head>|<script>window.__API_BASE_URL__ = '$VITE_API_BASE_URL';</script></head>|" /usr/share/nginx/html/index.html
fi

# Nginxを起動
exec "$@"

