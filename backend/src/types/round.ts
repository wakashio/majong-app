export enum Wind {
  EAST = "EAST",
  SOUTH = "SOUTH",
  WEST = "WEST",
  NORTH = "NORTH",
}

export enum RoundResultType {
  TSUMO = "TSUMO",
  RON = "RON",
  DRAW = "DRAW",
  NAGASHI_MANGAN = "NAGASHI_MANGAN",
  SPECIAL_DRAW = "SPECIAL_DRAW",
}

export enum SpecialDrawType {
  FOUR_KAN = "FOUR_KAN",
  FOUR_WIND = "FOUR_WIND",
  NINE_TERMINALS = "NINE_TERMINALS",
}

export enum RoundActionType {
  NAKI = "NAKI",
  RIICHI = "RIICHI",
}

export enum NakiType {
  PON = "PON",
  CHI = "CHI",
  DAIMINKAN = "DAIMINKAN",
  ANKAN = "ANKAN",
}

export interface Score {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  scoreChange: number;
  isDealer: boolean;
  isWinner: boolean;
  isRonTarget?: boolean;
  isTenpai?: boolean;
  han?: number;
  fu?: number;
  yaku?: string[];
}

export interface Naki {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  type: NakiType;
  targetPlayerId?: string;
  targetPlayer?: {
    id: string;
    name: string;
  };
  tiles: string[];
}

export interface RoundAction {
  id: string;
  roundId: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  type: RoundActionType;
  declaredAt: string | null;
  nakiType: NakiType | null;
  targetPlayerId: string | null;
  targetPlayer?: {
    id: string;
    name: string;
  } | null;
  tiles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Riichi {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  isDoubleRiichi: boolean;
  isIppatsu: boolean;
  declaredAt: string;
}

export interface Round {
  id: string;
  hanchanId: string;
  roundNumber: number;
  wind: Wind;
  dealerPlayerId: string;
  dealerPlayer: {
    id: string;
    name: string;
  };
  honba: number;
  riichiSticks: number;
  resultType?: RoundResultType;
  specialDrawType?: SpecialDrawType;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  scores?: Score[];
  nakis?: Naki[];
  riichis?: Riichi[];
}

export interface CreateRoundRequest {
  roundNumber: number;
  wind: Wind;
  dealerPlayerId: string;
  honba?: number;
  riichiSticks?: number;
}

export interface UpdateRoundRequest {
  honba?: number;
  riichiSticks?: number;
  dealerPlayerId?: string;
  startedAt?: Date;
  endedAt?: Date;
}

export interface CreateNakiRequest {
  playerId: string;
  type: NakiType;
  targetPlayerId?: string;
  tiles: string[];
}

export interface CreateRoundActionRequest {
  type: RoundActionType;
  playerId: string;
  nakiType?: NakiType;
  targetPlayerId?: string;
  tiles?: string[];
}

export interface CreateRiichiRequest {
  playerId: string;
  isDoubleRiichi?: boolean;
  isIppatsu?: boolean;
}

export interface ScoreData {
  playerId: string;
  scoreChange: number;
  isDealer: boolean;
  isWinner: boolean;
  isRonTarget?: boolean;
  isTenpai?: boolean;
  han?: number;
  fu?: number;
  yaku?: string[];
}

export interface EndRoundRequest {
  resultType: RoundResultType;
  specialDrawType?: SpecialDrawType;
  scores?: ScoreData[];
}

export interface RoundResponse {
  data: Round;
}

export interface RoundsListResponse {
  data: Round[];
}

export interface NakiResponse {
  data: Naki;
}

export interface RoundActionResponse {
  data: RoundAction;
}

export interface RiichiResponse {
  data: Riichi;
}

export interface CalculateScoreRequest {
  resultType: RoundResultType;
  winnerPlayerId?: string;
  ronTargetPlayerId?: string;
  winnerScore?: number;
  yaku?: string[];
  isNagashiMangan?: boolean;
}

export interface CalculatedScore {
  playerId: string;
  scoreChange: number;
  isDealer: boolean;
  isWinner: boolean;
  isRonTarget?: boolean;
  han?: number;
  fu?: number;
  yaku?: string[];
  calculatedScore: number;
}

export interface CalculateScoreResponse {
  data: {
    scores: CalculatedScore[];
    totalRiichiSticks: number;
    totalHonba: number;
  };
}

export interface CalculateNextSettingsRequest {
  resultType: RoundResultType;
  winnerPlayerId?: string;
  isDealerTenpai?: boolean;
}

export interface CalculateNextSettingsResponse {
  data: {
    nextRiichiSticks: number;
    nextHonba: number;
    isRenchan: boolean;
    nextRoundNumber: number;
    nextWind: "EAST" | "SOUTH" | "WEST" | "NORTH";
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

