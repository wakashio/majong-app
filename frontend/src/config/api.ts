// ビルド時の環境変数または実行時のwindowオブジェクトから取得
// Cloud Runでは実行時に環境変数を設定できないため、windowオブジェクトを使用
const getApiBaseUrl = (): string => {
  // ビルド時の環境変数（開発環境用）
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 実行時のwindowオブジェクトから取得（本番環境用）
  // HTMLの<script>タグで設定される
  if (typeof window !== 'undefined') {
    const apiBaseUrl = (window as { __API_BASE_URL__?: string }).__API_BASE_URL__;
    if (apiBaseUrl) {
      return apiBaseUrl;
    }
  }

  // デフォルト値（開発環境用）
  return "http://localhost:3000";
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  players: `${API_BASE_URL}/api/players`,
} as const;

