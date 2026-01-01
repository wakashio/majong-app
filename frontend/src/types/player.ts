export interface Player {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlayerRequest {
  name: string;
}

export interface BulkCreatePlayerRequest {
  names: string[];
}

export interface BulkCreatePlayerResponse {
  data: Player[];
}

export interface UpdatePlayerRequest {
  name: string;
}

export interface PlayersListResponse {
  data: Player[];
}

export interface PlayerResponse {
  data: Player;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PlayerStatistics {
  playerId: string;
  playerName: string;
  totalHanchans: number;
  totalRounds: number;
  totalWins: number;
  totalTsumo: number;
  totalRon: number;
  totalRonTarget: number;
  averageRank: number;
  totalFinalScore: number;
  maxScore: number;
  minScore: number;
  winRate: number;
  ronTargetRate: number;
}

export interface PlayerStatisticsResponse {
  data: PlayerStatistics;
}

export interface PlayerHistoryItem {
  hanchanId: string;
  hanchanName?: string;
  startedAt: string;
  endedAt?: string;
  status: "IN_PROGRESS" | "COMPLETED";
  seatPosition: number;
  initialScore: number;
  finalScore?: number;
  rank?: number;
  totalRounds: number;
}

export interface PlayerHistoryResponse {
  data: PlayerHistoryItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

