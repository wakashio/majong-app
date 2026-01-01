export interface SessionPlayer {
  id: string;
  sessionId: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

import type { UmaOkaConfig } from "../services/umaOkaCalculationService";

export interface Session {
  id: string;
  date: string;
  name?: string;
  umaOkaConfig?: UmaOkaConfig;
  createdAt: string;
  updatedAt: string;
  sessionPlayers: SessionPlayer[];
  hanchans?: any[];
}

export interface SessionListItem {
  id: string;
  date: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  playerCount: number;
  hanchanCount: number;
  players: {
    id: string;
    name: string;
  }[];
}

export interface CreateSessionRequest {
  date: string;
  name?: string;
  playerIds: string[];
  umaOkaConfig?: UmaOkaConfig;
}

export interface UpdateSessionRequest {
  name?: string;
  playerIds?: string[];
  umaOkaConfig?: UmaOkaConfig;
}

export interface SessionsListResponse {
  data: SessionListItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface SessionResponse {
  data: Session;
}

export interface DeleteSessionResponse {
  data: {
    id: string;
    deleted: boolean;
  };
}

export interface PlayerStatistics {
  playerId: string;
  playerName: string;
  totalWins: number;
  totalTsumo: number;
  totalRon: number;
  totalDealIn: number;
  totalFinalScore: number;
  rank: number;
}

export interface SessionStatistics {
  sessionId: string;
  totalRounds: number;
  totalHanchans: number;
  playerStatistics: PlayerStatistics[];
}

export interface SessionStatisticsResponse {
  data: SessionStatistics;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

