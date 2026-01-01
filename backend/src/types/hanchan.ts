export enum HanchanStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export interface HanchanPlayer {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  seatPosition: number;
  initialScore: number;
  finalScore?: number; // ウマオカ考慮前の値（currentScore）
  finalScoreWithUmaOka?: number; // ウマオカ考慮後の値
}

export interface Hanchan {
  id: string;
  name?: string;
  startedAt: string;
  endedAt?: string;
  status: HanchanStatus;
  createdAt: string;
  updatedAt: string;
  hanchanPlayers: HanchanPlayer[];
}

export interface CreateHanchanRequest {
  name?: string;
  playerIds: string[];
  seatPositions?: number[];
}

export interface UpdateHanchanRequest {
  name?: string;
  status?: HanchanStatus;
  finalScores?: Record<string, number>;
}

export interface HanchanResponse {
  data: Hanchan;
}

export interface HanchansListResponse {
  data: Hanchan[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface HanchanPlayerStatistics {
  playerId: string;
  playerName: string;
  seatPosition: number;
  initialScore: number;
  currentScore: number;
  currentRank: number;
  finalScore?: number;
  rank?: number;
  totalWins: number;
  totalTsumo: number;
  totalRon: number;
  totalRonTarget: number;
  totalTenpaiOnDraw: number;
  totalRiichi: number;
}

export interface HanchanStatistics {
  hanchanId: string;
  hanchanName?: string;
  startedAt: string;
  endedAt?: string;
  status: "IN_PROGRESS" | "COMPLETED";
  totalRounds: number;
  players: HanchanPlayerStatistics[];
}

export interface HanchanStatisticsResponse {
  data: HanchanStatistics;
}

export interface HanchanHistoryItem {
  roundId: string;
  roundNumber: number;
  wind: "EAST" | "SOUTH" | "WEST" | "NORTH";
  dealerPlayerId: string;
  dealerPlayerName: string;
  honba: number;
  riichiSticks: number;
  resultType?: "TSUMO" | "RON" | "DRAW" | "NAGASHI_MANGAN" | "SPECIAL_DRAW";
  specialDrawType?: "FOUR_KAN" | "FOUR_WIND" | "NINE_TERMINALS";
  startedAt?: string;
  endedAt?: string;
  scores: {
    playerId: string;
    playerName: string;
    scoreChange: number;
    isDealer: boolean;
    isWinner: boolean;
    isRonTarget?: boolean;
    han?: number;
    fu?: number;
    yaku?: string[];
  }[];
}

export interface HanchanHistoryResponse {
  data: HanchanHistoryItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

