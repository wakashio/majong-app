export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  players: `${API_BASE_URL}/api/players`,
} as const;

